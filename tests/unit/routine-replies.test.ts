import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: () => ({ schema: () => ({ rpc }) }) }));
vi.mock("@/lib/integrations/slack", () => ({ getSlackWorkspaceUser: vi.fn() }));
import { getSlackWorkspaceUser } from "@/lib/integrations/slack";
import { prepareRoutineReply } from "@/lib/integrations/routine-replies";
import { getRoutineReplyInteraction } from "@/lib/integrations/routine-reply-interaction";
import type { SlackDeliveryJob } from "@/lib/contracts/slack-delivery";
const id = "00000000-0000-4000-8000-000000000001";
const context = { cycleId: id, ruleId: id, title: "Revisão semanal", assetTitle: "SOP publicado", assetVersion: "1", opensAt: "2026-10-19T12:00:00Z", dueAt: "2026-10-23T20:00:00Z" };
const job: SlackDeliveryJob = { id, event_id: "fixture", organization_id: id, team_id: "T1", lease_id: id, attempts: 1, reply: null,
  question: { kind: "direct", teamId: "T1", userId: "U1", channel: "D1", ts: "100.1", text: "Fiz a revisão https://example.invalid/ata" } };
const installation = { teamId: "T1", organizationId: id, botToken: "fixture", botUserId: "B1" };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fixture", avatarUrl: null }); });
describe("relato de rotina antes do agente de consulta", () => {
  it("consulta não lê contexto privado nem altera estado", async () => {
    expect(await prepareRoutineReply({ ...job, question: { ...job.question, kind: "direct", text: "Como faço a revisão?" } }, installation)).toBeNull();
    expect(rpc).not.toHaveBeenCalled(); expect(getSlackWorkspaceUser).not.toHaveBeenCalled();
  });
  it("pede esclarecimento sem escrever diante de ambiguidade ou pessoa inativa", async () => {
    expect((await prepareRoutineReply({ ...job, question: { ...job.question, kind: "direct", text: "Sim" } }, installation))?.text).toContain("isolado");
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue(null);
    expect((await prepareRoutineReply(job, installation))?.text).toContain("Nenhuma alteração");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("mais de um ciclo nunca escolhe automaticamente o mais recente", async () => {
    rpc.mockResolvedValue({ data: [context, context], error: null });
    expect((await prepareRoutineReply(job, installation))?.text).toContain("mais de um ciclo");
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it("prepara proposta com pessoa do diretório e botões vinculados; não confirma", async () => {
    const operation = { kind: "execucao", performed: true, evidence: ["https://example.invalid/ata"], description: job.question.kind === "direct" ? job.question.text : "" };
    rpc.mockResolvedValueOnce({ data: [context], error: null }).mockResolvedValueOnce({ data: { id, status: "pendente", expiresAt: "2026-10-20T20:00:00Z", operation, context }, error: null });
    const reply = await prepareRoutineReply(job, installation);
    expect(reply?.text).toContain("https://example.invalid/ata");
    expect(JSON.stringify(reply?.blocks)).toContain("routine_reply_confirm");
    expect(rpc).toHaveBeenLastCalledWith("propose_routine_reply", expect.objectContaining({ p_actor_name: "Pessoa fixture", p_cycle_id: id }));
    expect(rpc.mock.calls.some(call => call[0] === "resolve_routine_reply")).toBe(false);
  });
  it("confirma somente pelo job/lease e mantém erro privado fora da resposta", async () => {
    const decision = { ...job, question: { ...job.question, kind: "direct" as const, text: `confirmar ${id}` } };
    rpc.mockResolvedValueOnce({ data: { status: "confirmada" }, error: null });
    expect((await prepareRoutineReply(decision, installation))?.text).toContain("Registro confirmado");
    expect(rpc).toHaveBeenCalledWith("resolve_routine_reply", { p_job_id: id, p_lease_id: id, p_proposal_id: id, p_confirm: true });
    rpc.mockResolvedValueOnce({ data: null, error: { message: "segredo do banco" } });
    await expect(prepareRoutineReply(decision, installation)).rejects.toThrow("Não foi possível confirmar");
  });
  it("botões produzem ingresso idempotente em DM sem confiar em nome ou empresa enviados", () => {
    const payload = { type: "block_actions", team: { id: "T1" }, user: { id: "U1", name: "Nome forjado" }, channel: { id: "D1" }, organizationId: "forjada", actions: [{ action_id: "routine_reply_confirm", action_ts: "100.2", value: id }] };
    const result = getRoutineReplyInteraction(payload);
    expect(result).toEqual(getRoutineReplyInteraction(payload));
    expect(result?.question.text).toBe(`confirmar ${id}`);
    expect(JSON.stringify(result)).not.toContain("forjad");
    expect(getRoutineReplyInteraction({ ...payload, channel: { id: "C1" } })).toBeNull();
    expect(getRoutineReplyInteraction({ ...payload, actions: [{ ...payload.actions[0], value: "outro" }] })).toBeNull();
  });
});
