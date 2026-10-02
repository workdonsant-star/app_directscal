import "server-only";

import {
  EMBEDDING_DIMENSIONS,
  getEmbeddingModelKey,
  getEmbeddingProviderConfig,
  getOllamaBaseUrl,
} from "@/lib/agent/config";
import { getRequiredServerEnv } from "@/lib/env";

export type EmbeddingPurpose = "document" | "query";

export type EmbeddingResult = {
  modelKey: string;
  vectors: number[][];
};

const GEMINI_BATCH_SIZE = 100;
const REQUEST_TIMEOUT_MS = 30_000;

function assertDimensions(vectors: number[][]) {
  for (const vector of vectors) {
    if (vector.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `O modelo de embeddings retornou ${vector.length} dimensões; o índice espera ${EMBEDDING_DIMENSIONS}.`,
      );
    }
  }

  return vectors;
}

async function embedWithGemini(
  model: string,
  texts: string[],
  purpose: EmbeddingPurpose,
) {
  const apiKey = getRequiredServerEnv("GEMINI_API_KEY");
  const vectors: number[][] = [];

  for (let start = 0; start < texts.length; start += GEMINI_BATCH_SIZE) {
    const batch = texts.slice(start, start + GEMINI_BATCH_SIZE);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:batchEmbedContents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          requests: batch.map((text) => ({
            model: `models/${model}`,
            content: { parts: [{ text }] },
            taskType: purpose === "query" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT",
            outputDimensionality: EMBEDDING_DIMENSIONS,
          })),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini embeddings falhou com status ${response.status}.`);
    }

    const payload = (await response.json()) as {
      embeddings?: Array<{ values?: number[] }>;
    };

    vectors.push(...(payload.embeddings ?? []).map((item) => item.values ?? []));
  }

  return vectors;
}

async function embedWithOllama(
  model: string,
  texts: string[],
  purpose: EmbeddingPurpose,
) {
  // Os modelos nomic esperam prefixos de tarefa para separar pergunta e documento.
  const prefixed = model.startsWith("nomic-embed")
    ? texts.map((text) =>
        purpose === "query" ? `search_query: ${text}` : `search_document: ${text}`,
      )
    : texts;
  const response = await fetch(`${getOllamaBaseUrl()}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: prefixed }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Ollama embeddings falhou com status ${response.status}.`);
  }

  const payload = (await response.json()) as { embeddings?: number[][] };
  return payload.embeddings ?? [];
}

export function isEmbeddingEnabled() {
  return getEmbeddingModelKey() !== null;
}

export async function embedTexts(
  texts: string[],
  purpose: EmbeddingPurpose,
): Promise<EmbeddingResult | null> {
  const config = getEmbeddingProviderConfig();
  const modelKey = getEmbeddingModelKey();

  if (!config.model || !modelKey || texts.length === 0) return null;

  const vectors =
    config.provider === "gemini"
      ? await embedWithGemini(config.model, texts, purpose)
      : await embedWithOllama(config.model, texts, purpose);

  if (vectors.length !== texts.length) {
    throw new Error("O provedor de embeddings não retornou um vetor por texto.");
  }

  return { modelKey, vectors: assertDimensions(vectors) };
}

export function toPgVector(vector: number[]) {
  return `[${vector.join(",")}]`;
}
