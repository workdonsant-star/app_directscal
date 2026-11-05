import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SlackDeliveryJob } from "@/lib/contracts/slack-delivery";

vi.mock("server-only", () => ({}));
const fixtures = vi.hoisted(() => ({ rows: [] as Array<{ id: string; status: string; title?: string }>, chunks: [] as Array<{ heading_path: string; content: string }>, single: {} as Record<string, unknown>, seen: [] as Array<[string, unknown]>, inserted: [] as string[], insertedReport: null as Record<string, unknown> | null }));
vi.mock("@/lib/supabase/server", () => { const from = (table: string) => {
  const query = {
    select: () => query,
    eq: (field: string, value: unknown) => { fixtures.seen.push([field, value]); return query; },
    gte: (field: string, value: unknown) => { fixtures.seen.push([field, value]); return query; },
    order: () => query,
    limit: async () => ({ data: table === "management_asset_chunks" ? fixtures.chunks : fixtures.rows, error: null }),
    in: () => query,
    maybeSingle: async () => ({ data: table === "manual_action_point_reports" && fixtures.insertedReport ? fixtures.insertedReport : fixtures.single[table] ?? null, error: null }),
    insert: (value: Record<string, unknown>) => { fixtures.inserted.push(table); if (table === "manual_action_point_reports") fixtures.insertedReport = { id: "report-a", ...value }; return query; },
  };
  return query;
}; return { createSupabaseAdminClient: () => ({ schema: () => ({ from }), from }) }; });
vi.mock("@/lib/integrations/slack", () => ({ getSlackWorkspaceUser: vi.fn(), getSlackBotUserId: vi.fn(), fetchSlackConversation: vi.fn() }));
vi.mock("@/lib/agent/follow-up/manual-follow-up-chat", () => ({ answerManualFollowupQuestion: vi.fn() }));
vi.mock("@/lib/agent/follow-up/manual-follow-up-provider", () => ({ extractManualFollowupReport: vi.fn() }));
vi.mock("@/lib/data/agent-provider-data-source", () => ({ getActiveAgentProvider: vi.fn(), verifyAgentProvider: vi.fn() }));
vi.mock("@/lib/data/admin-company-action-points", () => ({ AdminCompanyActionPointError: class extends Error {} }));
vi.mock("@/lib/data/admin-adherence-data-source", () => ({ routineOrganizationId: vi.fn() }));
import { prepareManualActionPointReply } from "@/lib/data/manual-action-point-followups";
import { getSlackWorkspaceUser } from "@/lib/integrations/slack";
import { extractManualFollowupReport } from "@/lib/agent/follow-up/manual-follow-up-provider";
import { answerManualFollowupQuestion } from "@/lib/agent/follow-up/manual-follow-up-chat";
import { fetchSlackConversation, getSlackBotUserId } from "@/lib/integrations/slack";

const job = { id: "00000000-0000-4000-8000-000000000001", question: { kind: "direct", teamId: "T1", userId: "U1", channel: "D1", ts: "123.456", text: "Eu fiz tudo" } } as SlackDeliveryJob;
const installation = { teamId: "T1", organizationId: "00000000-0000-4000-8000-000000000002", botToken: "ficticio", botUserId: "B1" };

beforeEach(() => { fixtures.rows = []; fixtures.chunks = []; fixtures.single = {}; fixtures.seen = []; fixtures.inserted = []; fixtures.insertedReport = null; vi.clearAllMocks(); });

