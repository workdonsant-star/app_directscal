import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/authorization", () => ({ getAccessibleOrganizationIdsForUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/integrations/slack", () => ({ getSlackBotTokenForOrganization: vi.fn(), listSlackWorkspaceUsers: vi.fn() }));

import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { getCustomerCompanyActionPoints } from "@/lib/data/customer-company-action-points";
import { buildManualActionPointsBoard } from "@/lib/data/manual-action-points-board";
import { getSlackBotTokenForOrganization, listSlackWorkspaceUsers } from "@/lib/integrations/slack";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { AuthSession } from "@/lib/contracts";

const session = { user: { id: "user-a", role: "cliente" } } as AuthSession;
const point = { id: "point-a", organization_id: "org-a", asset_id: "asset-a", slack_team_id: "team-a", slack_user_id: "leader-a", title: "Revisar prioridades", deadline: null, frequency: "semanal", reason: "A operação perdeu foco.", action: "Conduzir o ritual.", continuity: "Usar o SOP." };
let scopes: { table: string; in: ReturnType<typeof vi.fn>; not: ReturnType<typeof vi.fn> }[];
let followupRows: Array<{ id: string; action_point_id: string; organization_id: string }>;
let reportRows: Array<{ followup_id: string; organization_id: string; status: string; summary: string; registered_at: string; confirmed_at: string | null }>;

beforeEach(() => {
  vi.clearAllMocks();
  scopes = [];
  followupRows = [];
  reportRows = [];
  vi.mocked(getAccessibleOrganizationIdsForUser).mockResolvedValue({ isSuperadmin: false, organizationIds: ["org-a"], primaryOrganizationId: "org-a" });
  vi.mocked(getSlackBotTokenForOrganization).mockResolvedValue({ botToken: "token", teamId: "team-a" } as Awaited<ReturnType<typeof getSlackBotTokenForOrganization>>);
  vi.mocked(listSlackWorkspaceUsers).mockResolvedValue([{ userId: "leader-a", name: "Ana Lima", avatarUrl: null }]);
  vi.mocked(createSupabaseAdminClient).mockReturnValue({
    schema: vi.fn(() => ({ from: fromTable })), from: fromTable,
  } as unknown as ReturnType<typeof createSupabaseAdminClient>);
});

function fromTable(table: string) {
  const data = table === "admin_company_action_points" ? [point] : table === "organizations" ? [{ id: "org-a", name: "Empresa A" }] : table === "manual_action_point_followups" ? followupRows : table === "manual_action_point_reports" ? reportRows : [{ id: "asset-a", organization_id: "org-a", title: "SOP de prioridades", status: "publicado", archived_at: null, current_published_version_id: "version-a" }];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "in", "not", "order"]) chain[method] = vi.fn(() => chain);
  chain.then = vi.fn((resolve: (result: unknown) => unknown) => Promise.resolve(resolve({ data, error: null })));
  scopes.push({ table, in: chain.in, not: chain.not });
  return chain;
}

describe("Action Points manuais no cliente", () => {
  it("não consulta a tabela privada sem organização autorizada", async () => {
    vi.mocked(getAccessibleOrganizationIdsForUser).mockResolvedValue({ isSuperadmin: false, organizationIds: [], primaryOrganizationId: null });
    expect(await getCustomerCompanyActionPoints(session)).toEqual([]);
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("filtra por membership e entrega o cadastro com dados reais, sem medição inventada", async () => {
    const items = await getCustomerCompanyActionPoints(session);
    expect(scopes.map(scope => scope.table)).toEqual(["admin_company_action_points", "organizations", "management_assets", "manual_action_point_followups", "manual_action_point_reports"]);
    for (const scope of scopes) expect(scope.in).toHaveBeenCalledWith(scope.table === "organizations" ? "id" : "organization_id", ["org-a"]);
    expect(scopes.find(scope => scope.table === "manual_action_point_reports")?.not).toHaveBeenCalledWith("confirmed_at", "is", null);
    expect(items).toMatchObject([{ title: "Revisar prioridades", companyName: "Empresa A", assetTitle: "SOP de prioridades", leaderName: "Ana Lima", action: "Conduzir o ritual." }]);
    expect(items[0]).not.toHaveProperty("adherence");
    const board = buildManualActionPointsBoard(items);
    expect(board.categories[0]).toMatchObject({ leader: { name: "Ana Lima" }, actionPoints: [{ name: "Revisar prioridades", frequency: "Semanal", eventLabel: "Sem medição", checkIns: [], manualDetails: { action: "Conduzir o ritual." } }] });
    expect(board.categories[0].actionPoints[0].cycleTotal).toBeUndefined();
  });

  it("mostra o relato estruturado sem transformar declaração em execução confirmada", async () => {
    followupRows = [{ id: "cycle-a", action_point_id: "point-a", organization_id: "org-a" }];
    reportRows = [{ followup_id: "cycle-a", organization_id: "org-a", status: "executado_relato", summary: "Ana relatou ter conduzido o ritual.", registered_at: "2026-11-04T18:00:00Z", confirmed_at: "2026-11-04T18:01:00Z" }];
    const board = buildManualActionPointsBoard(await getCustomerCompanyActionPoints(session));
    expect(board.categories[0].actionPoints[0]).toMatchObject({ health: "aguardando", eventLabel: "Relato recebido", checkIns: [{ message: "Ana relatou ter conduzido o ritual.", context: "executado relato · relato não verificado" }] });
  });
});
