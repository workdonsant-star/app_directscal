import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/integrations/slack", () => ({ getSlackBotTokenForOrganization: vi.fn(), getSlackWorkspaceUser: vi.fn(), listSlackWorkspaceUsers: vi.fn() }));
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSlackBotTokenForOrganization, getSlackWorkspaceUser } from "@/lib/integrations/slack";
import { getAdminRoutineWorkspace, writeAdminRoutine } from "@/lib/data/admin-adherence-data-source";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const rpc = vi.fn();
const workspace = { companyName: "Fixture empresa", actions: [{ diagnosticId: id(3), diagnosticName: "Fixture coleta", actionPointId: "action_processos_ritual", assignment: null }], questions: [], assets: [], sectors: [], rules: [], events: [] };
const input = { operation: "salvar", id: id(4), routineId: id(5), expectedRuleId: null, diagnosticId: id(3), actionPointId: "action_processos_ritual", expectedAssignmentUpdatedAt: null,
  title: "Acordo da rotina", assetId: id(6), assetVersionId: id(7), questionId: id(8), sectorId: id(9), assigneeUserId: "U1", schedule: { kind: "periodica", cadence: "semanal", timeZone: "America/Sao_Paulo" }, expectation: "Conferir o período", successIndicator: "Evidência da conferência", reason: "Acordo com a operação" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createSupabaseAdminClient).mockReturnValue({ schema: () => ({ rpc }) } as unknown as ReturnType<typeof createSupabaseAdminClient>);
  vi.mocked(getSlackBotTokenForOrganization).mockResolvedValue({ teamId: "T1", botToken: "token-ficticio" });
  vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "U1", name: "Pessoa do diretório", avatarUrl: null });
});

describe("operação administrativa de rotinas", () => {
  it("valida empresa e ator antes de consultar dados", async () => {
    await expect(getAdminRoutineWorkspace("company_invalid", id(2))).rejects.toMatchObject({ status: 404 });
    expect(rpc).not.toHaveBeenCalled();
    rpc.mockResolvedValue({ data: null, error: { code: "42501" } });
    await expect(writeAdminRoutine(`company_${id(1)}`, id(2), input)).rejects.toMatchObject({ status: 403 });
    expect(getSlackWorkspaceUser).not.toHaveBeenCalled();
  });
  it("não grava nome, foto, workspace ou ator enviados pelo navegador", async () => {
    rpc.mockResolvedValueOnce({ data: workspace, error: null }).mockResolvedValueOnce({ data: id(4), error: null });
    await expect(writeAdminRoutine(`company_${id(1)}`, id(2), { ...input, assigneeName: "Nome forjado" })).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
    const result = await writeAdminRoutine(`company_${id(1)}`, id(2), input);
    expect(result).toEqual({ ruleId: id(4) });
    expect(getSlackWorkspaceUser).toHaveBeenCalledWith("token-ficticio", "U1");
    expect(rpc).toHaveBeenLastCalledWith("save_admin_adherence_routine", expect.objectContaining({ p_actor_user_id: id(2), p_organization_id: id(1), p_expected_rule_id: null, p_input: expect.objectContaining({ assignee: { teamId: "T1", userId: "U1", name: "Pessoa do diretório", avatarUrl: null } }) }));
  });
  it("recusa pessoa desativada antes da escrita e não expõe erro do Slack", async () => {
    rpc.mockResolvedValue({ data: workspace, error: null });
    vi.mocked(getSlackWorkspaceUser).mockResolvedValueOnce(null);
    await expect(writeAdminRoutine(`company_${id(1)}`, id(2), input)).rejects.toMatchObject({ status: 400 });
    expect(rpc).toHaveBeenCalledTimes(1);
    vi.mocked(getSlackWorkspaceUser).mockRejectedValueOnce(new Error("detalhe do token privado"));
    await expect(writeAdminRoutine(`company_${id(1)}`, id(2), input)).rejects.toMatchObject({ status: 502, message: "Não foi possível revalidar a pessoa no Slack." });
    expect(rpc).toHaveBeenCalledTimes(2);
  });
  it("recusa origem retirada da publicação e conflito sem perder o controle de versão", async () => {
    rpc.mockResolvedValueOnce({ data: { ...workspace, actions: [] }, error: null });
    await expect(writeAdminRoutine(`company_${id(1)}`, id(2), input)).rejects.toMatchObject({ status: 409 });
    expect(getSlackWorkspaceUser).not.toHaveBeenCalled();
    rpc.mockResolvedValueOnce({ data: workspace, error: null }).mockResolvedValueOnce({ data: null, error: { code: "PT409", message: "dado interno" } });
    await expect(writeAdminRoutine(`company_${id(1)}`, id(2), input)).rejects.toMatchObject({ status: 409 });
  });
});
