import "server-only";

import {
  adminDeliveryMutationSchema,
  adminDeliveryPublicationSchema,
  adminDeliveryReportDraftSchema,
  type AdminDeliveryMutation,
  type AdminDeliveryPublication,
} from "@/lib/contracts/admin-operations";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";

type AdminDeliveryRow = Database["public"]["Tables"]["admin_deliveries"]["Row"];

const adminDeliveryColumns =
  "diagnostic_id,organization_id,specialist_id,status,report_content,dimension_readings,selected_action_point_ids,published_at,updated_at";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function asJson(value: Record<string, string>): Json {
  return value;
}

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

function hasCompleteReport(input: AdminDeliveryMutation) {
  return Object.values(input.report).every((value) => value.trim().length >= 20);
}

export async function saveAdminDeliveryPublication({
  actorUserId,
  diagnosticId,
  input: rawInput,
}: {
  actorUserId: string;
  diagnosticId: string;
  input: AdminDeliveryMutation;
}): Promise<AdminDeliveryPublication> {
  const input = adminDeliveryMutationSchema.parse(rawInput);
  const supabase = createSupabaseAdminClient();
  const { data: diagnostic, error: diagnosticError } = await supabase
    .from("diagnostics")
    .select("id,organization_id,status")
    .eq("id", diagnosticId)
    .maybeSingle();

  if (diagnosticError) throw diagnosticError;
  if (!diagnostic || diagnostic.status !== "encerrado") {
    throw new Error("A entrega precisa pertencer a um diagnóstico encerrado.");
  }

  const report = adminDeliveryReportDraftSchema.parse(input.report);
  const readyToPublish =
    input.specialistId !== null &&
    input.selectedActionPointIds.length > 0 &&
    hasCompleteReport(input);

  if (input.intent === "publish" && !readyToPublish) {
    throw new Error(
      "Atribua um especialista, complete o relatório e selecione action points antes de publicar.",
    );
  }

  const existing = await getAdminDeliveryPublication(diagnosticId);
  const remainsPublished = existing?.status === "publicada";
  const status =
    input.intent === "publish" || remainsPublished
      ? "publicada"
      : input.specialistId === null
        ? "sem_especialista"
        : readyToPublish
          ? "pronta_para_publicar"
          : "em_analise";
  const publishedAt =
    status === "publicada"
      ? existing?.publishedAt ?? new Date().toISOString()
      : null;

  const { data, error } = await supabase
    .from("admin_deliveries")
    .upsert(
      {
        diagnostic_id: diagnostic.id,
        organization_id: diagnostic.organization_id,
        specialist_id: input.specialistId,
        status,
        report_content: asJson(report),
        dimension_readings: asJson(input.dimensionReadings),
        selected_action_point_ids: [...new Set(input.selectedActionPointIds)],
        published_at: publishedAt,
        published_by_user_id:
          status === "publicada" && isUuid(actorUserId) ? actorUserId : null,
      },
      { onConflict: "diagnostic_id" },
    )
    .select(adminDeliveryColumns)
    .single<AdminDeliveryRow>();

  if (error) throw error;
  return mapAdminDeliveryRow(data);
}
