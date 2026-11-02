import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const ORG = "o-1";
const OWNER = "u-owner";
const LEADER = "u-leader";
const OTHER_ADMIN = "u-other";

const db = vi.hoisted(() => ({
  viewer: "",
  tables: {} as Record<string, Array<Record<string, unknown>>>,
}));

type Filter = (row: Record<string, unknown>) => boolean;

function builder(table: string) {
  const filters: Filter[] = [];
  const run = () => ({ data: (db.tables[table] ?? []).filter((row) => filters.every((f) => f(row))), error: null });
  const chain = {
    select: () => chain,
    order: () => chain,
    limit: () => chain,
    eq: (column: string, value: unknown) => { filters.push((row) => row[column] === value); return chain; },
    in: (column: string, values: unknown[]) => { filters.push((row) => values.includes(row[column])); return chain; },
    is: (column: string, value: unknown) => { filters.push((row) => (row[column] ?? null) === value); return chain; },
    returns: () => Promise.resolve(run()),
    maybeSingle: () => Promise.resolve({ data: run().data[0] ?? null, error: null }),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(run()).then(resolve),
  };
  return chain;
}

vi.mock("@/lib/supabase/server", () => {
  const client = { from: builder, schema: () => client, rpc: () => Promise.resolve({ data: [], error: null }) };
  return { createSupabaseAdminClient: () => client, maybeCreateSupabaseAdminClient: () => client };
});
vi.mock("@/lib/auth/session", () => ({
  getCurrentAuthSession: vi.fn(async () => ({ user: { id: db.viewer } })),
}));
vi.mock("@/lib/auth/authorization", () => ({
  getAccessibleOrganizationIdsForUser: vi.fn(async () => ({ isSuperadmin: false, organizationIds: [ORG], primaryOrganizationId: ORG })),
}));

const at = "2026-10-01T12:00:00.000Z";
function diagnostic(id: string, createdBy: string) {
  return {
    id, organization_id: ORG, template_id: "t-1", name: `Pesquisa ${id}`, description: null, status: "ativo",
    created_at: at, updated_at: at, activated_at: at, closed_at: null, deadline: null, general_score: null,
    created_by_user_id: createdBy,
  };
}

beforeEach(() => {
  vi.resetModules();
  db.tables = {
    organizations: [{ id: ORG, name: "Fixture", employee_count: 10, domain: null, created_at: at, updated_at: at }],
    diagnostics: [diagnostic("d-owner", OWNER), diagnostic("d-other", OTHER_ADMIN), diagnostic("d-assigned", OWNER)],
    organization_members: [
      { id: "m-1", organization_id: ORG, user_id: OWNER, role: "cliente", created_at: at, updated_at: at },
      { id: "m-2", organization_id: ORG, user_id: LEADER, role: "admin", created_at: at, updated_at: at },
      { id: "m-3", organization_id: ORG, user_id: OTHER_ADMIN, role: "admin", created_at: at, updated_at: at },
    ],
    diagnostic_sector_scopes: [{ id: "s-1", organization_id: ORG, diagnostic_id: "d-assigned", sector_id: "sec-1", created_at: at }],
    organization_people: [{ id: "p-leader", organization_id: ORG, auth_user_id: LEADER }],
    organization_sectors: [{ id: "sec-1", organization_id: ORG, name: "Operações", active: true }],
    diagnostic_leader_assignments: [{ id: "a-1", organization_id: ORG, diagnostic_sector_scope_id: "s-1", person_id: "p-leader" }],
    diagnostic_slack_leader_assignments: [{ organization_id: ORG, diagnostic_sector_scope_id: "s-1", slack_leader_id: "slack-1" }],
    users: [
      { id: OWNER, name: "Conta Google do dono", email: "dono@fixture.invalid", image: null },
      { id: OTHER_ADMIN, name: "Outro admin", email: "outro@fixture.invalid", image: "https://fixture.invalid/o.png" },
    ],
    account_profiles: [{ user_id: OWNER, name: "Nome escolhido", avatar_url: null }],
    response_sessions: [],
  };
});

describe("visibilidade dos diagnósticos", () => {
  it("Superadmin da empresa vê todos, com criador pelo perfil persistido", async () => {
    db.viewer = OWNER;
    const { getDiagnostics } = await import("@/lib/data/omdx-data-source");
    const diagnostics = await getDiagnostics();
    expect(diagnostics.map((item) => item.id).sort()).toEqual(["d-assigned", "d-other", "d-owner"]);
    const byId = new Map(diagnostics.map((item) => [item.id, item]));
    expect(byId.get("d-owner")?.creator).toMatchObject({ name: "Nome escolhido", avatarUrl: null, role: "cliente" });
    expect(byId.get("d-other")?.creator).toMatchObject({ name: "Outro admin", avatarUrl: "https://fixture.invalid/o.png", role: "admin" });
    expect(byId.get("d-assigned")?.sectors).toEqual([{ id: "sec-1", name: "Operações", leaderIds: ["p-leader", "slack-1"] }]);
    expect(byId.get("d-owner")?.permissions?.canViewFounderLink).toBe(true);
  });

  it("Admin vê somente os próprios e os atribuídos ao seu setor", async () => {
    db.viewer = LEADER;
    const { getDiagnostics, getVisibleDiagnosticIds } = await import("@/lib/data/omdx-data-source");
    expect((await getDiagnostics()).map((item) => item.id)).toEqual(["d-assigned"]);
    expect(await getVisibleDiagnosticIds()).toEqual(["d-assigned"]);
  });

  it("Admin sem atribuição nem autoria não vê nada", async () => {
    db.viewer = "u-sem-vinculo";
    db.tables.organization_members.push({ id: "m-4", organization_id: ORG, user_id: "u-sem-vinculo", role: "admin", created_at: at, updated_at: at });
    const { getVisibleDiagnosticIds } = await import("@/lib/data/omdx-data-source");
    expect(await getVisibleDiagnosticIds()).toEqual([]);
  });
});
