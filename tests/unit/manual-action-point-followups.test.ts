import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SlackDeliveryJob } from "@/lib/contracts/slack-delivery";

vi.mock("server-only", () => ({}));
const fixtures = vi.hoisted(() => ({
  rows: [] as Array<{ id: string; status: string; title?: string; action?: string; message_ts?: string }>,
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
    maybeSingle: async () => ({ data: table === "manual_action_point_followups" ? fixtures.rows[0] && filters.some(([field, value]) => field === "message_ts" && value === (fixtures.rows[0].message_ts ?? "100.000")) ? { organization_id: "00000000-0000-4000-8000-000000000002", message_ts: "100.000", question: "O que foi feito?", action: "Revisar decisões", ...fixtures.rows[0] } : null : table === "manual_action_point_reports" ? inserting ? { id: "report-new" } : filters.some(([field]) => field === "slack_event_job_id") ? fixtures.existingSelfReport : (updating || filters.some(([field]) => field === "followup_id")) ? fixtures.latestReport : null : null, error: null }),
  };
  return query;
} }) }) }));
vi.mock("@/lib/integrations/slack", () => ({ getSlackWorkspaceUser: vi.fn(), getSlackBotUserId: vi.fn().mockResolvedValue("B1"), fetchSlackActionPointThread: vi.fn() }));
vi.mock("@/lib/agent/follow-up/manual-follow-up-provider", () => ({ extractManualFollowupReport: vi.fn() }));
vi.mock("@/lib/data/agent-provider-data-source", () => ({ getActiveAgentProvider: vi.fn(), verifyAgentProvider: vi.fn() }));
vi.mock("@/lib/data/admin-company-action-points", () => ({ AdminCompanyActionPointError: class extends Error {} }));
vi.mock("@/lib/data/admin-adherence-data-source", () => ({ routineOrganizationId: vi.fn() }));
import { prepareManualActionPointReply } from "@/lib/data/manual-action-point-followups";
import { fetchSlackActionPointThread, getSlackWorkspaceUser } from "@/lib/integrations/slack";
import { extractManualFollowupReport } from "@/lib/agent/follow-up/manual-follow-up-provider";
import { buildManualFollowupHistory, isSelfReportedComplete, manualFollowupPrompt } from "@/lib/agent/follow-up/manual-follow-up";

const job = { id: "00000000-0000-4000-8000-000000000001", question: { kind: "direct", teamId: "T1", userId: "U1", channel: "D1", ts: "123.456", threadTs: "100.000", text: "Eu fiz tudo" } } as SlackDeliveryJob;
const installation = { teamId: "T1", organizationId: "00000000-0000-4000-8000-000000000002", botToken: "ficticio", botUserId: "B1" };

beforeEach(() => { fixtures.rows = []; fixtures.latestReport = null; fixtures.existingSelfReport = null; fixtures.seen = []; fixtures.updates = []; fixtures.inserts = []; vi.clearAllMocks(); vi.mocked(extractManualFollowupReport).mockReset(); vi.mocked(fetchSlackActionPointThread).mockResolvedValue([]); });

