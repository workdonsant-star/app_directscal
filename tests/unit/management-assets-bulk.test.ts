import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/agent/embeddings", () => ({ embedTexts: vi.fn(), toPgVector: vi.fn() }));
vi.mock("@/lib/data/person-profiles-data-source", () => ({ canAssignSpecialist: (id: string) => id === "specialist-test" ? { id } : null }));

import { DELETE, PATCH } from "@/app/api/admin/management-assets/bulk/route";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { managementAssetBulkSelectionSchema, managementAssetBulkUpdateSchema } from "@/lib/contracts";
import { deleteManagementAssets, transitionManagementAsset, updateManagementAsset, updateManagementAssetsInBulk } from "@/lib/data/management-assets-admin-data-source";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const organizationId = "10000000-0000-4000-8000-000000000001";
const assetIds = ["20000000-0000-4000-8000-000000000001", "20000000-0000-4000-8000-000000000002"];
const selection = { organizationId, assetIds };
let results: Array<{ data: unknown; error: unknown }>;
let tables: string[];
let chains: Array<Record<string, ReturnType<typeof vi.fn>>>;
const request = (method: string, body: unknown) => new Request("http://localhost/api/admin/management-assets/bulk", { method, body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  results = [{ data: assetIds.map((id) => ({ id, archived_at: null })), error: null }, { data: assetIds.map((id) => ({ id })), error: null }];
  chains = [];
  tables = [];
  vi.mocked(getCurrentAuthSession).mockResolvedValue({ user: { id: "actor", role: "superadmin" } } as Awaited<ReturnType<typeof getCurrentAuthSession>>);
  vi.mocked(createSupabaseAdminClient).mockReturnValue({ from: vi.fn((table: string) => {
    tables.push(table);
    const result = results.shift();
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const name of ["select", "eq", "in", "is", "update", "delete", "insert", "order", "returns", "single", "maybeSingle"]) chain[name] = vi.fn(() => chain);
    chain.then = vi.fn((resolve: (value: unknown) => unknown) => Promise.resolve(resolve(result)));
    chains.push(chain);
    return chain;
  }) } as unknown as ReturnType<typeof createSupabaseAdminClient>);
});

describe("contrato de seleção e edição em massa", () => {
  it("recusa seleção vazia, duplicada, inválida ou acima de 200", () => {
    for (const ids of [[], [assetIds[0], assetIds[0]], ["inválido"], Array.from({ length: 201 }, (_, index) => `20000000-0000-4000-8000-${String(index).padStart(12, "0")}`)]) {
      expect(managementAssetBulkSelectionSchema.safeParse({ organizationId, assetIds: ids }).success).toBe(false);
    }
  });
  it("recusa campos desconhecidos e mudanças vazias; permite limpar autor e categoria", () => {
    for (const changes of [{}, { content: {} }, { status: "publicado" }]) {
      expect(managementAssetBulkUpdateSchema.safeParse({ ...selection, changes }).success).toBe(false);
    }
    expect(managementAssetBulkUpdateSchema.parse({ ...selection, changes: { specialistId: null, category: null } }).changes).toEqual({ specialistId: null, category: null });
  });
});

describe("mutações isoladas por empresa", () => {
  it("altera só metadados solicitados e devolve apenas os IDs realmente alterados", async () => {
    results[1].data = [{ id: assetIds[0] }];
    expect(await updateManagementAssetsInBulk({ ...selection, changes: { specialistId: "specialist-test" } })).toEqual([assetIds[0]]);
    expect(chains[0].eq).toHaveBeenCalledWith("organization_id", organizationId);
    expect(chains[0].in).toHaveBeenCalledWith("id", assetIds);
    expect(chains[1].update).toHaveBeenCalledWith({ assigned_specialist_id: "specialist-test" });
    expect(chains[1].eq).toHaveBeenCalledWith("organization_id", organizationId);
    expect(chains[1].in).toHaveBeenCalledWith("id", assetIds);
    expect(chains[1].is).toHaveBeenCalledWith("archived_at", null);
  });
  it("não escreve se algum ID não pertence à empresa", async () => {
    results[0].data = [{ id: assetIds[0], archived_at: null }];
    await expect(deleteManagementAssets(selection)).rejects.toMatchObject({ status: 409 });
    expect(chains).toHaveLength(1);
    expect(chains[0].delete).not.toHaveBeenCalled();
  });
  it("recusa edição de arquivados e autor inexistente antes da escrita", async () => {
    results[0].data = assetIds.map((id) => ({ id, archived_at: "2026-10-09" }));
    await expect(updateManagementAssetsInBulk({ ...selection, changes: { category: null } })).rejects.toMatchObject({ status: 409 });
    expect(chains).toHaveLength(1);
    await expect(updateManagementAssetsInBulk({ ...selection, changes: { specialistId: "unknown" } })).rejects.toMatchObject({ status: 400 });
    expect(chains).toHaveLength(1);
  });
  it("exclui a seleção em uma única instrução limitada por empresa e IDs", async () => {
    expect(await deleteManagementAssets(selection)).toEqual(assetIds);
    expect(chains[1].delete).toHaveBeenCalledOnce();
    expect(chains[1].eq).toHaveBeenCalledWith("organization_id", organizationId);
    expect(chains[1].in).toHaveBeenCalledWith("id", assetIds);
  });
});

