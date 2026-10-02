// Configuração dos provedores do agente de consulta. Tudo é opcional: sem
// provedor de IA, o agente responde em modo extrativo (trechos citados);
// sem provedor de embeddings, a busca usa somente o índice textual.

export type AnswerProviderId = "anthropic" | "gemini" | "ollama" | "extractive";
export type EmbeddingProviderId = "gemini" | "ollama" | "none";

export const EMBEDDING_DIMENSIONS = 768;

const defaultAnswerModels: Record<Exclude<AnswerProviderId, "extractive">, string> = {
  anthropic: "claude-opus-5-5",
  gemini: "gemini-3.5-flash-lite",
  ollama: "qwen2.5:7b",
};

const defaultEmbeddingModels: Record<Exclude<EmbeddingProviderId, "none">, string> = {
  gemini: "gemini-embedding-001",
  ollama: "nomic-embed-text",
};

function readEnum<T extends string>(value: string | undefined, allowed: readonly T[]) {
  const normalized = value?.trim().toLowerCase();
  return allowed.find((item) => item === normalized) ?? null;
}

export function getOllamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(/\/+$/, "");
}

export function getAnswerProviderConfig(): { provider: AnswerProviderId; model: string | null } {
  const provider =
    readEnum(process.env.ASSET_AGENT_PROVIDER, [
      "anthropic",
      "gemini",
      "ollama",
      "extractive",
    ] as const) ?? "extractive";

  if (provider === "extractive") return { provider, model: null };

  return {
    provider,
    model: process.env.ASSET_AGENT_MODEL?.trim() || defaultAnswerModels[provider],
  };
}

export function getEmbeddingProviderConfig(): {
  provider: EmbeddingProviderId;
  model: string | null;
} {
  const provider =
    readEnum(process.env.ASSET_EMBEDDING_PROVIDER, ["gemini", "ollama", "none"] as const) ??
    "none";

  if (provider === "none") return { provider, model: null };

  return {
    provider,
    model: process.env.ASSET_EMBEDDING_MODEL?.trim() || defaultEmbeddingModels[provider],
  };
}

// O modelo gravado junto de cada vetor identifica provedor e modelo; a busca
// só compara vetores produzidos pelo mesmo par.
export function getEmbeddingModelKey() {
  const config = getEmbeddingProviderConfig();
  return config.model ? `${config.provider}:${config.model}` : null;
}
