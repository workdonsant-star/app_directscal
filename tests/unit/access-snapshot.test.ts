import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const state = vi.hoisted(() => ({
  rpcError: null as null | { code: string; message: string },
  calls: [] as string[],
}));

const userId = "11111111-1111-4111-8111-111111111111";
const orgId = "22222222-2222-4222-8222-222222222222";

function query(table: string, data: unknown) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    in: () => builder,
    order: () => builder,
    is: () => builder,
    limit: () => builder,
    returns: () => Promise.resolve({ data, error: null }),
    maybeSingle: () => Promise.resolve({ data, error: null }),
    then: (resolve: (value: unknown) => unknown) => resolve({ data, error: null }),
  };
  state.calls.push(table);
  return builder;
}

const tables: Record<string, unknown> = {
  users: { id: userId, name: "Conta Google", email: "dono@fixture.invalid", image: "https://fixture.invalid/a.png" },
  organization_members: [{ organization_id: orgId, role: "cliente" }],
  account_profiles: null,
  organizations: { id: orgId, name: "Fixture", employee_count: 3 },
  organization_module_access: [{ organization_id: orgId, module_id: "module_omdx", enabled: false }],
  client_onboarding_completions: { organization_id: orgId },
  slack_installations: { team_id: "T0FIXTURE" },
};

vi.mock("@/lib/supabase/server", () => {
  const client = {
    from: (table: string) => query(table, tables[table]),
    rpc: (name: string) => {
      state.calls.push(`rpc:${name}`);
      if (name === "get_user_access_snapshot") {
        return Promise.resolve(state.rpcError
          ? { data: null, error: state.rpcError }
          : {
              data: {
                session_version: "initial",
                user: tables.users,
                memberships: tables.organization_members,
                organization: tables.organizations,
                profile: { name: "Nome escolhido", avatar_url: null },
                module_access: tables.organization_module_access,
                onboarding_completed: false,
                slack_connected: true,
              },
              error: null,
            });
      }
      return Promise.resolve({ data: "initial", error: null });
    },
    schema: () => client,
  };
  return { maybeCreateSupabaseAdminClient: () => client };
});

beforeEach(() => {
  vi.resetModules();
  state.calls = [];
  state.rpcError = null;
});

describe("snapshot de acesso", () => {
  it("usa a RPC única e prioriza o perfil persistido", async () => {
    const { getUserAccessSnapshot } = await import("@/lib/auth/access-snapshot");
    const snapshot = await getUserAccessSnapshot(userId);
    expect(state.calls).toEqual(["rpc:get_user_access_snapshot"]);
    expect(snapshot).toMatchObject({
      sessionVersion: "initial",
      memberships: [{ organization_id: orgId, role: "cliente" }],
      profile: { name: "Nome escolhido", avatarUrl: null, profilePersisted: true },
      onboardingCompleted: false,
      slackConnected: true,
    });
  });

  it("cai nas consultas avulsas quando a migração não existe e não insiste na RPC", async () => {
    state.rpcError = { code: "PGRST202", message: "Could not find the function app_private.get_user_access_snapshot" };
    const { getUserAccessSnapshot } = await import("@/lib/auth/access-snapshot");
    const snapshot = await getUserAccessSnapshot(userId);
    expect(snapshot).toMatchObject({
      organization: { id: orgId, name: "Fixture" },
      profile: { name: "Conta Google", avatarUrl: "https://fixture.invalid/a.png", profilePersisted: false },
      moduleAccess: [{ module_id: "module_omdx", enabled: false }],
      onboardingCompleted: true,
      slackConnected: true,
    });
    state.calls = [];
    await getUserAccessSnapshot("33333333-3333-4333-8333-333333333333");
    expect(state.calls).not.toContain("rpc:get_user_access_snapshot");
  });

  it("propaga outros erros da RPC em vez de liberar a sessão", async () => {
    state.rpcError = { code: "57014", message: "statement timeout" };
    const { getUserAccessSnapshot } = await import("@/lib/auth/access-snapshot");
    await expect(getUserAccessSnapshot(userId)).rejects.toThrow("Não foi possível validar a sessão.");
  });

  it("ignora identificadores que não são UUID", async () => {
    const { getUserAccessSnapshot } = await import("@/lib/auth/access-snapshot");
    expect(await getUserAccessSnapshot("seed-user")).toBeNull();
    expect(state.calls).toEqual([]);
  });
});
