import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SlackDeliveryJob } from "@/lib/contracts/slack-delivery";

vi.mock("server-only", () => ({}));
const fixtures = vi.hoisted(() => ({
  rows: [] as Array<{ id: string; status: string; title?: string; action?: string }>,
  latestReport: null as null | { id: string; status: string; confirmed_at: string | null },
  seen: [] as Array<[string, unknown]>,
  updates: [] as Array<[string, unknown]>,
}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: () => ({ schema: () => ({ from: (table: string) => {
  const filters: Array<[string, unknown]> = [];
  let updating = false;
  const query = {
    select: () => query,
    eq: (field: string, value: unknown) => { fixtures.seen.push([field, value]); filters.push([field, value]); return query; },
    gte: (field: string, value: unknown) => { fixtures.seen.push([field, value]); return query; },
    order: () => query,
    limit: () => ({ data: fixtures.rows, error: null, maybeSingle: query.maybeSingle }),
    in: () => query,
    is: () => query,
    update: (value: unknown) => { updating = true; fixtures.updates.push([table, value]); return query; },
    maybeSingle: async () => ({ data: table === "manual_action_point_reports" && (updating || filters.some(([field]) => field === "followup_id")) ? fixtures.latestReport : null, error: null }),
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

beforeEach(() => { fixtures.rows = []; fixtures.latestReport = null; fixtures.seen = []; fixtures.updates = []; vi.clearAllMocks(); });

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

  it("não transforma 'fiz tudo sem impedimento' em uma proposta inconclusiva", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado", title: "Matriz de decisões" }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    const replyJob = { ...job, question: { ...job.question, text: "fiz tudo sem impedimento" } } as SlackDeliveryJob;
    expect(await prepareManualActionPointReply(replyJob, installation)).toEqual({ text: expect.stringContaining("quais partes da ação") });
    expect(extractManualFollowupReport).not.toHaveBeenCalled();
  });

  it("não cria nova proposta quando a pessoa responde apenas confirmar a um relato inconclusivo", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado", title: "Matriz de decisões" }];
    fixtures.latestReport = { id: "report-a", status: "inconclusivo", confirmed_at: null };
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    const replyJob = { ...job, question: { ...job.question, text: "confirmar" } } as SlackDeliveryJob;
    expect(await prepareManualActionPointReply(replyJob, installation)).toEqual({ text: expect.stringContaining("ainda não descreve") });
    expect(extractManualFollowupReport).not.toHaveBeenCalled();
    expect(fixtures.updates).toEqual([]);
  });

  it("aceita confirmar sem ID quando a proposta mais recente contém um relato concreto", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado", title: "Matriz de decisões" }];
    fixtures.latestReport = { id: "report-a", status: "parcial", confirmed_at: null };
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    const replyJob = { ...job, question: { ...job.question, text: "confirmar" } } as SlackDeliveryJob;
    expect(await prepareManualActionPointReply(replyJob, installation)).toEqual({ text: expect.stringContaining("Resumo confirmado") });
    expect(extractManualFollowupReport).not.toHaveBeenCalled();
    expect(fixtures.updates.map(([table]) => table)).toEqual(["manual_action_point_reports", "manual_action_point_followups"]);
  });

  it("pede detalhes quando o motor classifica o relato como inconclusivo", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado", title: "Matriz de decisões", action: "Revisar decisões" }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    vi.mocked(extractManualFollowupReport).mockResolvedValue({ status: "inconclusivo", summary: "Relato sem detalhes", evidence: null });
    const replyJob = { ...job, question: { ...job.question, text: "tá certo" } } as SlackDeliveryJob;
    expect(await prepareManualActionPointReply(replyJob, installation)).toEqual({ text: expect.stringContaining("Ainda preciso de detalhes") });
    expect(extractManualFollowupReport).toHaveBeenCalledOnce();
    expect(fixtures.updates).toEqual([]);
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
