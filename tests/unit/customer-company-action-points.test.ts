import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/authorization", () => ({ getAccessibleOrganizationIdsForUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/integrations/slack", () => ({ getSlackBotTokenForOrganization: vi.fn(), listSlackWorkspaceUsers: vi.fn() }));

import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { getCustomerCompanyActionPoints } from "@/lib/data/customer-company-action-points";
import { buildManualActionPointsBoard } from "@/lib/data/manual-action-points-board";
import { averageAdherence } from "@/lib/data/action-points-adherence-example";
import { getSlackBotTokenForOrganization, listSlackWorkspaceUsers } from "@/lib/integrations/slack";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { AuthSession } from "@/lib/contracts";

const session = { user: { id: "user-a", role: "cliente" } } as AuthSession;
const point = { id: "point-a", organization_id: "org-a", asset_id: "asset-a", slack_team_id: "team-a", slack_user_id: "leader-a", title: "Revisar prioridades", deadline: null, frequency: "semanal", reason: "A operação perdeu foco.", action: "Conduzir o ritual.", continuity: "Usar o SOP." };
let scopes: { table: string; in: ReturnType<typeof vi.fn>; not: ReturnType<typeof vi.fn> }[];
let followupRows: Array<{ id: string; action_point_id: string; organization_id: string; question: string; message_ts: string | null; created_at: string; status: string }>;
let reportRows: Array<{ followup_id: string; organization_id: string; slack_event_job_id: string; confirmation_job_id?: string | null; status: string; summary: string; registered_at: string; confirmed_at: string | null }>;
let jobRows: Array<{ id: string; organization_id: string; question: { text: string; ts?: string; threadTs?: string }; reply?: { text: string } | null; delivered_ts?: string | null }>;

beforeEach(() => {
  vi.clearAllMocks();
  scopes = [];
  followupRows = [];
  reportRows = [];
  jobRows = [];
  vi.mocked(getAccessibleOrganizationIdsForUser).mockResolvedValue({ isSuperadmin: false, organizationIds: ["org-a"], primaryOrganizationId: "org-a" });
  vi.mocked(getSlackBotTokenForOrganization).mockResolvedValue({ botToken: "token", teamId: "team-a" } as Awaited<ReturnType<typeof getSlackBotTokenForOrganization>>);
  vi.mocked(listSlackWorkspaceUsers).mockResolvedValue([{ userId: "leader-a", name: "Ana Lima", avatarUrl: null }]);
  vi.mocked(createSupabaseAdminClient).mockReturnValue({
    schema: vi.fn(() => ({ from: fromTable })), from: fromTable,
  } as unknown as ReturnType<typeof createSupabaseAdminClient>);
});

