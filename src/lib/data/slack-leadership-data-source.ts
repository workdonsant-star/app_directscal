import "server-only";

import type { CreateSlackSectorLeaderInput, OrganizationSector } from "@/lib/contracts";
import {
  getSlackBotTokenForOrganization,
  getSlackWorkspaceUser,
  listSlackWorkspaceUsers,
} from "@/lib/integrations/slack";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function getSlackLeadershipDirectory(organizationId: string) {
  const installation = await getSlackBotTokenForOrganization(organizationId);
  if (!installation) throw new Error("Conecte o Slack da empresa para selecionar lideranças.");
  return listSlackWorkspaceUsers(installation.botToken, true);
}

export async function createSlackSectorLeader({
  organizationId,
  createdBy,
  input,
}: {
  organizationId: string;
  createdBy: string;
  input: CreateSlackSectorLeaderInput;
}) {
  const installation = await getSlackBotTokenForOrganization(organizationId);
  if (!installation) throw new Error("Conecte o Slack da empresa para selecionar lideranças.");
  const user = await getSlackWorkspaceUser(installation.botToken, input.slackUserId, true);
  if (!user || user.userId !== input.slackUserId) {
    throw new Error("Selecione uma pessoa ativa no Slack da empresa.");
  }

  // Só gravamos uma alteração de cargo; o cargo original continua vindo do Slack.
  const positionOverride = input.position !== undefined && input.position !== (user.position ?? "")
    ? input.position : null;
  const { data, error } = await createSupabaseAdminClient().schema("app_private")
    .rpc("create_slack_sector_leader", {
      p_organization_id: organizationId,
      p_created_by: createdBy,
      p_sector_name: input.name,
      p_slack_team_id: installation.teamId,
      p_slack_user_id: user.userId,
      p_position_override: positionOverride,
    });
  if (error) {
    if (error.code === "23505") throw new Error("Já existe um setor com esse nome.");
    throw new Error("Não foi possível salvar o setor e a liderança. Tente novamente.");
  }
  return data;
}

export async function getSlackSectorLeaders(organizationId: string): Promise<OrganizationSector[]> {
  const supabase = createSupabaseAdminClient();
  const { data: references, error } = await supabase.schema("app_private")
    .from("organization_sector_slack_leaders").select("*").eq("organization_id", organizationId);
  if (error) throw new Error("Não foi possível consultar as lideranças do Slack.");
  if (!references?.length) return [];

  const [installation, sectors] = await Promise.all([
    getSlackBotTokenForOrganization(organizationId),
    supabase.from("organization_sectors").select("id,name,active,created_at")
      .eq("organization_id", organizationId).in("id", references.map((reference) => reference.sector_id)),
  ]);
  if (sectors.error) throw new Error("Não foi possível consultar os setores.");
  // Uma leitura paginada por request, sem cache persistente e sem copiar o diretório.
  const users = installation ? await listSlackWorkspaceUsers(installation.botToken, true) : [];
  const usersById = new Map(users.map((user) => [user.userId, user]));
  return references.flatMap((reference) => {
    const sector = sectors.data.find((item) => item.id === reference.sector_id);
    if (!sector) return [];
    const user = reference.slack_team_id === installation?.teamId ? usersById.get(reference.slack_user_id) : null;
    return [{
      id: sector.id, name: sector.name, active: sector.active, createdAt: sector.created_at,
      inviteStatus: user && sector.active ? "ativo" : "inativo", lastInviteSentAt: null,
      leader: {
        id: reference.id, slackUserId: reference.slack_user_id, slackTeamId: reference.slack_team_id,
        name: user?.name ?? "Pessoa indisponível no Slack", avatarUrl: user?.avatarUrl ?? null,
        email: "", position: reference.position_override ?? user?.position ?? "", accessLevel: "admin",
      },
    } satisfies OrganizationSector];
  });
}
