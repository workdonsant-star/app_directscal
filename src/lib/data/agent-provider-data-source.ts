import "server-only";

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { z } from "zod";

import { generateGroundedAnswer } from "@/lib/agent/answer-providers";
import { getAnswerProviderConfig } from "@/lib/agent/config";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";

export const agentProviderSchema = z.enum(["anthropic", "openai", "gemini"]);
export type AgentProvider = z.infer<typeof agentProviderSchema>;
type Row = Database["app_private"]["Tables"]["agent_provider_connections"]["Row"];

export const agentProviderDefaults: Record<AgentProvider, { name: string; model: string }> = {
  anthropic: { name: "Anthropic", model: "claude-sonnet-5" },
  openai: { name: "OpenAI", model: "gpt-6-luna" },
  gemini: { name: "Google Gemini", model: "gemini-3.5-flash-lite" },
};

const providers = agentProviderSchema.options;
const sealedSchema = z.object({ iv: z.string(), ciphertext: z.string(), tag: z.string() }).strict();

function encryptionKey() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Configure AUTH_SECRET para proteger as chaves de IA.");
  return Buffer.from(hkdfSync("sha256", secret, "directscal-agent-provider-keys", "v1", 32));
}

function sealKey(provider: AgentProvider, apiKey: string): Json {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(provider));
  const ciphertext = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  return { iv: iv.toString("base64url"), ciphertext: ciphertext.toString("base64url"), tag: cipher.getAuthTag().toString("base64url") };
}

function openKey(provider: AgentProvider, raw: Json) {
  const sealed = sealedSchema.parse(raw);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(sealed.iv, "base64url"));
  decipher.setAAD(Buffer.from(provider));
  decipher.setAuthTag(Buffer.from(sealed.tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(sealed.ciphertext, "base64url")), decipher.final()]).toString("utf8");
}

function envKey(provider: AgentProvider) {
  const name = provider === "anthropic" ? "ANTHROPIC_API_KEY" : provider === "openai" ? "OPENAI_API_KEY" : "GEMINI_API_KEY";
  return process.env[name]?.trim() || null;
}

async function rows() {
  const { data, error } = await createSupabaseAdminClient().schema("app_private")
    .from("agent_provider_connections").select("*");
  if (error) throw error;
  return data as Row[];
}

export async function getAgentProviderOverview() {
  const current = await rows();
  const legacy = getAnswerProviderConfig();
  return providers.map(provider => {
    const row = current.find(item => item.provider === provider);
    const configured = Boolean(row?.sealed_key || envKey(provider));
    return {
      provider,
      name: agentProviderDefaults[provider].name,
      model: row?.model ?? (legacy.provider === provider ? legacy.model : null) ?? agentProviderDefaults[provider].model,
      configured,
      keySource: row?.sealed_key ? "painel" as const : envKey(provider) ? "servidor" as const : null,
      selected: row?.selected ?? (current.every(item => !item.selected) && legacy.provider === provider),
    };
  });
}

async function resolveKey(provider: AgentProvider, current?: Row[]) {
  const row = (current ?? await rows()).find(item => item.provider === provider);
  return row?.sealed_key ? openKey(provider, row.sealed_key) : envKey(provider);
}

export async function getActiveAgentProvider() {
  const current = await rows();
  const selected = current.find(item => item.selected);
  if (!selected) {
    const legacy = getAnswerProviderConfig();
    if (legacy.provider === "anthropic" || legacy.provider === "gemini") {
      return { ...legacy, apiKey: await resolveKey(legacy.provider, current) };
    }
    return { ...legacy, apiKey: null };
  }
  return { provider: selected.provider, model: selected.model, apiKey: await resolveKey(selected.provider, current) };
}

export async function verifyAgentProvider(provider: AgentProvider, model: string, submittedKey?: string) {
  const apiKey = submittedKey?.trim() || await resolveKey(provider);
  if (!apiKey) throw new Error("Informe uma chave de API para conectar este provedor.");
  const endpoint = provider === "anthropic"
    ? `https://api.anthropic.com/v1/models/${encodeURIComponent(model)}`
    : provider === "openai"
      ? `https://api.openai.com/v1/models/${encodeURIComponent(model)}`
      : `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`;
  const response = await fetch(endpoint, {
    headers: provider === "anthropic"
      ? { "x-api-key": apiKey, "anthropic-version": "2023-06-01" }
      : provider === "openai" ? { Authorization: `Bearer ${apiKey}` } : { "x-goog-api-key": apiKey },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403
    ? "Chave recusada pelo provedor." : response.status === 404
      ? "Modelo não encontrado ou indisponível para esta chave." : `O provedor respondeu com status ${response.status}.`);
}

export async function testAgentProvider(provider: AgentProvider, model: string, submittedKey?: string) {
  await verifyAgentProvider(provider, model, submittedKey);
  const apiKey = submittedKey?.trim() || await resolveKey(provider);
  const answer = await generateGroundedAnswer(provider, model, "Qual é a cor do marcador de teste?", [{
    label: "S1", chunkId: "teste", assetId: "teste", versionId: "teste", assetType: "sop",
    title: "Teste de conexão", headingPath: "Teste", content: "O marcador de teste é azul.",
    versionNumber: "1", publishedAt: new Date(0).toISOString(), textRank: 1,
    vectorSimilarity: null, score: 1,
  }], [], apiKey);
  if (answer.status !== "answered" || !answer.sources.includes("S1")) {
    throw new Error("O modelo não respondeu com a fonte de teste.");
  }
}

export async function saveAgentProvider(input: {
  actorId: string; provider: AgentProvider; model: string; apiKey?: string; select?: boolean;
}) {
  const model = input.model.trim();
  await verifyAgentProvider(input.provider, model, input.apiKey);
  const { error } = await createSupabaseAdminClient().schema("app_private")
    .rpc("save_agent_provider_connection", {
      p_actor_user_id: input.actorId,
      p_provider: input.provider,
      p_model: model,
      p_sealed_key: input.apiKey?.trim() ? sealKey(input.provider, input.apiKey.trim()) : null,
      p_select: Boolean(input.select),
    });
  if (error) throw error;
}

export async function disconnectAgentProvider(provider: AgentProvider) {
  const { error } = await createSupabaseAdminClient().schema("app_private")
    .from("agent_provider_connections").delete().eq("provider", provider);
  if (error) throw error;
}
