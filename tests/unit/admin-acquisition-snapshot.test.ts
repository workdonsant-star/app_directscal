import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));

import { getAdminAcquisitionSnapshot } from "@/lib/data/acquisition-data-source";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type Result = { data: unknown[] | null; error: { message: string } | null };
const responses = new Map<string, Promise<Result>>();
const started: string[] = [];

beforeEach(() => {
  responses.clear();
  started.length = 0;
  vi.mocked(createSupabaseAdminClient).mockReturnValue({
    from(table: string) {
      const query = {
        select: () => query,
        order: () => query,
        or: () => query,
        eq: () => query,
        in: () => query,
        then(resolve: (result: Result) => unknown, reject: (reason: unknown) => unknown) {
          started.push(table);
          return (responses.get(table) ?? Promise.resolve({ data: [], error: null })).then(resolve, reject);
        },
      };
      return query;
    },
  } as unknown as ReturnType<typeof createSupabaseAdminClient>);
});

describe("snapshot administrativo", () => {
  it("não deixa campanhas lentas bloquearem as demais leituras independentes", async () => {
    let release!: (result: Result) => void;
    responses.set("acquisition_campaigns", new Promise((resolve) => { release = resolve; }));
    const pending = getAdminAcquisitionSnapshot();
    await Promise.resolve();
    expect(started).toEqual(expect.arrayContaining([
      "acquisition_campaigns", "organizations", "organization_members", "organization_module_access", "acquisition_leads",
    ]));
    release({ data: [], error: null });
    const snapshot = await pending;
    expect(snapshot.campaigns).toEqual([]);
    expect(snapshot.leads).toEqual([]);
    expect(snapshot.companies).toEqual([]);
  });

  it.each(["acquisition_campaigns", "organizations", "organization_members", "acquisition_leads", "organization_module_access"])(
    "recusa snapshot parcial se %s falhar",
    async (table) => {
      responses.set(table, Promise.resolve({ data: null, error: { message: "Falha de conexão" } }));
      await expect(getAdminAcquisitionSnapshot()).rejects.toThrow("Falha de conexão");
    },
  );

  it("preserva compatibilidade com a tabela opcional de acessos ausente", async () => {
    responses.set("organization_module_access", Promise.resolve({
      data: null, error: { message: "Could not find the table organization_module_access" },
    }));
    await expect(getAdminAcquisitionSnapshot()).resolves.toMatchObject({ campaigns: [], leads: [], companies: [] });
  });

  it("inclui só organizações com conta cliente e mantém leads sem conta fora da lista de empresas", async () => {
    responses.set("organizations", Promise.resolve({ data: [
      { id: "org_cliente", name: "Empresa cadastrada", employee_count: 10, created_at: "2026-10-29T12:00:00Z", updated_at: "2026-10-29T12:00:00Z" },
      { id: "org_interna", name: "Organização interna", employee_count: 1, created_at: "2026-10-29T12:00:00Z", updated_at: "2026-10-29T12:00:00Z" },
    ], error: null }));
    responses.set("organization_members", Promise.resolve({ data: [{ organization_id: "org_cliente" }], error: null }));
    const snapshot = await getAdminAcquisitionSnapshot();
    expect(snapshot.companies.map((company) => company.name)).toEqual(["Empresa cadastrada"]);
  });
});
