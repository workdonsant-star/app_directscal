import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/authorization", () => ({ getAccessibleOrganizationIdsForUser: vi.fn() }));
vi.mock("@/lib/data/organization-structure-data-source", () => ({ getOrganizationStructure: vi.fn() }));
vi.mock("@/lib/integrations/slack", () => ({ getSlackInstallationForOrganization: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));

import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { getOrganizationStructure } from "@/lib/data/organization-structure-data-source";
import { getSlackInstallationForOrganization } from "@/lib/integrations/slack";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { completeClientOnboarding, getClientOnboardingForUser } from "@/lib/data/client-onboarding-data-source";
import type { AuthSession, OrganizationSector } from "@/lib/contracts";

const session = { user: { id: "owner-test", role: "cliente" } } as AuthSession;
const sector = { active: true, inviteStatus: "convite_enviado", leader: { email: "lider@example.com", position: "Líder" } } as OrganizationSector;
let completed = false;
let writeError: { message: string } | null = null;
const writes = vi.fn();
const filters = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  completed = false;
  writeError = null;
  vi.mocked(getAccessibleOrganizationIdsForUser).mockResolvedValue({ isSuperadmin: false, organizationIds: ["organization-test"], primaryOrganizationId: "organization-test" });
  vi.mocked(getOrganizationStructure).mockResolvedValue([sector]);
  vi.mocked(getSlackInstallationForOrganization).mockResolvedValue({ teamId: "T-TEST", teamName: "Empresa", installedAt: "2026-10-12T12:00:00Z", scope: "users:read,im:write" });
  vi.mocked(createSupabaseAdminClient).mockImplementation(() => {
    const client = {
      schema: () => client,
      from: (table: string) => {
        let writing = false;
        const query = {
          select: () => query,
          eq: (column: string, value: unknown) => { filters(table, column, value); return query; },
          maybeSingle: async () => ({ data: completed ? { completed_at: "2026-10-12T12:00:00Z" } : null, error: null }),
          upsert: (row: unknown, options: unknown) => { writing = true; writes(row, options); return query; },
          then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(writing ? { data: writeError ? null : [], error: writeError } : { count: 1, error: null })),
        };
        return query;
      },
    };
    return client as unknown as ReturnType<typeof createSupabaseAdminClient>;
  });
});

describe("persistência do onboarding", () => {
  it("grava apenas na empresa derivada do membership e permite repetição idempotente", async () => {
    expect(await completeClientOnboarding(session)).toEqual({ ok: true });
    expect(writes).toHaveBeenCalledWith({ organization_id: "organization-test", completed_by: "owner-test" }, { onConflict: "organization_id", ignoreDuplicates: true });
    expect(filters).toHaveBeenCalledWith("client_onboarding_completions", "organization_id", "organization-test");
    expect(getOrganizationStructure).toHaveBeenCalledWith("organization-test");
  });
  it("revalida desconexão do Slack após a tela ter sido aberta e não grava", async () => {
    vi.mocked(getSlackInstallationForOrganization).mockResolvedValue(null);
    expect((await completeClientOnboarding(session)).ok).toBe(false);
    expect(writes).not.toHaveBeenCalled();
  });
  it("não reabre conclusão existente após desconexão ou mudança de estrutura", async () => {
    completed = true;
    vi.mocked(getSlackInstallationForOrganization).mockResolvedValue(null);
    expect(await completeClientOnboarding(session)).toEqual({ ok: true });
    expect(getOrganizationStructure).not.toHaveBeenCalled();
    expect(writes).not.toHaveBeenCalled();
  });
  it("não confirma sucesso quando a gravação falha", async () => {
    writeError = { message: "write failed" };
    await expect(completeClientOnboarding(session)).rejects.toThrow("Não foi possível concluir");
  });
  it("sessão sem empresa não cria conclusão", async () => {
    vi.mocked(getAccessibleOrganizationIdsForUser).mockResolvedValue({ isSuperadmin: false, organizationIds: [], primaryOrganizationId: null });
    expect(await getClientOnboardingForUser("owner-test")).toBeNull();
    expect((await completeClientOnboarding(session)).ok).toBe(false);
    expect(writes).not.toHaveBeenCalled();
  });
});


describe("entrada de empresas já conectadas", () => {
  it("dispensa onboarding com Slack ativo da empresa sem conclusão anterior", async () => {
    expect(await getClientOnboardingForUser("owner-test")).toEqual({ organizationId: "organization-test", completed: false, requiresOnboarding: false });
    expect(getSlackInstallationForOrganization).toHaveBeenCalledWith("organization-test");
    expect(writes).not.toHaveBeenCalled();
  });
  it("exige onboarding quando a própria empresa não tem conexão", async () => {
    vi.mocked(getSlackInstallationForOrganization).mockResolvedValue(null);
    expect(await getClientOnboardingForUser("owner-test")).toEqual({ organizationId: "organization-test", completed: false, requiresOnboarding: true });
  });
  it("dispensa onboarding concluído mesmo sem Slack", async () => {
    completed = true;
    expect(await getClientOnboardingForUser("owner-test")).toEqual({ organizationId: "organization-test", completed: true, requiresOnboarding: false });
    expect(getSlackInstallationForOrganization).not.toHaveBeenCalled();
  });
});