describe("resposta direta ao teste manual", () => {
  it("aceita o único ciclo recente da mesma pessoa e conversa", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado" }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue(null);
    expect(await prepareManualActionPointReply(job, installation)).toEqual({ text: expect.stringContaining("identidade ativa") });
    expect(fixtures.seen).toEqual(expect.arrayContaining([["organization_id", installation.organizationId], ["slack_team_id", "T1"], ["slack_user_id", "U1"], ["channel_id", "D1"], ["status", "enviado"]]));
    expect(fixtures.seen.some(([field]) => field === "created_at")).toBe(true);
  });

  it("aceita uma declaração genérica de conclusão sem exigir comprovante", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado", title: "Matriz de decisões" }];
    fixtures.single.manual_action_point_followups = { id: "cycle-a", organization_id: installation.organizationId, title: "Matriz de decisões", action: "Revisar decisões" };
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    const replyJob = { ...job, question: { ...job.question, text: "Eu fiz tudo, não tenho nenhum impedimento" } } as SlackDeliveryJob;
    expect(await prepareManualActionPointReply(replyJob, installation)).toEqual({ text: expect.stringContaining("Resumo proposto: Eu fiz tudo, não tenho nenhum impedimento") });
    expect(extractManualFollowupReport).not.toHaveBeenCalled();
    expect(fixtures.insertedReport).toMatchObject({ status: "executado_relato", summary: "Eu fiz tudo, não tenho nenhum impedimento", evidence: null });
  });

  it("pede a thread correta quando há mais de um ciclo aberto", async () => {
    fixtures.rows = [{ id: "cycle-a", status: "enviado" }, { id: "cycle-b", status: "enviado" }];
    expect(await prepareManualActionPointReply(job, installation)).toEqual({ text: expect.stringContaining("mais de um Action Point") });
    expect(getSlackWorkspaceUser).not.toHaveBeenCalled();
  });

  it("deixa uma DM sem ciclo elegível seguir para o assistente", async () => {
    expect(await prepareManualActionPointReply(job, installation)).toBeNull();
  });

  it("registra a dúvida e envia à LLM o Action Point, o ativo publicado e a thread", async () => {
    fixtures.single.manual_action_point_followups = {
      id: "cycle-a", organization_id: installation.organizationId, action_point_id: "point-a",
      asset_version_id: "version-a", message_ts: "100.001", title: "Matriz de direitos de decisão",
      action: "Revisar decisões abertas e encaminhar cada uma ao decisor previsto.",
    };
    fixtures.single.admin_company_action_points = {
      asset_id: "asset-a", asset_version_id: "version-a", action: "Revisar decisões abertas e encaminhar cada uma ao decisor previsto.",
      reason: "Evitar decisões sem responsável e atrasos nas campanhas.",
      continuity: "A matriz define quem decide e mantém o registro para a próxima revisão.",
    };
    fixtures.single.management_assets = { id: "asset-a", title: "Matriz de decisão", status: "publicado", archived_at: null, current_published_version_id: "version-a" };
    fixtures.single.management_asset_versions = { id: "version-a", version_number: "2", review_status: "publicado" };
    fixtures.chunks = [{ heading_path: "Decisões abertas", content: "Registrar decisor e prazo de cada decisão." }];
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    vi.mocked(extractManualFollowupReport).mockResolvedValue({ status: "duvida", summary: "Perguntou o que fazer.", evidence: null });
    vi.mocked(getSlackBotUserId).mockResolvedValue("B1");
    vi.mocked(fetchSlackConversation).mockResolvedValue([{ ts: "100.001", user: "B1", text: "Pergunta sobre o Action Point" }, { ts: "100.002", user: "U1", text: "Não entendi o prazo" }]);
    vi.mocked(answerManualFollowupQuestion).mockResolvedValue("Revise as decisões abertas e registre o decisor e o prazo.\n\nFonte: Action Point; Matriz de decisão, versão 2");
    const question = { ...job, question: { ...job.question, threadTs: "100.001", text: "Quais ações preciso fazer?" } } as SlackDeliveryJob;

    const reply = await prepareManualActionPointReply(question, installation);

    expect(reply?.text).toContain("Revise as decisões abertas");
    expect(reply?.text).not.toContain("confirmar");
    expect(answerManualFollowupQuestion).toHaveBeenCalledWith(expect.objectContaining({
      question: "Quais ações preciso fazer?", reason: "Evitar decisões sem responsável e atrasos nas campanhas.",
      assetVersion: "2", sections: fixtures.chunks,
      history: expect.arrayContaining([{ role: "user", text: "Não entendi o prazo" }]),
    }));
    expect(fixtures.insertedReport).toMatchObject({ status: "duvida", summary: "Perguntou o que fazer." });
    expect(fixtures.seen).toEqual(expect.arrayContaining([["organization_id", installation.organizationId], ["id", "point-a"]]));
  });

  it("não usa um motivo editado com a ação antiga do acompanhamento", async () => {
    fixtures.single.manual_action_point_followups = {
      id: "cycle-a", organization_id: installation.organizationId, action_point_id: "point-a",
      asset_version_id: "version-a", title: "Matriz de direitos de decisão", action: "Revisar decisões abertas.",
    };
    fixtures.single.admin_company_action_points = {
      asset_version_id: "version-a", action: "Aprovar todas as decisões.",
      reason: "Motivo da ação revisada.", continuity: "Papel da ação revisada.",
    };
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    vi.mocked(extractManualFollowupReport).mockResolvedValue({ status: "duvida", summary: "Perguntou o que fazer.", evidence: null });
    const question = { ...job, question: { ...job.question, threadTs: "100.001", text: "O que faço?" } } as SlackDeliveryJob;

    const reply = await prepareManualActionPointReply(question, installation);

    expect(reply?.text).toContain("Revisar decisões abertas.");
    expect(reply?.text).toContain("Peça à operação a versão atual");
    expect(reply?.text).not.toContain("Motivo da ação revisada.");
    expect(fixtures.insertedReport).toMatchObject({ status: "duvida" });
  });
});
