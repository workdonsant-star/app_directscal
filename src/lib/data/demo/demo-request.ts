import { z } from "zod";
import { managementAssetDocumentSchema, personalProfileInputSchema, updateProfileCommercialInputSchema } from "@/lib/contracts";
import { answerDemoQuestion, demoAssets, DEMO_DATE } from "./demo-data";
import { demoFolders, demoProfile, demoResponseWorkspace, demoSectors, demoShareLinks } from "./demo-workspaces";
import { submitDemoResponse, type DemoState } from "./demo-state";
import { normalizeManagementAssetCategory } from "@/lib/data/management-asset-categories";
import { getManagementAssetHref } from "@/lib/data/management-asset-routes";
import { demoHref } from "./demo-routes";

const surveyInput = z.object({ name: z.string().trim().min(1).max(120), description: z.string().nullable(), deadline: z.string().nullable(), leaderIds: z.string().array() });
const categoryInput = z.object({ key: z.string().optional(), title: z.string().trim().min(2).max(120) });
type Result = { state: DemoState; body: unknown; status?: number };

/** Lista fechada: uma chamada desconhecida nunca é encaminhada para o backend. */
export function applyDemoRequest(state: DemoState, address: string, init: RequestInit = {}): Result {
 const url = new URL(address, "https://demo.invalid");
 const method = init.method ?? "GET";
 const result = (body: unknown, next = state): Result => ({ body, state: next });
 const fail = (message: string, status = 400): Result => ({ body: { message }, state, status });
 if (url.origin !== "https://demo.invalid" || !url.pathname.startsWith("/api/")) return fail("Endereço fora do ambiente de demonstração.", 404);
 try {
  const body = JSON.parse(typeof init.body === "string" ? init.body : "{}");
  const assets = state.assets ?? demoAssets;
  const folders = demoFolders(state);
  if (url.pathname === "/api/settings/asset-navigation" && method === "PUT") {
   const preferences = z.object({ order: z.string().array(), icons: z.record(z.string(), z.string()) }).parse(body);
   return result({}, { ...state, navigation: { ...state.navigation, ...preferences } });
  }
  if (url.pathname === "/api/settings/asset-categories") {
   if (method === "GET") {
    const folder = folders.find(f => f.key === url.searchParams.get("key"));
    return folder ? result({ count: folder.count }) : fail("Categoria não encontrada.", 404);
   }
   if (method === "POST" || method === "PATCH") {
    const parsed = categoryInput.parse(body);
    const key = parsed.key ?? `demo-${crypto.randomUUID()}`;
    const previous = folders.find(f => f.key === key);
    if (method === "PATCH" && !previous) return fail("Categoria não encontrada.", 404);
    if (folders.some(f => f.key !== key && normalizeManagementAssetCategory(f.title) === normalizeManagementAssetCategory(parsed.title))) return fail("Já existe uma categoria com esse nome.");
    return result({ key, title: parsed.title }, { ...state, assets: assets.map(a => previous && normalizeManagementAssetCategory(a.category) === normalizeManagementAssetCategory(previous.title) ? { ...a, category: parsed.title } : a), navigation: { ...state.navigation, categories: [...(state.navigation.categories ?? []).filter(c => c.key !== key), { key, title: parsed.title }] } });
   }
   if (method === "DELETE") {
    const parsed = z.object({ key: z.string(), destinationKey: z.string().optional(), newTitle: z.string().trim().min(2).optional() }).parse(body);
    const source = folders.find(f => f.key === parsed.key);
    if (!source) return fail("Categoria não encontrada.", 404);
    const destination = parsed.newTitle ? { key: `demo-${crypto.randomUUID()}`, title: parsed.newTitle } : folders.find(f => f.key === parsed.destinationKey && f.key !== parsed.key);
    if (source.count > 0 && !destination) return fail("Selecione a categoria de destino.");
    return result({ destinationKey: destination?.key }, { ...state, assets: assets.map(a => destination && normalizeManagementAssetCategory(a.category) === normalizeManagementAssetCategory(source.title) ? { ...a, category: destination.title } : a), navigation: { ...state.navigation, categories: [...(state.navigation.categories ?? []).filter(c => c.key !== parsed.key), { key: parsed.key, title: source.title, deleted: true }, ...(parsed.newTitle && destination ? [destination] : [])] } });
   }
  }
  if (url.pathname === "/api/management-assets/bulk" && method === "PATCH") {
   const parsed = z.object({ assetIds: z.string().array().min(1), changes: z.object({ type: managementAssetDocumentSchema.shape.type.optional(), categoryKey: z.string().optional() }) }).parse(body);
   const folder = folders.find(f => f.key === parsed.changes.categoryKey);
   if (parsed.assetIds.some(id => !assets.some(a => a.id === id)) || (parsed.changes.categoryKey && !folder)) return fail("Ativo ou categoria não encontrado.", 404);
   return result({}, { ...state, assets: assets.map(a => parsed.assetIds.includes(a.id) ? { ...a, type: parsed.changes.type ?? a.type, category: folder?.title ?? a.category } : a) });
  }
  const assetMatch = url.pathname.match(/^\/api\/management-assets\/([^/]+)$/);
  if (assetMatch && method === "PATCH") {
   const asset = assets.find(a => a.id === assetMatch[1]);
   if (!asset) return fail("Ativo não encontrado.", 404);
   const parsed = managementAssetDocumentSchema.pick({ title: true, summary: true, content: true }).extend({ expectedVersionId: z.string() }).parse(body);
   if (parsed.expectedVersionId !== asset.versionId) return fail("O ativo foi atualizado. Reabra a versão vigente.", 409);
   const updated = managementAssetDocumentSchema.parse({ ...asset, ...parsed, versionNumber: String(Number(asset.versionNumber) + 1), versionId: `demo-${crypto.randomUUID()}`, updatedAt: DEMO_DATE });
   return result({ asset: updated }, { ...state, assets: assets.map(a => a.id === asset.id ? updated : a) });
  }
  const surveyMatch = url.pathname.match(/^\/api\/omdx\/diagnostics(?:\/([^/]+))?(?:\/(activate|close))?$/);
  if (surveyMatch) {
   const [, id, action] = surveyMatch;
   const survey = state.surveys.find(s => s.id === id);
   if (id && !survey) return fail("Diagnóstico não encontrado.", 404);
   if (method === "DELETE" && survey) return result({}, { ...state, surveys: state.surveys.filter(s => s.id !== id) });
   if (action && method === "POST" && survey) return result({}, { ...state, surveys: state.surveys.map(s => s.id === id ? { ...s, status: action === "activate" ? "ativo" : "encerrado" } : s) });
   if ((!id && method === "POST") || (id && method === "PATCH")) {
    if (state.surveys.length >= 50 && !id) return fail("Reinicie a demo para começar uma nova apresentação.");
    const parsed = surveyInput.parse(body);
    const savedId = id ?? `demo-survey-${crypto.randomUUID()}`;
    const saved = { id: savedId, ...parsed, status: survey?.status ?? "rascunho" as const, responses: survey?.responses ?? 0 };
    const next = { ...state, surveys: id ? state.surveys.map(s => s.id === id ? saved : s) : [...state.surveys, saved] };
    return result({ diagnosticId: savedId, links: demoShareLinks(next)[savedId] }, next);
   }
  }
  const responseMatch = url.pathname === "/api/omdx/responses";
  if (responseMatch && method === "POST") {
   const { token } = z.object({ token: z.string() }).parse(body);
   const workspace = demoResponseWorkspace(state, token);
   if (!workspace || workspace.diagnostic.status !== "ativo") return fail("Coleta indisponível.", 409);
   if (state.responseTokens.includes(token)) return fail("Este navegador já registrou uma resposta para este link.", 409);
   const parsed = z.object({ answers: z.object({ questionId: z.string(), value: z.number().int().min(1).max(5) }).array() }).parse(body);
   const ids = workspace.dimensions.flatMap(d => d.questions.map(q => q.id));
   if (parsed.answers.length !== ids.length || new Set(parsed.answers.map(a => a.questionId)).size !== ids.length || parsed.answers.some(a => !ids.includes(a.questionId))) return fail("Responda todas as afirmações.");
   return result({}, { ...submitDemoResponse(state, workspace.diagnostic.id), responseTokens: [...state.responseTokens, token] });
  }
  if (url.pathname === "/api/assistant/ask" && method === "POST") {
   const { question } = z.object({ question: z.string().trim().min(1).max(2000) }).parse(body);
   const answer = answerDemoQuestion(question);
   const asset = assets.find(a => a.id === answer.assetId);
   const citations = asset ? [{ assetId: asset.id, assetType: asset.type, chunkId: `${asset.id}-objetivo`, title: asset.title, section: "Como executar", versionId: asset.versionId, versionNumber: asset.versionNumber, publishedAt: asset.publishedAt, href: demoHref(getManagementAssetHref(asset.type, asset.id)!) }] : [];
   return result({ answer: { status: asset ? "answered" : "insufficient_evidence", answer: answer.text, confidence: asset ? "alta" : "insuficiente", citations, auditId: crypto.randomUUID() } }, { ...state, messages: [...state.messages.slice(-96), { role: "user", text: question, assetId: null }, { role: "assistant", ...answer }] });
  }
  if (url.pathname === "/api/assistant/feedback" && method === "POST") return result({});
  if (url.pathname === "/api/assistant/history" && method === "GET") return result({ items: state.messages.flatMap((m, i) => m.role === "assistant" ? [{ id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, question: state.messages[i - 1]?.text ?? "Consulta", answer: m.text, status: m.assetId ? "respondida" : "insuficiente", createdAt: DEMO_DATE, citations: [] }] : []), nextCursor: null });
  if (url.pathname === "/api/settings/slack-users" && method === "GET") return result({ users: demoSectors.map(s => ({ userId: s.leader.slackUserId, name: s.leader.name, position: s.leader.position, avatarUrl: null })) });
  if (url.pathname === "/api/settings/sectors" && method === "POST") {
   const parsed = z.object({ name: z.string().trim().min(2), slackUserId: z.string(), position: z.string().optional() }).parse(body);
   const source = demoSectors.find(s => s.leader.slackUserId === parsed.slackUserId);
   if (!source) return fail("Pessoa não encontrada.");
   return result({}, { ...state, sectors: [...state.sectors ?? demoSectors, { ...source, id: `demo-sector-${crypto.randomUUID()}`, name: parsed.name, leader: { ...source.leader, position: parsed.position ?? source.leader.position } }] });
  }
  if (url.pathname === "/api/profile") {
   const profile = state.profile ?? demoProfile;
   if (method === "PUT") return result({}, { ...state, profile: { ...profile, ...personalProfileInputSchema.parse(body) } });
   if (method === "PATCH") return result({}, { ...state, profile: { ...profile, companyDetails: { ...profile.companyDetails, ...updateProfileCommercialInputSchema.partial().parse(body) } } });
  }
  if (url.pathname === "/api/integrations/slack/installation" && method === "DELETE") return result({}, { ...state, slackConnected: false });
  return fail("Esta ação não está disponível neste ambiente de demonstração.", 404);
 } catch { return fail("Confira os campos informados."); }
}
