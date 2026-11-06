import { mapAdminDeliveryFromReport, adminActionPointTemplates } from "@/lib/data/admin-delivery-domain";
import { buildInitialReport } from "@/components/admin/delivery/delivery-draft";
import type { AdminSpecialist } from "@/lib/contracts/admin-operations";
import type { AdminDataSnapshot } from "@/lib/data/admin-snapshot";
import type { AdminCompanyContext } from "@/lib/data/admin-snapshot";
import { adminModules, acquisitionCampaigns, acquisitionLeads } from "@/lib/mock-data";
import { DEMO_COMPANY, DEMO_DATE, demoReports } from "./demo-data";

export const DEMO_ORGANIZATION_ID = "demo-vertex";

export const demoAdminSnapshot: AdminDataSnapshot = {
  modules: adminModules,
  campaigns: acquisitionCampaigns,
  leads: acquisitionLeads,
  companies: [{
    id: DEMO_ORGANIZATION_ID,
    organizationId: DEMO_ORGANIZATION_ID,
    name: DEMO_COMPANY,
    users: [{ name: "Marina Costa", email: "marina@vertex.example" }],
    companySize: "51–200 pessoas",
    employeeCount: 84,
    leadCount: 0,
    moduleNames: ["Maturidade"],
    sources: ["Apresentação"],
    moduleAccess: [{ moduleId: "module_omdx", enabled: true, updatedAt: DEMO_DATE }],
    firstLeadAt: null,
    lastLeadAt: null,
  }],
};

export function demoAdminSnapshotForState(state: import("./demo-state").DemoState): AdminDataSnapshot {
  return {
    ...demoAdminSnapshot,
    campaigns: state.adminCampaigns ?? demoAdminSnapshot.campaigns,
    leads: state.adminLeads ?? demoAdminSnapshot.leads,
    companies: demoAdminSnapshot.companies.filter(company => !state.deletedCompanyIds?.includes(company.id)),
  };
}

export const demoAdminSpecialists: (AdminSpecialist & { archived: boolean })[] = [{
  id: "demo-specialist-clara",
  name: "Clara Mendes",
  email: "clara@directscal.example",
  title: "Consultora de estruturação",
  location: "São Paulo, SP",
  status: "ativo",
  companyCount: 1,
  activeDeliveryCount: 1,
  createdAt: DEMO_DATE,
  archived: false,
}];

export function demoAdminCompanyContext(specialistId: string | null = demoAdminSpecialists[0].id): AdminCompanyContext {
  return {
    company: demoAdminSnapshot.companies[0],
    modules: demoAdminSnapshot.modules,
    operations: {
      assignment: { specialistId, updatedAt: DEMO_DATE },
      deliveries: demoReports.map(report => ({
        id: report.diagnostic.id,
        diagnosticName: report.diagnostic.name,
        closedAt: DEMO_DATE,
        specialistId,
        status: "publicada" as const,
        responseCount: report.responses.total,
        canAnalyze: true,
      })),
    },
  };
}

export function demoAdminDeliveries(state: import("./demo-state").DemoState) {
  return demoReports.map(report => {
    const publication = state.adminPublications?.find(item => item.diagnosticId === report.diagnostic.id);
    return { ...mapAdminDeliveryFromReport(report), companyId: DEMO_ORGANIZATION_ID, specialistId: publication?.specialistId ?? demoAdminSpecialists[0].id, status: publication?.status ?? "em_analise" as const };
  });
}

export function demoAdminPublication(state: import("./demo-state").DemoState, diagnosticId: string) {
  return state.adminPublications?.find(item => item.diagnosticId === diagnosticId) ?? {
    diagnosticId, organizationId: DEMO_ORGANIZATION_ID, specialistId: demoAdminSpecialists[0].id,
    status: "em_analise" as const, report: buildInitialReport(), dimensionReadings: {},
    selectedActionPointIds: adminActionPointTemplates.slice(0, 3).map(item => item.id), publishedAt: null, updatedAt: DEMO_DATE,
  };
}
