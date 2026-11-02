import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/data/acquisition-data-source", () => ({ getAdminAcquisitionSnapshot: vi.fn() }));
vi.mock("@/lib/env", () => ({ isFeatureAcquisitionEnabled: vi.fn(() => true) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  redirect: (path: string) => { throw new Error(`redirect:${path}`); },
  notFound: () => { throw new Error("not-found"); },
}));
vi.mock("@/components/app-topbar", () => ({ AppTopbar: () => null }));
vi.mock("@/components/admin/campaign-editor-drawer", () => ({ CampaignEditorDrawer: () => null }));

import AdminCampaignsPage from "@/app/(app)/admin/campanhas/page";
import AdminLeadsPage from "@/app/(app)/admin/leads/page";
import AdminLeadDetailPage from "@/app/(app)/admin/leads/[id]/page";
import AdminModulesPage from "@/app/(app)/admin/modulos/page";
import { leadSchema } from "@/lib/contracts";
import AdminCompaniesPage from "@/app/(app)/admin/empresas/page";
import { AdminCampaignsWorkspace } from "@/components/admin/admin-campaigns-workspace";
import { AdminCompaniesTable } from "@/components/admin/admin-companies-table";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getAdminAcquisitionSnapshot } from "@/lib/data/acquisition-data-source";
import { buildAdminDataSnapshot, createAcquisitionCampaignDraft } from "@/lib/data/admin-data-source";
import { isFeatureAcquisitionEnabled } from "@/lib/env";

type Session = Awaited<ReturnType<typeof getCurrentAuthSession>>;
const empty = buildAdminDataSnapshot({ campaigns: [], leads: [], organizations: [] });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isFeatureAcquisitionEnabled).mockReturnValue(true);
  vi.mocked(getCurrentAuthSession).mockResolvedValue({ user: { role: "superadmin" } } as Session);
  vi.mocked(getAdminAcquisitionSnapshot).mockResolvedValue(empty);
});

describe("carregamento das campanhas", () => {
  it("inclui a campanha persistida já no HTML inicial, sem exibir as campanhas seed", async () => {
    const campaign = { ...createAcquisitionCampaignDraft(empty.modules[0]), name: "Campanha persistida de regressão" };
    const snapshot = buildAdminDataSnapshot({ campaigns: [campaign], leads: [], organizations: [] });
    vi.mocked(getAdminAcquisitionSnapshot).mockResolvedValue(snapshot);
    const html = renderToStaticMarkup(await AdminCampaignsPage());
    expect(html).toContain("Campanha persistida de regressão");
    expect(html).not.toContain("Maturidade — Site");
    expect(html).not.toContain("Maturidade — Outbound");
    expect(getAdminAcquisitionSnapshot).toHaveBeenCalledOnce();
  });

  it("mostra vazio real sem preencher com exemplos", () => {
    const html = renderToStaticMarkup(createElement(AdminCampaignsWorkspace, { initialSnapshot: empty }));
    expect(html).toContain("Nenhuma campanha cadastrada.");
    expect(html).not.toContain("/a/omdx-site");
  });

  it.each([AdminCampaignsPage, AdminCompaniesPage, AdminLeadsPage, AdminModulesPage, () => AdminLeadDetailPage({ params: Promise.resolve({ id: "lead_test" }) })])("não consulta dados privilegiados sem sessão definitiva de superadmin (%#)", async (page) => {
    for (const session of [null, { user: { role: "cliente" } }, { user: { role: "admin" } },
      { user: { role: "superadmin" }, acquisition: true },
      { user: { role: "superadmin" }, leadershipInvitation: true }]) {
      vi.mocked(getCurrentAuthSession).mockResolvedValue(session as Session);
      await expect(page()).rejects.toThrow("redirect:");
    }
    expect(getAdminAcquisitionSnapshot).not.toHaveBeenCalled();
  });

  it.each([AdminCampaignsPage, AdminLeadsPage, () => AdminLeadDetailPage({ params: Promise.resolve({ id: "lead_test" }) })])("respeita a feature e propaga falha ao estado de erro, sem fallback seed (%#)", async (page) => {
    vi.mocked(isFeatureAcquisitionEnabled).mockReturnValue(false);
    await expect(page()).rejects.toThrow("not-found");
    expect(getAdminAcquisitionSnapshot).not.toHaveBeenCalled();
    vi.mocked(isFeatureAcquisitionEnabled).mockReturnValue(true);
    vi.mocked(getAdminAcquisitionSnapshot).mockRejectedValue(new Error("indisponível"));
    await expect(page()).rejects.toThrow("indisponível");
  });

  it("mantém a lista de empresas acessível quando a aquisição está desativada", async () => {
    vi.mocked(isFeatureAcquisitionEnabled).mockReturnValue(false);
    const html = renderToStaticMarkup(await AdminCompaniesPage());
    expect(html).toContain("Empresas cadastradas");
  });
});

