import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/integrations/slack", () => ({ getSlackBotTokenForOrganization: vi.fn(), getSlackWorkspaceUser: vi.fn(), listSlackWorkspaceUsers: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));

import { createSlackSectorLeaderInputSchema } from "@/lib/contracts";
import { createSlackSectorLeader, getSlackLeadershipDirectory, getSlackSectorLeaders } from "@/lib/data/slack-leadership-data-source";
import { getSlackBotTokenForOrganization, getSlackWorkspaceUser, listSlackWorkspaceUsers } from "@/lib/integrations/slack";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const rpc = vi.fn();
const tables = vi.fn();
const filters = vi.fn();
const input = { name: "Operações", slackUserId: "U123" };
const user = { userId: "U123", name: "Ana", avatarUrl: "https://example.com/photo.png", position: "Diretora" };
let teamId = "T123";

beforeEach(() => {
  vi.clearAllMocks();
  teamId = "T123";
  vi.mocked(getSlackBotTokenForOrganization).mockResolvedValue({ teamId, botToken: "test-token" });
  vi.mocked(getSlackWorkspaceUser).mockResolvedValue(user);
  vi.mocked(listSlackWorkspaceUsers).mockResolvedValue([user]);
  rpc.mockResolvedValue({ data: { sectorId: "sector-1" }, error: null });
  vi.mocked(createSupabaseAdminClient).mockImplementation(() => {
    const client = {
      schema: () => client,
      rpc,
      from: (table: string) => {
        tables(table);
        const rows = table === "organization_sector_slack_leaders" ? [{ id: "reference-1", organization_id: "org-1", sector_id: "sector-1", slack_team_id: teamId, slack_user_id: "U123", position_override: null }] : [{ id: "sector-1", name: "Operações", active: true, created_at: "2026-10-12T12:00:00Z" }];
        const query = {
          select: () => query,
          eq: (key: string, value: string) => { filters(table, key, value); return query; },
          in: () => query,
          then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: rows, error: null })),
        };
        return query;
      },
    };
    return client as unknown as ReturnType<typeof createSupabaseAdminClient>;
  });
});

describe("vínculo de liderança pelo Slack", () => {
  it("exige somente setor e seleção da pessoa; cargo é opcional", () => {
    expect(createSlackSectorLeaderInputSchema.parse({ ...input, name: " Operações " })).toEqual(input);
    expect(createSlackSectorLeaderInputSchema.safeParse({ ...input, position: "" }).success).toBe(true);
    expect(createSlackSectorLeaderInputSchema.safeParse({ ...input, name: "" }).success).toBe(false);
    expect(createSlackSectorLeaderInputSchema.safeParse({ ...input, organizationId: "other" }).success).toBe(false);
    expect(createSlackSectorLeaderInputSchema.safeParse({ ...input, accessLevel: "owner" }).success).toBe(false);
  });
  it("consulta o diretório ao vivo, incluindo convidados ativos", async () => {
    expect(await getSlackLeadershipDirectory("org-1")).toEqual([user]);
    expect(getSlackBotTokenForOrganization).toHaveBeenCalledWith("org-1");
    expect(listSlackWorkspaceUsers).toHaveBeenCalledWith("test-token", true);
    expect(rpc).not.toHaveBeenCalled();
    expect(tables).not.toHaveBeenCalled();
  });
  it("revalida a pessoa no Slack da empresa e grava só a referência", async () => {
    await createSlackSectorLeader({ organizationId: "org-1", createdBy: "owner-1", input });
    expect(getSlackWorkspaceUser).toHaveBeenCalledWith("test-token", "U123", true);
    expect(rpc).toHaveBeenCalledWith("create_slack_sector_leader", {
      p_organization_id: "org-1", p_created_by: "owner-1", p_sector_name: "Operações",
      p_slack_team_id: "T123", p_slack_user_id: "U123", p_position_override: null,
    });
    expect(tables).not.toHaveBeenCalled();
  });
  it("salva só o cargo ajustado e permite limpar um cargo opcional", async () => {
    for (const position of ["Líder", ""]) {
      await createSlackSectorLeader({ organizationId: "org-1", createdBy: "owner-1", input: { ...input, position } });
      expect(rpc).toHaveBeenLastCalledWith("create_slack_sector_leader", expect.objectContaining({ p_position_override: position }));
    }
  });
  it("não copia o cargo original quando não houve ajuste", async () => {
    await createSlackSectorLeader({ organizationId: "org-1", createdBy: "owner-1", input: { ...input, position: "Diretora" } });
    expect(rpc).toHaveBeenCalledWith("create_slack_sector_leader", expect.objectContaining({ p_position_override: null }));
  });
  it("recusa pessoa removida e não grava", async () => {
    vi.mocked(getSlackWorkspaceUser).mockResolvedValue(null);
    await expect(createSlackSectorLeader({ organizationId: "org-1", createdBy: "owner-1", input })).rejects.toThrow("pessoa ativa");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("recusa Slack desconectado e não consulta diretórios de outra empresa", async () => {
    vi.mocked(getSlackBotTokenForOrganization).mockResolvedValue(null);
    await expect(createSlackSectorLeader({ organizationId: "org-1", createdBy: "owner-1", input })).rejects.toThrow("Conecte o Slack");
    expect(getSlackWorkspaceUser).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("não expõe detalhes do banco", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "XX000", message: "private database data" } });
    await expect(createSlackSectorLeader({ organizationId: "org-1", createdBy: "owner-1", input })).rejects.toThrow("Não foi possível salvar");
  });
  it("hidrata nome, foto e cargo atuais sem gravar pessoas", async () => {
    const sectors = await getSlackSectorLeaders("org-1");
    expect(sectors[0]).toMatchObject({ inviteStatus: "ativo", leader: { name: "Ana", position: "Diretora", email: "", slackUserId: "U123" } });
    expect(filters).toHaveBeenCalledWith("organization_sector_slack_leaders", "organization_id", "org-1");
    expect(rpc).not.toHaveBeenCalled();
    expect(tables).not.toHaveBeenCalledWith("organization_people");
  });
  it("troca de workspace invalida a referência antiga mesmo com userId igual", async () => {
    vi.mocked(getSlackBotTokenForOrganization).mockResolvedValue({ teamId: "T999", botToken: "other-token" });
    const sectors = await getSlackSectorLeaders("org-1");
    expect(sectors[0]).toMatchObject({ inviteStatus: "inativo", leader: { name: "Pessoa indisponível no Slack", avatarUrl: null } });
  });
});