function fromTable(table: string) {
  const data = table === "admin_company_action_points" ? [point] : table === "organizations" ? [{ id: "org-a", name: "Empresa A" }] : table === "manual_action_point_followups" ? followupRows.map(row => ({ slack_team_id: "team-a", slack_user_id: "leader-a", channel_id: "D1", ...row })) : table === "manual_action_point_reports" ? reportRows.map(row => ({ confirmation_job_id: null, ...row })) : table === "slack_delivery_jobs" ? jobRows.map(({ question, ...row }) => ({ team_id: "team-a", reply: null, delivered_ts: null, ...row, question: { userId: "leader-a", channel: "D1", ts: "1793818800.000001", ...question } })) : [{ id: "asset-a", organization_id: "org-a", title: "SOP de prioridades", status: "publicado", archived_at: null, current_published_version_id: "version-a" }];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "in", "not", "order", "eq", "contains"]) chain[method] = vi.fn(() => chain);
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
    expect(scopes.find(scope => scope.table === "manual_action_point_reports")?.not).not.toHaveBeenCalled();
    expect(items).toMatchObject([{ title: "Revisar prioridades", companyName: "Empresa A", assetTitle: "SOP de prioridades", leaderName: "Ana Lima", action: "Conduzir o ritual." }]);
    expect(items[0]).not.toHaveProperty("adherence");
    const board = buildManualActionPointsBoard(items);
    expect(board.categories[0]).toMatchObject({ leader: { name: "Ana Lima" }, actionPoints: [{ name: "Revisar prioridades", frequency: "Semanal", eventLabel: "Sem relato", actualCounts: { eligible: 0, reported: 0 }, checkIns: [], manualDetails: { action: "Conduzir o ritual." } }] });
    expect(board.categories[0].actionPoints[0].cycleTotal).toBeUndefined();
  });

  it("contabiliza confirmação recente, parcial e silêncio vencido sem penalizar pergunta nova", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-06T13:00:00Z"));
      followupRows = [
        { id: "done", action_point_id: "point-a", organization_id: "org-a", question: "Fez?", message_ts: "1793880000.000001", created_at: "2026-11-05T12:00:00Z", status: "respondido" },
        { id: "partial", action_point_id: "point-a", organization_id: "org-a", question: "Avançou?", message_ts: "1793793600.000001", created_at: "2026-11-04T12:00:00Z", status: "respondido" },
        { id: "pending", action_point_id: "point-a", organization_id: "org-a", question: "Concluiu?", message_ts: "1793707200.000001", created_at: "2026-11-03T12:00:00Z", status: "enviado" },
        { id: "new", action_point_id: "point-a", organization_id: "org-a", question: "Hoje?", message_ts: "1793966400.000001", created_at: "2026-11-06T12:00:00Z", status: "enviado" },
        { id: "recent-done", action_point_id: "point-a", organization_id: "org-a", question: "Concluiu agora?", message_ts: "1793962800.000001", created_at: "2026-11-06T11:00:00Z", status: "respondido" },
      ];
      reportRows = [
        { followup_id: "done", organization_id: "org-a", slack_event_job_id: "job-done", status: "executado_relato", summary: "Feito", registered_at: "2026-11-05T13:00:00Z", confirmed_at: "2026-11-05T13:10:00Z" },
        { followup_id: "partial", organization_id: "org-a", slack_event_job_id: "job-partial", status: "parcial", summary: "Parte feita", registered_at: "2026-11-04T13:00:00Z", confirmed_at: "2026-11-04T13:10:00Z" },
        { followup_id: "pending", organization_id: "org-a", slack_event_job_id: "job-pending", status: "executado_relato", summary: "Sem confirmação", registered_at: "2026-11-03T13:00:00Z", confirmed_at: null },
        { followup_id: "recent-done", organization_id: "org-a", slack_event_job_id: "job-recent-done", status: "executado_relato", summary: "Feito agora", registered_at: "2026-11-06T11:10:00Z", confirmed_at: "2026-11-06T11:11:00Z" },
      ];
      const items = await getCustomerCompanyActionPoints(session);
      expect(items[0].followupCounts).toEqual({ eligible: 4, executed: 2, partial: 1 });
      expect(buildManualActionPointsBoard(items).categories[0].actionPoints[0].actualCounts).toMatchObject({ eligible: 4, reported: 2, partial: 1 });
    } finally { vi.useRealTimers(); }
  });

  it("mostra avanço imediato quando há um validado e uma pergunta recente aguardando", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-05T17:15:00Z"));
      followupRows = [
        { id: "validated", action_point_id: "point-a", organization_id: "org-a", question: "Concluiu?", message_ts: "1793898000.000001", created_at: "2026-11-05T17:00:00Z", status: "respondido" },
        { id: "waiting", action_point_id: "point-a", organization_id: "org-a", question: "Como foi?", message_ts: "1793898300.000001", created_at: "2026-11-05T17:05:00Z", status: "enviado" },
      ];
      reportRows = [{ followup_id: "validated", organization_id: "org-a", slack_event_job_id: "job-validated", status: "executado_relato", summary: "Concluído", registered_at: "2026-11-05T17:02:00Z", confirmed_at: "2026-11-05T17:03:00Z" }];
      const board = buildManualActionPointsBoard(await getCustomerCompanyActionPoints(session));
      expect(board.categories[0].actionPoints[0].actualCounts).toMatchObject({ eligible: 1, reported: 1 });
      expect(averageAdherence(board.categories.flatMap(category => category.actionPoints))).toBe(100);
    } finally { vi.useRealTimers(); }
  });

  it("mostra as mensagens literais da pessoa e do agente na trilha", async () => {
    followupRows = [{ id: "cycle-a", action_point_id: "point-a", organization_id: "org-a", question: "Vamos acompanhar o action point *Revisar prioridades*.\n\nO que você conseguiu fazer até agora? Conte o que foi executado. Use *Responder na thread* desta mensagem.\n\nReferência: 00000000-0000-0000-0000-000000000001", message_ts: "1793815200.000001", created_at: "2026-11-04T17:00:00Z", status: "respondido" }];
    reportRows = [{ followup_id: "cycle-a", organization_id: "org-a", slack_event_job_id: "job-a", status: "executado_relato", summary: "Ana relatou ter conduzido o ritual.", registered_at: "2026-11-04T18:00:00Z", confirmed_at: null }];
    jobRows = [{ id: "job-a", organization_id: "org-a", question: { text: "Conduzi o ritual hoje às 9h.\nRegistrei os próximos passos." } }];
    const board = buildManualActionPointsBoard(await getCustomerCompanyActionPoints(session));
    expect(board.categories[0].actionPoints[0]).toMatchObject({ health: "aguardando", eventLabel: "Aguardando confirmação", checkIns: [
      { author: "Ana Lima", message: "Conduzi o ritual hoje às 9h.\nRegistrei os próximos passos.", originalAvailable: true, result: "aguardando_confirmacao", fromLeader: true },
      { author: "Agente DirectScal", message: followupRows[0].question, fromLeader: false },
    ] });
    expect(board.categories[0].actionPoints[0].checkIns[0]).not.toHaveProperty("context");
  });

  it("ordena ciclos do mais antigo ao recente e conserva o último relato da tabela", async () => {
    followupRows = [
      { id: "cycle-new", action_point_id: "point-a", organization_id: "org-a", question: "Pergunta recente", message_ts: "1793880000.000001", created_at: "2026-11-05T10:00:00Z", status: "respondido" },
      { id: "cycle-old", action_point_id: "point-a", organization_id: "org-a", question: "Pergunta antiga", message_ts: "1793793600.000001", created_at: "2026-11-04T10:00:00Z", status: "respondido" },
    ];
    reportRows = [
      { followup_id: "cycle-new", organization_id: "org-a", slack_event_job_id: "job-new", status: "parcial", summary: "Resposta recente", registered_at: "2026-11-05T11:00:00Z", confirmed_at: "2026-11-05T11:01:00Z" },
      { followup_id: "cycle-old", organization_id: "org-a", slack_event_job_id: "job-old", status: "parcial", summary: "Resposta antiga", registered_at: "2026-11-04T11:00:00Z", confirmed_at: "2026-11-04T11:01:00Z" },
    ];
    jobRows = [
      { id: "job-new", organization_id: "org-a", question: { text: "Texto recente literal", ts: "1793883600.000001" } },
      { id: "job-old", organization_id: "org-a", question: { text: "Texto antigo literal", ts: "1793797200.000001" } },
    ];

    const board = buildManualActionPointsBoard(await getCustomerCompanyActionPoints(session));
    const action = board.categories[0].actionPoints[0];
    expect(action.checkIns.map(event => event.message)).toEqual(["Texto recente literal", "Pergunta recente", "Texto antigo literal", "Pergunta antiga"]);
    expect(action.lastCheckInAt).toBeTruthy();
  });

  it("não atribui mensagens de outra empresa", async () => {
    followupRows = [{ id: "cycle-a", action_point_id: "point-a", organization_id: "org-a", question: "Pergunta", message_ts: "1793815200.000001", created_at: "2026-11-04T17:00:00Z", status: "respondido" }];
    reportRows = [{ followup_id: "cycle-a", organization_id: "org-a", slack_event_job_id: "job-a", status: "parcial", summary: "Resumo confirmado", registered_at: "2026-11-04T18:00:00Z", confirmed_at: "2026-11-04T18:01:00Z" }];
    jobRows = [{ id: "job-a", organization_id: "org-b", question: { text: "Mensagem de outra empresa" } }];
    const board = buildManualActionPointsBoard(await getCustomerCompanyActionPoints(session));
    expect(board.categories[0].actionPoints[0].checkIns.map(event => event.message)).toEqual(["Pergunta"]);
  });

  it("mostra dúvida recebida mesmo sem confirmação do resumo", async () => {
    followupRows = [{ id: "cycle-a", action_point_id: "point-a", organization_id: "org-a", question: "Como está o andamento?", message_ts: "1793815200.000001", created_at: "2026-11-04T17:00:00Z", status: "enviado" }];
    reportRows = [{ followup_id: "cycle-a", organization_id: "org-a", slack_event_job_id: "job-a", status: "duvida", summary: "Perguntou sobre o prazo.", registered_at: "2026-11-04T18:00:00Z", confirmed_at: null }];
    jobRows = [{ id: "job-a", organization_id: "org-a", question: { text: "Qual é o prazo?" } }];
    const board = buildManualActionPointsBoard(await getCustomerCompanyActionPoints(session));
    expect(board.categories[0].actionPoints[0]).toMatchObject({ eventLabel: "Dúvida", checkIns: [
      { message: "Qual é o prazo?", result: "duvida", fromLeader: true },
      { message: "Como está o andamento?", fromLeader: false },
    ] });
  });

  it("inclui a resposta entregue pelo agente à dúvida e a confirmação posterior", async () => {
    followupRows = [{ id: "cycle-a", action_point_id: "point-a", organization_id: "org-a", question: "Como está o andamento?", message_ts: "1793815200.000001", created_at: "2026-11-04T17:00:00Z", status: "respondido" }];
    reportRows = [{ followup_id: "cycle-a", organization_id: "org-a", slack_event_job_id: "job-a", confirmation_job_id: "job-confirm" , status: "duvida", summary: "Perguntou sobre o prazo.", registered_at: "2026-11-04T18:00:00Z", confirmed_at: null }];
    jobRows = [
      { id: "job-a", organization_id: "org-a", question: { text: "Qual é o prazo?", ts: "1793818800.000001" }, reply: { text: "O prazo é sexta-feira, conforme o SOP." }, delivered_ts: "1793818860.000001" },
      { id: "job-confirm", organization_id: "org-a", question: { text: "Entendi, obrigado.", ts: "1793818920.000001" }, reply: { text: "Resumo confirmado." }, delivered_ts: "1793818980.000001" },
    ];
    const board = buildManualActionPointsBoard(await getCustomerCompanyActionPoints(session));
    expect(board.categories[0].actionPoints[0].checkIns.map(event => event.message)).toEqual([
      "Resumo confirmado.", "Entendi, obrigado.", "O prazo é sexta-feira, conforme o SOP.", "Qual é o prazo?", "Como está o andamento?",
    ]);
    expect(board.categories[0].actionPoints[0].eventLabel).toBe("Dúvida");
  });

  it("não mostra resposta do agente ainda não entregue", async () => {
    followupRows = [{ id: "cycle-a", action_point_id: "point-a", organization_id: "org-a", question: "Como está o andamento?", message_ts: "1793815200.000001", created_at: "2026-11-04T17:00:00Z", status: "respondido" }];
    reportRows = [{ followup_id: "cycle-a", organization_id: "org-a", slack_event_job_id: "job-a", status: "duvida", summary: "Perguntou sobre o prazo.", registered_at: "2026-11-04T18:00:00Z", confirmed_at: null }];
    jobRows = [{ id: "job-a", organization_id: "org-a", question: { text: "Qual é o prazo?" }, reply: { text: "Resposta ainda não entregue" } }];
    const board = buildManualActionPointsBoard(await getCustomerCompanyActionPoints(session));
    expect(board.categories[0].actionPoints[0].checkIns.map(event => event.message)).toEqual(["Qual é o prazo?", "Como está o andamento?"]);
  });

  it("inclui interações da thread mesmo sem relato classificado", async () => {
    followupRows = [{ id: "cycle-a", action_point_id: "point-a", organization_id: "org-a", question: "Como está o andamento?", message_ts: "1793815200.000001", created_at: "2026-11-04T17:00:00Z", status: "enviado" }];
    jobRows = [{ id: "job-a", organization_id: "org-a", question: { text: "Pode repetir?", ts: "1793818800.000001", threadTs: "1793815200.000001" }, reply: { text: "Claro. Como está o andamento?" }, delivered_ts: "1793818860.000001" }];
    const board = buildManualActionPointsBoard(await getCustomerCompanyActionPoints(session));
    expect(board.categories[0].actionPoints[0].checkIns.map(event => event.message)).toEqual(["Claro. Como está o andamento?", "Pode repetir?", "Como está o andamento?"]);
  });

  it("marca pergunta entregue sem resposta como não respondida depois de 24 horas", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-06T13:00:00Z"));
      followupRows = [{ id: "cycle-a", action_point_id: "point-a", organization_id: "org-a", question: "Como está o andamento?", message_ts: "1793880000.000001", created_at: "2026-11-05T12:00:00Z", status: "enviado" }];
      const board = buildManualActionPointsBoard(await getCustomerCompanyActionPoints(session));
      expect(board.categories[0].actionPoints[0]).toMatchObject({ eventLabel: "Não respondido", checkIns: [
        { author: "Agente DirectScal", result: "nao_respondido", fromLeader: false },
      ] });
    } finally { vi.useRealTimers(); }
  });

  it("mantém aguardando resposta antes de completar 24 horas", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-05T13:00:00Z"));
      followupRows = [{ id: "cycle-a", action_point_id: "point-a", organization_id: "org-a", question: "Como está o andamento?", message_ts: "1793880000.000001", created_at: "2026-11-05T12:00:00Z", status: "enviado" }];
      const board = buildManualActionPointsBoard(await getCustomerCompanyActionPoints(session));
      expect(board.categories[0].actionPoints[0]).toMatchObject({ eventLabel: "Aguardando resposta", checkIns: [
        { author: "Agente DirectScal", result: "aguardando", fromLeader: false },
      ] });
    } finally { vi.useRealTimers(); }
  });
});