describe("API administrativa de ações em massa", () => {
  it("exige superadmin antes de consultar ou alterar dados", async () => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue(null);
    expect((await DELETE(request("DELETE", selection))).status).toBe(401);
    vi.mocked(getCurrentAuthSession).mockResolvedValue({ user: { role: "cliente" } } as Awaited<ReturnType<typeof getCurrentAuthSession>>);
    expect((await PATCH(request("PATCH", { ...selection, changes: { category: null } }))).status).toBe(403);
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });
  it("valida payload antes de consultar dados", async () => {
    expect((await DELETE(request("DELETE", { ...selection, assetIds: [] }))).status).toBe(400);
    expect((await PATCH(request("PATCH", { ...selection, changes: {} }))).status).toBe(400);
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });
  it("devolve resultado sem cache e transmite conflito sem escrita", async () => {
    const response = await PATCH(request("PATCH", { ...selection, changes: { ownerLabel: "Liderança" } }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ ids: assetIds });
    results = [{ data: [], error: null }];
    expect((await DELETE(request("DELETE", selection))).status).toBe(409);
  });
});


describe("edição como nova versão", () => {
  it("clona a publicação para v2 sem atualizar nem apagar a v1", async () => {
    const content = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Conteúdo publicado" }] }] };
    const published = { id: "published-version", version_number: "1", content, published_at: "2026-10-09T12:00:00Z" };
    results = [
      { data: { id: assetIds[0], organization_id: organizationId, current_published_version_id: published.id, archived_at: null, description: "Resumo" }, error: null },
      { data: [published], error: null },
      { data: { id: "draft-version" }, error: null },
    ];
    await expect(transitionManagementAsset("actor", assetIds[0], "abrir_rascunho")).resolves.toEqual({ notice: "Nova versão aberta em rascunho." });
    expect(tables).toEqual(["management_assets", "management_asset_versions", "management_asset_versions"]);
    expect(chains[2].insert).toHaveBeenCalledWith(expect.objectContaining({ asset_id: assetIds[0], organization_id: organizationId, version_number: "2", content, review_status: "rascunho", created_by_user_id: "actor" }));
    for (const chain of chains) { expect(chain.update).not.toHaveBeenCalled(); expect(chain.delete).not.toHaveBeenCalled(); }
    expect(published.version_number).toBe("1");
  });
});


it("salva o conteúdo apenas no rascunho v2 com proteção de publicação", async () => {
  const content = { type: "doc" as const, content: [{ type: "paragraph" as const, content: [{ type: "text" as const, text: "Nova edição" }] }] };
  results = [
    { data: { id: assetIds[0], archived_at: null }, error: null },
    { data: null, error: null },
    { data: [{ id: "draft-v2", published_at: null, review_status: "rascunho" }, { id: "published-v1", published_at: "2026-10-09T12:00:00Z" }], error: null },
    { data: null, error: null },
  ];
  await updateManagementAsset("actor", assetIds[0], { title: "Ativo de teste", summary: "Resumo do ativo", category: null, ownerLabel: "Liderança", reviewCycle: "Mensal", specialistId: null, changeNote: "Revisão", content });
  expect(tables).toEqual(["management_assets", "management_assets", "management_asset_versions", "management_asset_versions"]);
  expect(chains[3].update).toHaveBeenCalledWith({ summary: "Resumo do ativo", change_note: "Revisão", content });
  expect(chains[3].eq).toHaveBeenCalledWith("id", "draft-v2");
  expect(chains[3].is).toHaveBeenCalledWith("published_at", null);
});