describe("resposta direta ao teste manual", () => {
  it("seleciona apenas mensagens da pessoa e do bot na thread antes da resposta atual", () => {
    const history = buildManualFollowupHistory([
      { ts: "100.000", user: "B1", text: "Pergunta inicial" },
      { ts: "110.000", user: "U1", text: "Já fiz tudo" },
      { ts: "111.000", user: "U2", text: "Outra pessoa" },
      { ts: "112.000", user: "B1", text: "Quando?" },
      { ts: "123.456", user: "U1", text: "Ontem" },
    ], { userId: "U1", botUserId: "B1", rootTs: "100.000", currentTs: "123.456" });
    expect(history).toEqual([{ role: "person", text: "Já fiz tudo" }, { role: "assistant", text: "Quando?" }]);
    const prompt = manualFollowupPrompt({ title: "Matriz", action: "Revisar decisões", question: "O que foi feito?", history, reply: "Ontem" });
    expect(prompt).toContain("Já fiz tudo");
    expect(prompt).not.toContain("Outra pessoa");
  });

  it("não confunde uma conclusão parcial com 'fiz tudo'", () => {
    expect(isSelfReportedComplete("fiz tudo que pude, mas faltou registrar")).toBe(false);
    expect(isSelfReportedComplete("não fiz tudo")).toBe(false);
  });

  it("aceita somente o ciclo da mesma pessoa e thread", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado" }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue(null);
    expect(await prepareManualActionPointReply(job, installation)).toEqual({ text: expect.stringContaining("identidade ativa") });
    expect(fixtures.seen).toEqual(expect.arrayContaining([["organization_id", installation.organizationId], ["slack_team_id", "T1"], ["slack_user_id", "U1"], ["channel_id", "D1"], ["message_ts", "100.000"]]));
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

  it("aceita variações naturais de conclusão sem depender da IA", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado", title: "Matriz de decisões" }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    for (const text of ["fiz tudo sem impedimento", "sim, fiz tudo", "executei tudo sem nenhum impedimento", "Ja fiz tudo", "Já fiz tudo sem impedimento", "Fiz ontem, eu fiz todas as partes"]) {
      const replyJob = { ...job, question: { ...job.question, text } } as SlackDeliveryJob;
      expect(await prepareManualActionPointReply(replyJob, installation)).toEqual({ text: expect.stringContaining("como relato seu") });
    }
    expect(extractManualFollowupReport).not.toHaveBeenCalled();
  });

  it("registra a dúvida literal sem exigir confirmação do resumo", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado", title: "Matriz de decisões" }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    const question = { ...job, question: { ...job.question, text: "Quais decisões devo revisar?" } } as SlackDeliveryJob;
    expect(await prepareManualActionPointReply(question, installation)).toEqual({ text: expect.stringContaining("mudou desde esta pergunta") });
    expect(extractManualFollowupReport).not.toHaveBeenCalled();
    expect(fixtures.inserts).toEqual([["manual_action_point_reports", expect.objectContaining({
      followup_id: "cycle-a", status: "duvida", summary: "Quais decisões devo revisar?", evidence: null,
    })]]);
  });

  it("responde claramente quando a leitura do Slack falha", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado", title: "Matriz de decisões" }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    vi.mocked(fetchSlackActionPointThread).mockRejectedValue(new Error("indisponível"));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const replyJob = { ...job, question: { ...job.question, text: "Conferi as decisões" } } as SlackDeliveryJob;
    expect(await prepareManualActionPointReply(replyJob, installation)).toEqual({ text: expect.stringContaining("Não consegui ler esta conversa") });
    expect(fixtures.inserts).toEqual([]);
    expect(extractManualFollowupReport).not.toHaveBeenCalled();
    errorLog.mockRestore();
  });

  it("informa a falta de motor de IA sem deixar a thread silenciosa", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado", title: "Matriz de decisões" }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    vi.mocked(extractManualFollowupReport).mockRejectedValue(new Error("Selecione um modelo de IA antes de registrar o relato."));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const replyJob = { ...job, question: { ...job.question, text: "Conferi as decisões" } } as SlackDeliveryJob;
    expect(await prepareManualActionPointReply(replyJob, installation)).toEqual({ text: expect.stringContaining("motor de IA deste acompanhamento não está selecionado") });
    expect(fixtures.inserts).toEqual([]);
    errorLog.mockRestore();
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
    vi.mocked(extractManualFollowupReport).mockResolvedValue({ status: "inconclusivo", summary: "Relato sem detalhes", evidence: null, followUpQuestion: "Qual parte ficou pendente?", supportingQuote: null });
    const replyJob = { ...job, question: { ...job.question, text: "tá certo" } } as SlackDeliveryJob;
    expect(await prepareManualActionPointReply(replyJob, installation)).toEqual({ text: "Qual parte ficou pendente?" });
    expect(extractManualFollowupReport).toHaveBeenCalledOnce();
    expect(fixtures.updates).toEqual([]);
  });

  it("não repete a mesma pergunta da IA quando a thread já a contém", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado", title: "Matriz de decisões" }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    vi.mocked(fetchSlackActionPointThread).mockResolvedValue([{ ts: "110.000", user: "B1", text: "Qual parte ficou pendente?" }]);
    vi.mocked(extractManualFollowupReport).mockResolvedValue({ status: "inconclusivo", summary: "Sem resultado claro", evidence: null, followUpQuestion: "Qual parte ficou pendente?", supportingQuote: null });
    const replyJob = { ...job, question: { ...job.question, text: "Não sei" } } as SlackDeliveryJob;
    expect(await prepareManualActionPointReply(replyJob, installation)).toEqual({ text: expect.stringContaining("sem repetir a pergunta") });
    expect(fixtures.inserts).toEqual([]);
  });

  it("registra conclusão em linguagem natural usando só o histórico da thread correta", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado", title: "Matriz de decisões" }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    vi.mocked(fetchSlackActionPointThread).mockResolvedValue([
      { ts: "100.000", user: "B1", text: "O que foi feito?" },
      { ts: "110.000", user: "U1", text: "Já fiz tudo sem impedimento" },
      { ts: "111.000", user: "U2", text: "Outra pessoa fez metade" },
      { ts: "112.000", user: "B1", text: "Quando foi?" },
    ]);
    vi.mocked(extractManualFollowupReport).mockResolvedValue({ status: "executado_relato", summary: "A pessoa declarou que concluiu toda a ação ontem.", evidence: null, followUpQuestion: null, supportingQuote: "Já fiz tudo sem impedimento" });
    const replyJob = { ...job, question: { ...job.question, text: "Revisei a matriz ontem e encaminhei todas as decisões" } } as SlackDeliveryJob;
    expect(await prepareManualActionPointReply(replyJob, installation)).toEqual({ text: expect.stringContaining("como relato seu") });
    expect(fetchSlackActionPointThread).toHaveBeenCalledWith("ficticio", "D1", "100.000", "123.456");
    expect(extractManualFollowupReport).toHaveBeenCalledWith(expect.objectContaining({
      question: "O que foi feito?", history: [{ role: "person", text: "Já fiz tudo sem impedimento" }, { role: "assistant", text: "Quando foi?" }],
    }));
    expect(fixtures.inserts[0]?.[1]).toEqual(expect.objectContaining({ status: "executado_relato", confirmed_at: expect.any(String) }));
  });

  it("não registra conclusão sem citação da pessoa nem quando a mensagem atual indica pendência", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado", title: "Matriz de decisões" }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    vi.mocked(extractManualFollowupReport).mockResolvedValue({ status: "executado_relato", summary: "Conclusão", evidence: null, followUpQuestion: null, supportingQuote: null });
    const noQuote = { ...job, question: { ...job.question, text: "Conferi as decisões" } } as SlackDeliveryJob;
    expect(await prepareManualActionPointReply(noQuote, installation)).toEqual({ text: expect.stringContaining("declaração clara") });
    vi.mocked(extractManualFollowupReport).mockResolvedValue({ status: "executado_relato", summary: "Conclusão", evidence: null, followUpQuestion: null, supportingQuote: "Já fiz tudo" });
    const pending = { ...job, question: { ...job.question, text: "Mas faltou registrar uma decisão" } } as SlackDeliveryJob;
    expect(await prepareManualActionPointReply(pending, installation)).toEqual({ text: expect.stringContaining("algo pendente") });
    expect(fixtures.inserts).toEqual([]);
  });

  it("orienta a responder na thread quando a mensagem chega solta na DM", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado" }, { id: "cycle-b", status: "enviado" }];
    const noThread = { ...job, question: { ...job.question, threadTs: undefined } } as SlackDeliveryJob;
    expect(await prepareManualActionPointReply(noThread, installation)).toEqual({ text: expect.stringContaining("responda na thread") });
    expect(getSlackWorkspaceUser).not.toHaveBeenCalled();
  });

  it("deixa uma DM sem ciclo elegível seguir para o assistente", async () => {
    expect(await prepareManualActionPointReply(job, installation)).toBeNull();
  });
});
