import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import {
  ANSWER_SYSTEM_PROMPT,
  buildAnswerUserMessage,
  groundedAnswerJsonSchema,
  groundedAnswerSchema,
  type ConversationTurn,
  type EvidenceSource,
  type GroundedAnswer,
} from "@/lib/agent/answer-policy";
import { getOllamaBaseUrl } from "@/lib/agent/config";
import { getRequiredServerEnv } from "@/lib/env";

const REQUEST_TIMEOUT_MS = 45_000;

// Modelos que aceitam `effort` e o fallback do servidor em recusas. Para os
// demais (por exemplo Haiku 4.5) a chamada segue sem esses parâmetros.
const anthropicModelsWithEffortAndFallback = new Set([
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-sonnet-5-5",
  "claude-fable-5-1",
]);

let anthropicClient: Anthropic | null = null;

function getAnthropicClient() {
  anthropicClient ??= new Anthropic({
    apiKey: getRequiredServerEnv("ANTHROPIC_API_KEY"),
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: 1,
  });

  return anthropicClient;
}

async function answerWithAnthropic(
  model: string,
  question: string,
  evidence: EvidenceSource[],
  history: ConversationTurn[],
): Promise<GroundedAnswer> {
  const client = getAnthropicClient();
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildAnswerUserMessage(question, evidence, history) },
  ];

  if (anthropicModelsWithEffortAndFallback.has(model)) {
    // Perguntas operacionais curtas: esforço baixo mantém latência e custo
    // contidos; o fallback "default" reencaminha recusas de classificador.
    const response = await client.beta.messages.parse({
      model,
      max_tokens: 8000,
      system: ANSWER_SYSTEM_PROMPT,
      messages,
      output_config: {
        effort: "low",
        format: betaZodOutputFormat(groundedAnswerSchema),
      },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      throw new Error(`Anthropic não retornou resposta estruturada (${response.stop_reason}).`);
    }

    return response.parsed_output;
  }

  const response = await client.messages.parse({
    model,
    max_tokens: 4000,
    system: ANSWER_SYSTEM_PROMPT,
    messages,
    output_config: { format: zodOutputFormat(groundedAnswerSchema) },
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`Anthropic não retornou resposta estruturada (${response.stop_reason}).`);
  }

  return response.parsed_output;
}

// O plano gratuito do Gemini devolve 429/503 em picos de demanda; uma nova
// tentativa curta resolve a maior parte dos casos sem esconder falhas reais.
async function fetchGeminiWithRetry(url: string, init: RequestInit) {
  const response = await fetch(url, init);

  if (response.status !== 429 && response.status !== 503) return response;

  await new Promise((resolve) => setTimeout(resolve, 1500));
  return fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
}

async function answerWithGemini(
  model: string,
  question: string,
  evidence: EvidenceSource[],
  history: ConversationTurn[],
): Promise<GroundedAnswer> {
  const response = await fetchGeminiWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": getRequiredServerEnv("GEMINI_API_KEY"),
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: ANSWER_SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [{ text: buildAnswerUserMessage(question, evidence, history) }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseJsonSchema: groundedAnswerJsonSchema,
          // Modelos Gemini 3 raciocinam por padrão; nível baixo reduz a
          // latência de ~15 s para ~2 s em perguntas operacionais curtas.
          ...(model.startsWith("gemini-3")
            ? { thinkingConfig: { thinkingLevel: "low" } }
            : {}),
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini falhou com status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("");

  return groundedAnswerSchema.parse(JSON.parse(text ?? ""));
}

async function answerWithOllama(
  model: string,
  question: string,
  evidence: EvidenceSource[],
  history: ConversationTurn[],
): Promise<GroundedAnswer> {
  const response = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      format: groundedAnswerJsonSchema,
      options: { temperature: 0.1 },
      messages: [
        { role: "system", content: ANSWER_SYSTEM_PROMPT },
        { role: "user", content: buildAnswerUserMessage(question, evidence, history) },
      ],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS * 2),
  });

  if (!response.ok) {
    throw new Error(`Ollama falhou com status ${response.status}.`);
  }

  const payload = (await response.json()) as { message?: { content?: string } };
  return groundedAnswerSchema.parse(JSON.parse(payload.message?.content ?? ""));
}

export async function generateGroundedAnswer(
  provider: "anthropic" | "gemini" | "ollama",
  model: string,
  question: string,
  evidence: EvidenceSource[],
  history: ConversationTurn[] = [],
) {
  switch (provider) {
    case "anthropic":
      return answerWithAnthropic(model, question, evidence, history);
    case "gemini":
      return answerWithGemini(model, question, evidence, history);
    case "ollama":
      return answerWithOllama(model, question, evidence, history);
  }
}
