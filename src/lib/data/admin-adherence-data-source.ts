import "server-only";

import { z } from "zod";
import { adherenceScheduleSchema } from "@/lib/contracts/asset-adherence";
import { adminRoutineWriteSchema, type AdminRoutineWorkspace } from "@/lib/contracts/admin-adherence";
import { adminActionPointTemplates } from "@/lib/data/admin-operations-data-source";
import { AssetAdherenceError, transitionAssetAdherenceRoutine } from "@/lib/data/asset-adherence-data-source";
import { getSlackBotTokenForOrganization, getSlackWorkspaceUser, listSlackWorkspaceUsers } from "@/lib/integrations/slack";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

const id = z.uuid();
const date = z.iso.datetime({ offset: true });
const workspaceSchema = z.object({
  companyName: z.string(),
  actions: z.array(z.object({ diagnosticId: id, diagnosticName: z.string(), actionPointId: z.string(), assignment: z.object({ teamId: z.string(), userId: z.string(), name: z.string(), updatedAt: date }).nullable() })),
  questions: z.array(z.object({ id, diagnosticId: id, text: z.string() })),
  assets: z.array(z.object({ id, versionId: id, title: z.string(), version: z.string() })),
  sectors: z.array(z.object({ id, name: z.string() })),
  rules: z.array(z.object({ id, routine_id: id, revision: z.number().int(), diagnostic_id: id, action_point_id: z.string(), title: z.string().nullable(), success_indicator: z.string().nullable(), expectation: z.string(), asset_id: id, asset_version_id: id, question_id: id, sector_id: id, assignee_user_id: z.string(), schedule: adherenceScheduleSchema, created_at: date, change_reason: z.string().nullable(), actorName: z.string() })),
  events: z.array(z.object({ id, routineId: id, action: z.enum(["pausar", "retomar"]), reason: z.string(), recordedAt: date, actorName: z.string(), sequence: z.number().int() })),
});

export function routineOrganizationId(companyId: string) {
  const parsed = id.safeParse(companyId.startsWith("company_") ? companyId.slice(8) : "");
  if (!parsed.success) throw new AssetAdherenceError("Empresa não encontrada.", 404);
  return parsed.data;
}

function check(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === "42501") throw new AssetAdherenceError("Acesso restrito à operação DirectScal.", 403);
  if (error.code === "PT404") throw new AssetAdherenceError("Empresa, ação ou rotina não encontrada.", 404);
  if (["PT409", "23505", "55P03"].includes(error.code ?? "")) throw new AssetAdherenceError("A origem, a atribuição ou o acordo mudou. Seu texto foi preservado. Atualize os dados antes de tentar novamente.", 409);
  if (["PT400", "23503", "23514", "22P02"].includes(error.code ?? "")) throw new AssetAdherenceError("Revise os vínculos, o responsável e os dados da rotina.", 400);
  throw new AssetAdherenceError("Não foi possível concluir a operação da rotina.", 500);
}

export async function getAdminRoutineWorkspace(companyId: string, actorUserId: string): Promise<AdminRoutineWorkspace> {
  const organizationId = routineOrganizationId(companyId);
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("get_admin_adherence_workspace", { p_organization_id: organizationId, p_actor_user_id: id.parse(actorUserId) });
  check(error);
  const raw = workspaceSchema.parse(data);
  const templates = new Map(adminActionPointTemplates.map(template => [template.id, template]));
  const actions = raw.actions.flatMap(action => {
    const template = templates.get(action.actionPointId);
    return template ? [{ ...action, title: template.title, description: template.description, successIndicator: template.successIndicator }] : [];
  });
  return {
    companyId, companyName: raw.companyName, actions, questions: raw.questions, assets: raw.assets, sectors: raw.sectors, events: raw.events,
    rules: raw.rules.map(rule => ({ id: rule.id, routineId: rule.routine_id, revision: rule.revision, diagnosticId: rule.diagnostic_id, actionPointId: rule.action_point_id,
      title: rule.title ?? templates.get(rule.action_point_id)?.title ?? "Rotina", successIndicator: rule.success_indicator ?? templates.get(rule.action_point_id)?.successIndicator ?? "Não definido",
      expectation: rule.expectation, assetId: rule.asset_id, assetVersionId: rule.asset_version_id, questionId: rule.question_id, sectorId: rule.sector_id,
      assigneeUserId: rule.assignee_user_id, schedule: rule.schedule, createdAt: rule.created_at, reason: rule.change_reason, actorName: rule.actorName })),
  };
}

