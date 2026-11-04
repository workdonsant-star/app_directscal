import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SlackDeliveryJob } from "@/lib/contracts/slack-delivery";

vi.mock("server-only", () => ({}));
const fixtures = vi.hoisted(() => ({ rows: [] as Array<{ id: string; status: string; title?: string }>, seen: [] as Array<[string, unknown]> }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: () => ({ schema: () => ({ from: () => {
  const query = {
    select: () => query,
    eq: (field: string, value: unknown) => { fixtures.seen.push([field, value]); return query; },
    gte: (field: string, value: unknown) => { fixtures.seen.push([field, value]); return query; },
    order: () => query,
    limit: async () => ({ data: fixtures.rows, error: null }),
    in: () => query,
    maybeSingle: async () => ({ data: null, error: null }),
  };
  return query;
} }) }) }));
vi.mock("@/lib/integrations/slack", () => ({ getSlackWorkspaceUser: vi.fn() }));
vi.mock("@/lib/agent/follow-up/manual-follow-up-provider", () => ({ extractManualFollowupReport: vi.fn() }));
vi.mock("@/lib/data/agent-provider-data-source", () => ({ getActiveAgentProvider: vi.fn(), verifyAgentProvider: vi.fn() }));
vi.mock("@/lib/data/admin-company-action-points", () => ({ AdminCompanyActionPointError: class extends Error {} }));
vi.mock("@/lib/data/admin-adherence-data-source", () => ({ routineOrganizationId: vi.fn() }));
import { prepareManualActionPointReply } from "@/lib/data/manual-action-point-followups";
import { getSlackWorkspaceUser } from "@/lib/integrations/slack";
import { extractManualFollowupReport } from "@/lib/agent/follow-up/manual-follow-up-provider";

const job = { id: "00000000-0000-4000-8000-000000000001", question: { kind: "direct", teamId: "T1", userId: "U1", channel: "D1", ts: "123.456", text: "Eu fiz tudo" } } as SlackDeliveryJob;
const installation = { teamId: "T1", organizationId: "00000000-0000-4000-8000-000000000002", botToken: "ficticio", botUserId: "B1" };

beforeEach(() => { fixtures.rows = []; fixtures.seen = []; vi.clearAllMocks(); });

describe("resposta direta ao teste manual", () => {
  it("aceita o único ciclo recente da mesma pessoa e conversa", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado" }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue(null);
    expect(await prepareManualActionPointReply(job, installation)).toEqual({ text: expect.stringContaining("identidade ativa") });
    expect(fixtures.seen).toEqual(expect.arrayContaining([["organization_id", installation.organizationId], ["slack_team_id", "T1"], ["slack_user_id", "U1"], ["channel_id", "D1"], ["status", "enviado"]]));
    expect(fixtures.seen.some(([field]) => field === "created_at")).toBe(true);
  });

  it("pede fatos concretos para uma declaração genérica, sem registrar conclusão", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado", title: "Matriz de decisões" }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    const replyJob = { ...job, question: { ...job.question, text: "Eu fiz tudo, não tenho nenhum impedimento" } } as SlackDeliveryJob;
    expect(await prepareManualActionPointReply(replyJob, installation)).toEqual({ text: expect.stringContaining("quais partes da ação") });
    expect(extractManualFollowupReport).not.toHaveBeenCalled();
  });

  it("pede a thread correta quando há mais de um ciclo aberto", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado" }, { id: "cycle-b", status: "enviado" }];
    expect(await prepareManualActionPointReply(job, installation)).toEqual({ text: expect.stringContaining("mais de um Action Point") });
    expect(getSlackWorkspaceUser).not.toHaveBeenCalled();
  });

  it("deixa uma DM sem ciclo elegível seguir para o assistente", async () => {
    expect(await prepareManualActionPointReply(job, installation)).toBeNull();
  });
});
