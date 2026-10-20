import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/integrations/slack-delivery-store", () => ({ claimSlackDelivery: vi.fn(), transitionSlackDelivery: vi.fn() }));
vi.mock("@/lib/integrations/routine-contacts", () => ({ deferRoutineContact: vi.fn(), getRoutineContactDisposition: vi.fn(), prepareRoutineContact: vi.fn() }));
vi.mock("@/lib/integrations/routine-replies", () => ({ prepareRoutineReply: vi.fn() }));
vi.mock("@/lib/data/slack-identity-data-source", () => ({ completeSlackIdentity: vi.fn() }));
vi.mock("@/lib/integrations/slack-question-service", () => ({ prepareSlackQuestion: vi.fn() }));
vi.mock("@/lib/integrations/slack", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/integrations/slack")>(), getSlackInstallation: vi.fn(), getSlackWorkspaceUser: vi.fn(), postSlackMessage: vi.fn() }));
import { claimSlackDelivery, transitionSlackDelivery } from "@/lib/integrations/slack-delivery-store";
import { prepareSlackQuestion } from "@/lib/integrations/slack-question-service";
import { completeSlackIdentity } from "@/lib/data/slack-identity-data-source";
import { getSlackInstallation, getSlackWorkspaceUser, postSlackMessage, SlackDeliveryError } from "@/lib/integrations/slack";
import { deferRoutineContact, getRoutineContactDisposition, prepareRoutineContact } from "@/lib/integrations/routine-contacts";
import { processSlackDelivery } from "@/lib/integrations/slack-delivery";
import { prepareRoutineReply } from "@/lib/integrations/routine-replies";

const job = { id: "job", event_id: "evento", organization_id: "org", team_id: "T1", lease_id: "lease", attempts: 1, reply: null, question: { kind: "direct" as const, teamId: "T1", userId: "U1", channel: "D1", ts: "123.456", text: "Qual é a prática?" } };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(claimSlackDelivery).mockResolvedValue(job);
  vi.mocked(transitionSlackDelivery).mockResolvedValue(undefined);
  vi.mocked(getSlackInstallation).mockResolvedValue({ teamId: "T1", organizationId: "org", botToken: "ficticio", botUserId: "B1" });
  vi.mocked(prepareSlackQuestion).mockResolvedValue({ text: "Resposta com fonte" });
  vi.mocked(postSlackMessage).mockResolvedValue({ channel: "D1", ts: "234.567" });
  vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fixture", avatarUrl: null });
  vi.mocked(getRoutineContactDisposition).mockResolvedValue({ disposition: "enviar", title: "Rotina", expectation: "Conferir", successIndicator: "Registro", assetTitle: "Ativo", assetVersion: "1", opensAt: "2026-10-20T12:00:00Z", dueAt: "2026-10-20T20:00:00Z", cycleId: "00000000-0000-4000-8000-000000000001" });
  vi.mocked(prepareRoutineContact).mockResolvedValue({ text: "Pergunta da rotina", channel: "D1" });
  vi.mocked(prepareRoutineReply).mockResolvedValue(null);
});
describe("entrega durável Slack", () => {
  it("não processa evento sem posse do lease", async () => {
    vi.mocked(claimSlackDelivery).mockResolvedValue(null);
    expect(await processSlackDelivery("job")).toBe(false);
    expect(postSlackMessage).not.toHaveBeenCalled();
  });
  it("persiste a resposta e intenção antes de enviar; guarda confirmação depois", async () => {
    await processSlackDelivery("job");
    expect(vi.mocked(transitionSlackDelivery).mock.calls.map(c => c[2])).toEqual(["preparar", "enviar", "concluir"]);
    expect(vi.mocked(transitionSlackDelivery).mock.invocationCallOrder[1]).toBeLessThan(vi.mocked(postSlackMessage).mock.invocationCallOrder[0]);
    expect(postSlackMessage).toHaveBeenCalledWith("ficticio", expect.objectContaining({ clientMsgId: "job", channel: "D1" }));
    expect(transitionSlackDelivery).toHaveBeenLastCalledWith("job", "lease", "concluir", { ts: "234.567" });
  });
  it("não envia se a resposta ou intenção não persistiram", async () => {
    vi.mocked(transitionSlackDelivery).mockRejectedValueOnce(new Error("banco indisponível"));
    await expect(processSlackDelivery()).rejects.toThrow();
    expect(postSlackMessage).not.toHaveBeenCalled();
  });
  it("reutiliza resposta preparada na recuperação", async () => {
    vi.mocked(claimSlackDelivery).mockResolvedValue({ ...job, reply: { text: "Já aprovada" } });
    await processSlackDelivery();
    expect(prepareSlackQuestion).not.toHaveBeenCalled();
    expect(postSlackMessage).toHaveBeenCalledWith("ficticio", expect.objectContaining({ text: "Já aprovada" }));
  });
  it("recupera falha de geração anterior ao envio", async () => {
    vi.mocked(prepareSlackQuestion).mockRejectedValue(new Error("falha com detalhe privado"));
    await processSlackDelivery();
    expect(transitionSlackDelivery).toHaveBeenLastCalledWith("job", "lease", "falhar", { code: "provedor_indisponivel", retryable: true });
    expect(postSlackMessage).not.toHaveBeenCalled();
  });
  it("não manda mensagem na instalação revogada ou empresa divergente", async () => {
    vi.mocked(getSlackInstallation).mockResolvedValueOnce(null).mockResolvedValueOnce({ teamId: "T1", organizationId: "outra", botToken: "ficticio", botUserId: "B1" });
    await processSlackDelivery(); await processSlackDelivery();
    expect(prepareSlackQuestion).not.toHaveBeenCalled();
    expect(postSlackMessage).not.toHaveBeenCalled();
    expect(transitionSlackDelivery).toHaveBeenLastCalledWith("job", "lease", "falhar", { code: "instalacao_indisponivel", retryable: false });
  });
  it("respeita Retry-After e conserva a resposta sem gerar novamente", async () => {
    vi.mocked(postSlackMessage).mockRejectedValue(new SlackDeliveryError("rate_limited", true, false, 120));
    await processSlackDelivery();
    expect(transitionSlackDelivery).toHaveBeenLastCalledWith("job", "lease", "falhar", { code: "rate_limited", retryable: true, retryAfter: 120 });
  });
  it("tempo esgotado ou confirmação inesperada exige revisão, sem retry cego", async () => {
    vi.mocked(postSlackMessage).mockRejectedValueOnce(new Error("timeout"));
    await processSlackDelivery();
    expect(transitionSlackDelivery).toHaveBeenLastCalledWith("job", "lease", "incerto", expect.objectContaining({ retryable: false }));
    vi.mocked(postSlackMessage).mockResolvedValueOnce({ channel: "outro", ts: "234.567" });
    await processSlackDelivery();
    expect(transitionSlackDelivery).toHaveBeenLastCalledWith("job", "lease", "incerto", expect.objectContaining({ code: "envio_sem_confirmacao" }));
  });
  it("se a confirmação no banco falha, não transforma envio em falha reenviável", async () => {
    vi.mocked(transitionSlackDelivery).mockImplementation(async (_id, _lease, operation) => { if (operation === "concluir") throw new Error("sem banco"); });
    await expect(processSlackDelivery()).rejects.toThrow("sem banco");
    expect(postSlackMessage).toHaveBeenCalledTimes(1);
    expect(transitionSlackDelivery).toHaveBeenLastCalledWith("job", "lease", "concluir", { ts: "234.567" });
  });
  it("confirma código privado sem enviar o segredo ao agente de consulta", async () => {
    vi.mocked(claimSlackDelivery).mockResolvedValue({ ...job, question: { ...job.question, text: "vincular dsc_" + "a".repeat(43) } });
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null });
    vi.mocked(completeSlackIdentity).mockResolvedValue(true);
    await processSlackDelivery();
    expect(completeSlackIdentity).toHaveBeenCalledWith("job", "lease");
    expect(prepareSlackQuestion).not.toHaveBeenCalled();
    expect(postSlackMessage).toHaveBeenCalledWith("ficticio", expect.objectContaining({ text: expect.stringContaining("foi confirmada") }));
  });

  it("respeita adiamento de janela sem consumir geração/envio", async () => {
    vi.mocked(claimSlackDelivery).mockResolvedValue({ ...job, question: { kind: "rotina", teamId: "T1", userId: "U1", channel: "pendente", ts: "0.0", cycleId: "00000000-0000-4000-8000-000000000001" } });
    vi.mocked(getRoutineContactDisposition).mockResolvedValue({ disposition: "adiar", availableAt: "2026-10-21T12:00:00Z" });
    await processSlackDelivery();
    expect(deferRoutineContact).toHaveBeenCalledWith(expect.objectContaining({ id: "job" }), "2026-10-21T12:00:00Z");
    expect(prepareRoutineContact).not.toHaveBeenCalled(); expect(postSlackMessage).not.toHaveBeenCalled();
  });
  it("confirmação de execução não passa pelo modelo de consulta", async () => {
    vi.mocked(prepareRoutineReply).mockResolvedValue({ text: "Confirme o registro da rotina" });
    await processSlackDelivery();
    expect(prepareSlackQuestion).not.toHaveBeenCalled();
    expect(postSlackMessage).toHaveBeenCalledWith("ficticio", expect.objectContaining({ text: "Confirme o registro da rotina" }));
  });
  it("envia contato de rotina somente em DM após revalidar regra e pessoa", async () => {
    vi.mocked(claimSlackDelivery).mockResolvedValue({ ...job, question: { kind: "rotina", teamId: "T1", userId: "U1", channel: "pendente", ts: "0.0", cycleId: "00000000-0000-4000-8000-000000000001" } });
    await processSlackDelivery();
    expect(getRoutineContactDisposition).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: "job" }), true);
    expect(prepareSlackQuestion).not.toHaveBeenCalled();
    expect(postSlackMessage).toHaveBeenCalledWith("ficticio", expect.objectContaining({ channel: "D1", text: "Pergunta da rotina" }));
  });
  it("pausa, troca de público ou cota entre preparo e envio impedem contato", async () => {
    vi.mocked(claimSlackDelivery).mockResolvedValue({ ...job, question: { kind: "rotina", teamId: "T1", userId: "U1", channel: "pendente", ts: "0.0", cycleId: "00000000-0000-4000-8000-000000000001" } });
    const allowed = await getRoutineContactDisposition(job); vi.mocked(getRoutineContactDisposition).mockClear();
    vi.mocked(getRoutineContactDisposition).mockResolvedValueOnce(allowed).mockResolvedValueOnce({ disposition: "cancelar" });
    await processSlackDelivery();
    expect(transitionSlackDelivery).toHaveBeenLastCalledWith("job", "lease", "ignorar", undefined);
    expect(postSlackMessage).not.toHaveBeenCalled();
  });
  it("revalida pessoa também ao recuperar uma resposta já preparada", async () => {
    vi.mocked(claimSlackDelivery).mockResolvedValue({ ...job, reply: { text: "Pergunta pronta", channel: "D1" }, question: { kind: "rotina", teamId: "T1", userId: "U1", channel: "pendente", ts: "0.0", cycleId: "00000000-0000-4000-8000-000000000001" } });
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue(null);
    await processSlackDelivery();
    expect(postSlackMessage).not.toHaveBeenCalled();
    expect(transitionSlackDelivery).toHaveBeenLastCalledWith("job", "lease", "ignorar", undefined);
  });

});
