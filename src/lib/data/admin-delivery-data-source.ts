import "server-only";

import {
  adminDeliveryMutationSchema,
  adminDeliveryPublicationSchema,
  type AdminDeliveryMutation,
  type AdminDeliveryPublication,
} from "@/lib/contracts/admin-operations";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type AdminDeliveryRow = Database["public"]["Tables"]["admin_deliveries"]["Row"];

const adminDeliveryColumns =
  "diagnostic_id,organization_id,specialist_id,status,report_content,dimension_readings,selected_action_point_ids,published_at,updated_at";

function mapAdminDeliveryRow(row: AdminDeliveryRow): AdminDeliveryPublication {
  return adminDeliveryPublicationSchema.parse({
    diagnosticId: row.diagnostic_id,
    organizationId: row.organization_id,
    specialistId: row.specialist_id,
    status: row.status,
    report: row.report_content,
    dimensionReadings: row.dimension_readings,
    selectedActionPointIds: row.selected_action_point_ids,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  });
}

export async function getAdminDeliveryPublications(
  diagnosticIds: string[],
): Promise<AdminDeliveryPublication[]> {
  if (diagnosticIds.length === 0) return [];

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_deliveries")
    .select(adminDeliveryColumns)
    .in("diagnostic_id", diagnosticIds)
    .returns<AdminDeliveryRow[]>();

  if (error) throw error;
  return data.map(mapAdminDeliveryRow);
}

export async function getAdminDeliveryPublication(
  diagnosticId: string,
): Promise<AdminDeliveryPublication | null> {
  const publications = await getAdminDeliveryPublications([diagnosticId]);
  return publications[0] ?? null;
}

export async function getPublishedDiagnosticIds(
  diagnosticIds: string[],
): Promise<Set<string>> {
  const publications = await getAdminDeliveryPublications(diagnosticIds);
  return new Set(
    publications
      .filter((publication) => publication.status === "publicada")
      .map((publication) => publication.diagnosticId),
  );
}

/** Somente o workspace administrativo lê a revisão não publicada. */
export async function getAdminDeliveryDraft(diagnosticId: string): Promise<AdminDeliveryPublication | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.schema("app_private").rpc("get_admin_delivery_draft", {
    p_diagnostic_id: diagnosticId,
  });
  if (error) throw error;
  return data ? adminDeliveryPublicationSchema.parse(data) : getAdminDeliveryPublication(diagnosticId);
}

export async function saveAdminDeliveryPublication({
  actorUserId, diagnosticId, input: rawInput,
}: {
  actorUserId: string;
  diagnosticId: string;
  input: AdminDeliveryMutation;
}): Promise<AdminDeliveryPublication> {
  const input = adminDeliveryMutationSchema.parse(rawInput);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.schema("app_private").rpc("save_admin_delivery_revision", {
    p_diagnostic_id: diagnosticId,
    p_actor_user_id: actorUserId,
    p_input: input,
  });
  if (error) throw new Error("Não foi possível salvar a revisão da entrega.");
  return adminDeliveryPublicationSchema.parse(data);
}
