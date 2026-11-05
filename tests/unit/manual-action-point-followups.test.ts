import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SlackDeliveryJob } from "@/lib/contracts/slack-delivery";

vi.mock("server-only", () => ({}));
const fixtures = vi.hoisted(() => ({
  rows: [] as Array<{ id: string; status: string; title?: string; action?: string }>,
  latestReport: null as null | { id: string; status: string; confirmed_at: string | null },
  existingSelfReport: null as null | { id: string; followup_id: string; status: string; confirmed_at: string | null },
  seen: [] as Array<[string, unknown]>,
  updates: [] as Array<[string, unknown]>,
  inserts: [] as Array<[string, Record<string, unknown>]>,
}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: () => ({ schema: () => ({ from: (table: string) => {
  const filters: Array<[string, unknown]> = [];
  let updating = false;
  let inserting = false;
  const query = {
    select: () => query,
    eq: (field: string, value: unknown) => { fixtures.seen.push([field, value]); filters.push([field, value]); return query; },
    gte: (field: string, value: unknown) => { fixtures.seen.push([field, value]); return query; },
    order: () => query,
    limit: () => ({ data: fixtures.rows, error: null, maybeSingle: query.maybeSingle }),
    in: () => query,
    is: () => query,
    update: (value: unknown) => { updating = true; fixtures.updates.push([table, value]); return query; },
    insert: (value: Record<string, unknown>) => { inserting = true; fixtures.inserts.push([table, value]); return query; },
    maybeSingle: async () => ({ data: table === "manual_action_point_reports" ? inserting ? { id: "report-new" } : filters.some(([field]) => field === "slack_event_job_id") ? fixtures.existingSelfReport : (updating || filters.some(([field]) => field === "followup_id")) ? fixtures.latestReport : null : null, error: null }),
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
import { isSelfReportedComplete } from "@/lib/agent/follow-up/manual-follow-up";

const job = { id: "00000000-0000-4000-8000-000000000001", question: { kind: "direct", teamId: "T1", userId: "U1", channel: "D1", ts: "123.456", text: "Eu fiz tudo" } } as SlackDeliveryJob;
const installation = { teamId: "T1", organizationId: "00000000-0000-4000-8000-000000000002", botToken: "ficticio", botUserId: "B1" };

beforeEach(() => { fixtures.rows = []; fixtures.latestReport = null; fixtures.existingSelfReport = null; fixtures.seen = []; fixtures.updates = []; fixtures.inserts = []; vi.clearAllMocks(); });

describe("resposta direta ao teste manual", () => {
  it("não confunde uma conclusão parcial com 'fiz tudo'", () => {
    expect(isSelfReportedComplete("fiz tudo que pude, mas faltou registrar")).toBe(false);
    expect(isSelfReportedComplete("não fiz tudo")).toBe(false);
  });

  it("aceita o único ciclo recente da mesma pessoa e conversa", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado" }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue(null);
    expect(await prepareManualActionPointReply(job, installation)).toEqual({ text: expect.stringContaining("identidade ativa") });
    expect(fixtures.seen).toEqual(expect.arrayContaining([["organization_id", installation.organizationId], ["slack_team_id", "T1"], ["slack_user_id", "U1"], ["channel_id", "D1"], ["status", "enviado"]]));
    expect(fixtures.seen.some(([field]) => field === "created_at")).toBe(true);
  });

  it("registra 'fiz tudo' como conclusão declarada sem exigir detalhes nem chamar a IA", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado", title: "Matriz de decisões" }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    const replyJob = { ...job, question: { ...job.question, text: "Eu fiz tudo, não tenho nenhum impedimento" } } as SlackDeliveryJob;
    expect(await prepareManualActionPointReply(replyJob, installation)).toEqual({ text: expect.stringContaining("como relato seu") });
    expect(extractManualFollowupReport).not.toHaveBeenCalled();
    expect(fixtures.inserts).toEqual([["manual_action_point_reports", expect.objectContaining({
      followup_id: "cycle-a", slack_event_job_id: job.id, status: "executado_relato", evidence: null,
      confirmed_at: expect.any(String), confirmation_job_id: job.id,
    })]]);
    expect(fixtures.updates.map(([table]) => table)).toEqual(["manual_action_point_followups"]);
  });

  it("aceita 'fiz tudo sem impedimento' e 'sim, fiz tudo' sem criar proposta inconclusiva", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado", title: "Matriz de decisões" }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    for (const text of ["fiz tudo sem impedimento", "sim, fiz tudo", "executei tudo sem nenhum impedimento"]) {
      const replyJob = { ...job, question: { ...job.question, text } } as SlackDeliveryJob;
      expect(await prepareManualActionPointReply(replyJob, installation)).toEqual({ text: expect.stringContaining("como relato seu") });
    }
    expect(extractManualFollowupReport).not.toHaveBeenCalled();
  });

  it("reutiliza o registro confirmado se o mesmo job for processado novamente", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado", title: "Matriz de decisões" }];
    fixtures.existingSelfReport = { id: "report-a", followup_id: "cycle-a", status: "executado_relato", confirmed_at: "2026-11-04T23:00:00Z" };
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    expect(await prepareManualActionPointReply(job, installation)).toEqual({ text: expect.stringContaining("como relato seu") });
    expect(fixtures.inserts).toEqual([]);
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
