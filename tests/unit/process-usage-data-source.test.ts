import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/auth/authorization", () => ({ getAccessibleOrganizationIdsForUser: vi.fn() }));
vi.mock("@/lib/data/slack-leadership-data-source", () => ({ getSlackSectorLeaders: vi.fn() }));
vi.mock("@/lib/data/slack-identity-data-source", () => ({ getVerifiedSlackIdentities: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));

import { getCurrentAuthSession } from "@/lib/auth/session";
import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { getSlackSectorLeaders } from "@/lib/data/slack-leadership-data-source";
import { getVerifiedSlackIdentities } from "@/lib/data/slack-identity-data-source";
import { getProcessUsageOverview } from "@/lib/data/process-usage-data-source";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const filters = vi.fn();
const ranges = vi.fn();
let people: Record<string, unknown>[];
let audits: Record<string, unknown>[];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getVerifiedSlackIdentities).mockResolvedValue([]);
  people = [];
  audits = [{ id: "q1", created_at: new Date(Date.now() - 1_000).toISOString(), answer_status: "respondida", user_id: null, external_user_id: "T1:U1", citations: [] }];
  vi.mocked(getCurrentAuthSession).mockResolvedValue({ user: { id: "owner", role: "cliente" } } as Awaited<ReturnType<typeof getCurrentAuthSession>>);
  vi.mocked(getAccessibleOrganizationIdsForUser).mockResolvedValue({ primaryOrganizationId: "org", organizationIds: ["org"] } as Awaited<ReturnType<typeof getAccessibleOrganizationIdsForUser>>);
  vi.mocked(getSlackSectorLeaders).mockResolvedValue([
    { id: "s1", active: true, inviteStatus: "ativo", leader: { slackTeamId: "T1", slackUserId: "U1" } },
    { id: "s2", active: true, inviteStatus: "ativo", leader: { slackTeamId: "T1", slackUserId: "U1" } },
    { id: "s3", active: false, inviteStatus: "ativo", leader: { slackTeamId: "T1", slackUserId: "U2" } },
  ] as Awaited<ReturnType<typeof getSlackSectorLeaders>>);
  vi.mocked(createSupabaseAdminClient).mockImplementation(() => ({
    from(table: string) {
      const rows = () => table === "organization_people" ? people : table === "asset_question_audits" ? audits : [];
      const query = {
        select: () => query,
        eq: (column: string, value: unknown) => { filters(table, column, value); return query; },
        gte: (column: string, value: unknown) => { filters(table, column, value); return query; },
        lt: (column: string, value: unknown) => { filters(table, column, value); return query; },
        order: () => query,
        in: () => query,
        range: (start: number, end: number) => { ranges(table, start, end); return Promise.resolve({ data: rows().slice(start, end + 1), error: null }); },
        then: (resolve: (result: unknown) => unknown) => Promise.resolve(resolve({ data: rows(), error: null })),
      };
      return query;
    },
  } as unknown as ReturnType<typeof createSupabaseAdminClient>));
});

describe("fonte de uso por empresa", () => {
  it("inclui líder só do Slack uma vez e usa o mesmo escopo em todas as leituras", async () => {
    const result = await getProcessUsageOverview();
    expect(result?.totals).toMatchObject({ teamSize: 1, askers: 1 });
    expect(result?.adoption.value).toBe(100);
    expect(getSlackSectorLeaders).toHaveBeenCalledWith("org");
    for (const table of ["organization_people", "operational_members", "asset_question_audits", "asset_answer_feedback"]) {
      expect(filters).toHaveBeenCalledWith(table, "organization_id", "org");
    }
    expect(filters).toHaveBeenCalledWith("organization_people", "status", "ativo");
    expect(filters).toHaveBeenCalledWith("operational_members", "status", "aprovado");
    expect(ranges).toHaveBeenCalledWith("asset_question_audits", 0, 999);
  });

  it("não converte pessoa desconhecida ou sem identidade em adoção zero", async () => {
    for (const identity of ["T2:U1", null]) {
      audits[0].external_user_id = identity;
      const result = await getProcessUsageOverview();
      expect(result?.adoption.value).toBeNull();
      expect(result?.coverage.value).toBe(100);
      expect(result?.adoption.detail).toContain("sem vínculo confirmado");
    }
  });

  it("não soma cadastros app e Slack sem prova de que são pessoas distintas", async () => {
    people = [{ id: "p1", auth_user_id: "app1", email: "a@example.com" }];
    const result = await getProcessUsageOverview();
    expect(result?.totals.teamSize).toBeNull();
    expect(result?.adoption.value).toBeNull();
    expect(result?.adoption.detail).toContain("não conciliadas");
  });
  it("usa somente o vínculo comprovado da mesma empresa para conciliar os canais", async () => {
    people = [{ id: "p1", auth_user_id: "app1", email: "a@example.test" }];
    vi.mocked(getVerifiedSlackIdentities).mockResolvedValue([{ appUserId: "app1", slackIdentity: "T1:U1", teamId: "T1", slackUserId: "U1", verifiedAt: "2026-10-20T10:00:00Z" }]);
    const result = await getProcessUsageOverview();
    expect(getVerifiedSlackIdentities).toHaveBeenCalledWith("org");
    expect(result?.totals).toMatchObject({ teamSize: 1, askers: 1 });
    expect(result?.adoption.value).toBe(100);
    audits.push({ ...audits[0], id: "q2", user_id: "app1", external_user_id: null });
    expect((await getProcessUsageOverview())?.totals.askers).toBe(1);
  });

});
