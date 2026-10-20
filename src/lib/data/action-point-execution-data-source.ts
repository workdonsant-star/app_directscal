import "server-only";

import {
  actionPointAssignmentSchema,
  actionPointEventSchema,
  type ActionPointAssignment,
  type ActionPointEvent,
} from "@/lib/contracts";
import type { ActionPointUpdatePlan } from "@/lib/data/action-point-execution";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type AssignmentRow =
  Database["public"]["Tables"]["action_point_assignments"]["Row"];
type EventRow = Database["public"]["Tables"]["action_point_events"]["Row"];

const assignmentColumns =
  "diagnostic_id,action_point_id,organization_id,assignee_team_id,assignee_slack_user_id,assignee_name,assignee_avatar_url,stage,starts_on,due_on,cadence,progress,created_at,updated_at";
const eventColumns =
  "id,diagnostic_id,action_point_id,organization_id,kind,author_name,body,detail,created_at";

function mapAssignment(row: AssignmentRow): ActionPointAssignment {
  return actionPointAssignmentSchema.parse({
    diagnosticId: row.diagnostic_id,
    actionPointId: row.action_point_id,
    assignee: {
      teamId: row.assignee_team_id,
      userId: row.assignee_slack_user_id,
      name: row.assignee_name,
      avatarUrl: row.assignee_avatar_url,
    },
    stage: row.stage,
    startsOn: row.starts_on,
    dueOn: row.due_on,
    cadence: row.cadence,
    progress: row.progress,
    updatedAt: row.updated_at,
  });
}

function mapEvent(row: EventRow): ActionPointEvent {
  return actionPointEventSchema.parse({
    id: row.id,
    actionPointId: row.action_point_id,
    kind: row.kind,
    authorName: row.author_name,
    body: row.body,
    detail: row.detail,
    createdAt: row.created_at,
  });
}

// Sempre filtrado pela empresa, mesmo com service role.
export async function getActionPointExecution({
  diagnosticId,
  organizationId,
}: {
  diagnosticId: string;
  organizationId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const [assignments, events] = await Promise.all([
    supabase
      .from("action_point_assignments")
      .select(assignmentColumns)
      .eq("diagnostic_id", diagnosticId)
      .eq("organization_id", organizationId)
      .returns<AssignmentRow[]>(),
    supabase
      .from("action_point_events")
      .select(eventColumns)
      .eq("diagnostic_id", diagnosticId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(500)
      .returns<EventRow[]>(),
  ]);

  if (assignments.error) throw assignments.error;
  if (events.error) throw events.error;

  return {
    assignments: assignments.data.map(mapAssignment),
    events: events.data.map(mapEvent),
  };
}

export async function saveActionPointUpdate({
  diagnosticId, organizationId, actionPointId, actorUserId, authorName, expectedUpdatedAt, plan,
}: {
  diagnosticId: string;
  organizationId: string;
  actionPointId: string;
  actorUserId: string;
  authorName: string;
  expectedUpdatedAt: string | null;
  plan: Extract<ActionPointUpdatePlan, { ok: true }>;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.schema("app_private").rpc("save_action_point_update", {
    p_diagnostic_id: diagnosticId,
    p_organization_id: organizationId,
    p_action_point_id: actionPointId,
    p_actor_user_id: actorUserId,
    p_author_name: authorName,
    p_expected_updated_at: expectedUpdatedAt,
    p_plan: plan,
  });
  if (error) throw error;
}
