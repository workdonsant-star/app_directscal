"use client";

import { getDemoState, updateDemo } from "./demo-store";
import { getDemoFile, removeDemoFile, saveDemoFile } from "./demo-file-store";
import { demoFolders } from "@/lib/data/demo/demo-workspaces";
import { normalizeManagementAssetCategory } from "@/lib/data/management-asset-categories";
import type { CustomerDocument } from "@/lib/contracts/customer-documents";

const base = "/api/admin/companies/demo-vertex";
const maxBytes = 10 * 1024 * 1024;
const pdfMime = "application/pdf";
const docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function json(body: unknown, status = 200) { return Response.json(body, { status }); }

export async function handleDemoDocumentRequest(address: string, init: RequestInit = {}): Promise<Response | null> {
  const url = new URL(address, "https://demo.invalid");
  const method = init.method ?? "GET";
  const state = getDemoState();
  if (url.origin !== "https://demo.invalid") return null;
  if (url.pathname === `${base}/document-categories` && method === "POST") {
    if (state.deletedCompanyIds?.includes("demo-vertex")) return json({ message: "Empresa não encontrada." }, 404);
    const input = JSON.parse(typeof init.body === "string" ? init.body : "{}");
    const title = typeof input.title === "string" ? input.title.trim().replace(/\s+/g, " ") : "";
    if (!title || title.length > 80) return json({ message: "Informe o nome da pasta." }, 400);
    if (demoFolders(state).some(folder => normalizeManagementAssetCategory(folder.title) === normalizeManagementAssetCategory(title))) return json({ message: "Esta pasta já existe." }, 409);
    const category = { key: `demo-${crypto.randomUUID()}`, title };
    updateDemo(current => ({ ...current, navigation: { ...current.navigation, categories: [...(current.navigation.categories ?? []), category] } }));
    return json({ category }, 201);
  }
  if (url.pathname === `${base}/documents` && method === "POST") {
    if (state.deletedCompanyIds?.includes("demo-vertex")) return json({ message: "Empresa não encontrada." }, 404);
    if (!(init.body instanceof FormData)) return json({ message: "Revise os dados do arquivo." }, 400);
    const file = init.body.get("file");
    const kind = init.body.get("kind");
    const title = init.body.get("title");
    const categoryKey = init.body.get("categoryKey");
    if (!(file instanceof File) || (kind !== "asset" && kind !== "report") || typeof title !== "string" || !title.trim()) return json({ message: "Revise os dados do arquivo." }, 400);
    if (file.size < 1 || file.size > maxBytes) return json({ message: "O arquivo deve ter até 10 MB." }, 400);
    if (kind === "report" ? file.type !== pdfMime : file.type !== pdfMime && file.type !== docxMime) return json({ message: "Formato de arquivo inválido." }, 400);
    if (kind === "asset" && (typeof categoryKey !== "string" || !demoFolders(state).some(folder => folder.key === categoryKey))) return json({ message: "Escolha uma pasta válida." }, 400);
    const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    const pdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
    const zip = header[0] === 0x50 && header[1] === 0x4b;
    if (file.type === pdfMime ? !pdf : !zip) return json({ message: "O conteúdo do arquivo não corresponde ao formato informado." }, 400);
    const document: CustomerDocument = { id: crypto.randomUUID(), organizationId: "demo-vertex", kind, categoryKey: kind === "asset" ? categoryKey as string : null, title: title.trim(), fileName: file.name, mimeType: file.type, byteSize: file.size, publishedAt: new Date().toISOString() };
    try { await saveDemoFile(document.id, file); }
    catch { return json({ message: "O navegador não conseguiu guardar o arquivo da demo." }, 500); }
    updateDemo(current => ({ ...current, uploadedDocuments: [document, ...(current.uploadedDocuments ?? [])] }));
    return json({ document }, 201);
  }
  if (url.pathname === `${base}/documents` && method === "DELETE") {
    const input = JSON.parse(typeof init.body === "string" ? init.body : "{}");
    const document = state.uploadedDocuments?.find(item => item.id === input.documentId);
    if (!document) return json({ message: "Arquivo não encontrado." }, 404);
    await removeDemoFile(document.id);
    updateDemo(current => ({ ...current, uploadedDocuments: current.uploadedDocuments?.filter(item => item.id !== document.id) }));
    return json({ ok: true });
  }
  const match = url.pathname.match(/^\/api\/customer-documents\/([^/]+)$/);
  if (match && method === "GET") {
    const document = state.uploadedDocuments?.find(item => item.id === match[1]);
    if (!document) return json({ message: "Arquivo não encontrado." }, 404);
    const file = await getDemoFile(document.id);
    if (!file) return json({ message: "Arquivo indisponível nesta demo." }, 404);
    return new Response(file, { headers: { "Content-Type": document.mimeType, "Cache-Control": "no-store" } });
  }
  return null;
}