describe("carregamento das empresas", () => {
  it("aceita snapshot anterior sem contatos durante atualização do app", () => {
    const snapshot = buildAdminDataSnapshot({
      campaigns: [], leads: [],
      organizations: [{
        id: "00000000-0000-4000-8000-000000000001", name: "Cliente antigo", employeeCount: 10,
        createdAt: "2026-10-29T12:00:00Z", updatedAt: "2026-10-29T12:00:00Z",
      }],
    });
    Reflect.deleteProperty(snapshot.companies[0], "users");
    const html = renderToStaticMarkup(createElement(AdminCompaniesTable, { initialSnapshot: snapshot }));
    expect(html).toContain("Cliente antigo");
    expect(html).toContain("Usuário");
  });

  it("não injeta organizações de exemplo quando a fonte omite organizações", () => {
    expect(buildAdminDataSnapshot({ campaigns: [], leads: [] }).companies).toEqual([]);
  });
  it("renderiza somente as duas organizações persistidas desde o HTML inicial", async () => {
    const snapshot = buildAdminDataSnapshot({
      campaigns: [], leads: [],
      organizations: ["Cliente Alfa", "Cliente Beta"].map((name, index) => ({
        id: `00000000-0000-4000-8000-00000000000${index + 1}`,
        name, employeeCount: 10,
        createdAt: "2026-10-29T12:00:00Z", updatedAt: "2026-10-29T12:00:00Z",
      })),
    });
    vi.mocked(getAdminAcquisitionSnapshot).mockResolvedValue(snapshot);
    const html = renderToStaticMarkup(await AdminCompaniesPage());
    expect(html).toContain("Cliente Alfa");
    expect(html).toContain("Cliente Beta");
    expect(html.match(/href="\/admin\/empresas\/company_/g)).toHaveLength(2);
    for (const seed of ["company_org_directscal", "Lumen Health", "Northbound Capital", "Praça Studios", "Vertex Logistics", "Forte &amp; Cia"]) {
      expect(html).not.toContain(seed);
    }
    expect(getAdminAcquisitionSnapshot).toHaveBeenCalledOnce();
  });

  it("preserva vazio real e desabilita seleção sem inventar empresas", () => {
    const html = renderToStaticMarkup(createElement(AdminCompaniesTable, { initialSnapshot: empty }));
    expect(html).toContain("Nenhuma empresa cadastrada até agora.");
    expect(html).not.toContain('href="/admin/empresas/company_');
    expect(html).toMatch(/aria-label="Selecionar empresas exibidas"[^>]*disabled/);
  });

  it("não apresenta lead sem conta como empresa cadastrada", () => {
    const lead = leadSchema.parse({
      id: "lead_sem_conta", moduleId: empty.modules[0].id, campaignId: "campaign_test",
      campaignName: "Campanha de teste", source: "Site de teste",
      name: "Contato de teste", email: "contato@example.invalid", phone: null, role: null,
      companyName: "Empresa sem conta", companySize: null, objective: null,
      createdAt: "2026-10-29T12:00:00Z", fieldValues: {},
    });
    const snapshot = buildAdminDataSnapshot({ campaigns: [], leads: [lead], organizations: [] });
    const html = renderToStaticMarkup(createElement(AdminCompaniesTable, { initialSnapshot: snapshot }));
    expect(html).toContain("Nenhuma empresa cadastrada até agora.");
    expect(html).not.toContain("Empresa sem conta");
  });
});

describe("carregamento compartilhado do admin", () => {
  it("inclui o lead persistido na lista e no detalhe desde o primeiro HTML", async () => {
    const lead = leadSchema.parse({
      id: "lead_test", moduleId: empty.modules[0].id, campaignId: "campaign_test",
      campaignName: "Campanha de regressão", source: "Site de teste",
      name: "Contato persistido", email: "contato@example.invalid", phone: null, role: null,
      companyName: "Empresa persistida", companySize: null, objective: null,
      createdAt: "2026-10-29T12:00:00Z", fieldValues: {},
    });
    vi.mocked(getAdminAcquisitionSnapshot).mockResolvedValue(buildAdminDataSnapshot({ campaigns: [], leads: [lead] }));
    for (const page of [await AdminLeadsPage(), await AdminLeadDetailPage({ params: Promise.resolve({ id: lead.id }) })]) {
      const html = renderToStaticMarkup(page);
      expect(html).toContain("Contato persistido");
      expect(html).toContain("Empresa persistida");
    }
  });

  it("só retorna detalhe inexistente depois de consultar a fonte real", async () => {
    await expect(AdminLeadDetailPage({ params: Promise.resolve({ id: "missing" }) })).rejects.toThrow("not-found");
    expect(getAdminAcquisitionSnapshot).toHaveBeenCalledOnce();
  });

  it("renderiza os clientes persistidos na matriz de módulos sem empresas seed", async () => {
    vi.mocked(getAdminAcquisitionSnapshot).mockResolvedValue(buildAdminDataSnapshot({
      campaigns: [], leads: [], organizations: [{ id: "org_test", name: "Cliente dos módulos", employeeCount: 10,
        createdAt: "2026-10-29T12:00:00Z", updatedAt: "2026-10-29T12:00:00Z" }],
    }));
    const html = renderToStaticMarkup(await AdminModulesPage());
    expect(html).toContain("Cliente dos módulos");
    expect(html).not.toContain("Vertex Logistics");
    expect(getAdminAcquisitionSnapshot).toHaveBeenCalledOnce();
  });
});
