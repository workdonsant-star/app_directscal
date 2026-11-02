import type { AdminRoutineWorkspace, RoutineAction, RoutineRevision } from "@/lib/contracts/admin-adherence";

export type AdminActionPointRow = RoutineAction & { routines: { rule: RoutineRevision; assetTitle: string | null }[] };
export type AdminActionPointGroup = { key: string; name: string; actions: AdminActionPointRow[] };

export function groupAdminActionPoints(workspace: AdminRoutineWorkspace): AdminActionPointGroup[] {
  const rules = new Map<string, RoutineRevision>();
  for (const rule of workspace.rules) {
    const key = rule.routineId;
    if (!rules.has(key) || rules.get(key)!.revision < rule.revision) rules.set(key, rule);
  }
  const assets = new Map(workspace.assets.map(asset => [asset.id, asset.title]));
  const groups = new Map<string, AdminActionPointGroup>();
  for (const action of workspace.actions) {
    const key = action.assignment ? `${action.assignment.teamId}:${action.assignment.userId}` : "sem-responsavel";
    const group = groups.get(key) ?? { key, name: action.assignment?.name ?? "Sem responsável", actions: [] };
    const routines = [...rules.values()].filter(rule => rule.diagnosticId === action.diagnosticId && rule.actionPointId === action.actionPointId).sort((a, b) => a.routineId.localeCompare(b.routineId)).map(rule => ({ rule, assetTitle: assets.get(rule.assetId) ?? null }));
    group.actions.push({ ...action, routines });
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => a.key === "sem-responsavel" ? 1 : b.key === "sem-responsavel" ? -1 : a.name.localeCompare(b.name, "pt-BR"));
}