async function installation(organizationId: string) {
  const found = await getSlackBotTokenForOrganization(organizationId);
  if (!found) throw new AssetAdherenceError("Conecte o Slack da empresa antes de escolher responsáveis.", 409);
  return found;
}

export async function getAdminRoutineDirectory(companyId: string, actorUserId: string) {
  await getAdminRoutineWorkspace(companyId, actorUserId);
  try { return await listSlackWorkspaceUsers((await installation(routineOrganizationId(companyId))).botToken); }
  catch (error) { if (error instanceof AssetAdherenceError) throw error; throw new AssetAdherenceError("Não foi possível consultar o diretório do Slack desta empresa.", 502); }
}

async function resolveAssignee(organizationId: string, userId: string) {
  const connected = await installation(organizationId);
  try {
    const user = await getSlackWorkspaceUser(connected.botToken, userId);
    if (!user) throw new AssetAdherenceError("Selecione uma pessoa ativa do workspace conectado.", 400);
    return { teamId: connected.teamId, userId: user.userId, name: user.name, avatarUrl: user.avatarUrl };
  } catch (error) { if (error instanceof AssetAdherenceError) throw error; throw new AssetAdherenceError("Não foi possível revalidar a pessoa no Slack.", 502); }
}

export async function writeAdminRoutine(companyId: string, actorUserId: string, rawInput: unknown) {
  const input = adminRoutineWriteSchema.parse(rawInput);
  const organizationId = routineOrganizationId(companyId);
  if (input.operation === "situacao") {
    const { operation: _operation, ...transition } = input;
    void _operation;
    return transitionAssetAdherenceRoutine(actorUserId, { ...transition, organizationId });
  }
  const workspace = await getAdminRoutineWorkspace(companyId, actorUserId);
  const action = workspace.actions.find(item => item.diagnosticId === input.diagnosticId && item.actionPointId === input.actionPointId);
  if (!action) throw new AssetAdherenceError("Selecione um action point publicado nesta empresa.", 409);
  const assignee = await resolveAssignee(organizationId, input.assigneeUserId);
  const db = createSupabaseAdminClient().schema("app_private");
  if (input.operation === "transferir") {
    const { operation: _operation, id: attemptId, assigneeUserId: _userId, ...values } = input;
    void _operation; void _userId;
    const expectedRules = [...values.expectedRules].sort((a, b) => a.routineId.localeCompare(b.routineId));
    const { data, error } = await db.rpc("transfer_admin_action_routines", { p_organization_id: organizationId, p_actor_user_id: actorUserId, p_id: attemptId, p_input: { ...values, expectedRules, assignee } as Json });
    check(error); return data;
  }
  const { operation: _operation, id: attemptId, routineId, expectedRuleId, expectedAssignmentUpdatedAt, assigneeUserId: _userId, ...values } = input;
  void _operation; void _userId;
  const { data, error } = await db.rpc("save_admin_adherence_routine", { p_organization_id: organizationId, p_actor_user_id: actorUserId, p_id: attemptId, p_routine_id: routineId, p_expected_rule_id: expectedRuleId, p_expected_assignment_at: expectedAssignmentUpdatedAt, p_input: { ...values, assignee } as Json });
  check(error); return { ruleId: data };
}
