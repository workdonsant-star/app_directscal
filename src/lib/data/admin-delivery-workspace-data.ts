import { getSpecialists } from "@/lib/data/person-profiles-data-source";
import "server-only";

import { cache } from "react";

import {
  getAdminDeliveryAnalysisFromReport,
  mapAdminDeliveryFromReport,
} from "@/lib/data/admin-operations-data-source";
import { getAdminDeliveryPublication } from "@/lib/data/admin-delivery-data-source";
import { getAdminDiagnosticReports } from "@/lib/data/omdx-data-source";

/**
 * Contexto compartilhado pelo layout e pelas etapas de `/admin/entregas/[id]`.
 * O `cache` do React deduplica a leitura dentro da mesma requisição.
 */
export const loadAdminDeliveryContext = cache(async (id: string) => {
  const reports = await getAdminDiagnosticReports();
  const report = reports.find((item) => item.diagnostic.id === id);

  if (!report) return null;

  const publication = await getAdminDeliveryPublication(id);
  const mappedDelivery = mapAdminDeliveryFromReport(report);
  const delivery = publication
    ? {
        ...mappedDelivery,
        specialistId: publication.specialistId,
        status: publication.status,
      }
    : mappedDelivery;
  const deliveryOptions = reports
    .filter(
      (item) =>
        item.diagnostic.organizationId === report.diagnostic.organizationId,
    )
    .map(mapAdminDeliveryFromReport)
    .sort((first, second) => second.closedAt.localeCompare(first.closedAt))
    .map((item) => ({
      id: item.id,
      diagnosticName: item.diagnosticName,
      closedAt: item.closedAt,
    }));

  return {
    analysis: getAdminDeliveryAnalysisFromReport(report),
    company: {
      id: `company_${report.diagnostic.organizationId}`,
      organizationId: report.diagnostic.organizationId,
      name: delivery.companyName,
    },
    delivery,
    deliveryOptions,
    publication,
    specialists: (await getSpecialists())
      .filter((item) => item.status === "ativo" && !item.archived && !item.deleted)
      .map((item) => ({ id: item.id, name: item.name })),
  };
});
