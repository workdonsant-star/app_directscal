import "server-only";

import { getAnswerProviderConfig } from "@/lib/agent/config";
import { getRequiredServerEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Conta quantas vezes a mesma pessoa já fez a mesma pergunta. Embeddings não
// separam bem assuntos vizinhos (onboarding de clientes × de funcionários),
// então o Gemini julga o sentido; sem ele, vale só o texto normalizado.

const LOOKBACK_DAYS = 30;
const MAX_PREVIOUS_QUESTIONS = 30;
const JUDGE_TIMEOUT_MS = 8_000;

const JUDGE_SYSTEM_PROMPT = [
  "Você compara perguntas feitas por uma mesma pessoa a um assistente interno de processos.",
  "Duas perguntas são a MESMA quando pedem a mesma informação, ainda que com outras palavras.",
  "Assuntos vizinhos não contam: férias × reembolso, onboarding de clientes × de funcionários, fechamento financeiro × comercial são DIFERENTES.",
  "Devolva os índices das perguntas anteriores que são a mesma pergunta da nova.",
].join(" ");

export function normalizeQuestion(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

async function judgeSameQuestions(model: string, question: string, previous: string[]) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": getRequiredServerEnv("GEMINI_API_KEY"),
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: JUDGE_SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Perguntas anteriores:\n${previous
                  .map((item, index) => `${index}. ${item}`)
                  .join("\n")}\n\nNova pergunta: ${question}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "object",
            properties: { same: { type: "array", items: { type: "integer" } } },
            required: ["same"],
          },
          ...(model.startsWith("gemini-3")
            ? { thinkingConfig: { thinkingLevel: "low" } }
            : {}),
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(JUDGE_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini falhou com status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  const parsed = JSON.parse(text ?? "{}") as { same?: unknown };

  return Array.isArray(parsed.same)
    ? parsed.same.filter(
        (index): index is number =>
          Number.isInteger(index) && index >= 0 && index < previous.length,
      )
    : [];
}

// Devolve o número de vezes que a pergunta já foi feita antes (0 na primeira).
export async function countPreviousAsks(input: {
  organizationId: string;
  externalUserId: string;
  question: string;
}) {
  const supabase = createSupabaseAdminClient();
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("asset_question_audits")
    .select("question")
    .eq("organization_id", input.organizationId)
    .eq("external_user_id", input.externalUserId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MAX_PREVIOUS_QUESTIONS);

  if (error) throw error;

  const previous = data.map((row) => row.question);
  if (previous.length === 0) return 0;

  const normalized = normalizeQuestion(input.question);
  const matches = new Set(
    previous.flatMap((item, index) => (normalizeQuestion(item) === normalized ? [index] : [])),
  );

  const { provider, model } = getAnswerProviderConfig();

  if (provider === "gemini" && model) {
    try {
      for (const index of await judgeSameQuestions(model, input.question, previous)) {
        matches.add(index);
      }
    } catch (error) {
      console.error("[asset-agent] repeat question judge failed", error);
    }
  }

  return matches.size;
}
