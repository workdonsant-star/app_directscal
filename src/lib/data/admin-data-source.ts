import {
  acquisitionCampaigns as seedCampaigns,
  adminModules as seedModules,
} from "@/lib/mock-data";
import {
  acquisitionCampaignSchema,
  adminModuleSchema,
  leadCompanySchema,
  type AcquisitionCampaign,
  type AcquisitionFormField,
  type AcquisitionFormFieldType,
  type AdminModule,
  type Lead,
  type LeadCompany,
} from "@/lib/contracts";

export type AdminDataSnapshot = {
  modules: AdminModule[];
  campaigns: AcquisitionCampaign[];
  leads: Lead[];
  companies: LeadCompany[];
};

export const adminUpdatedEventName = "directscal:admin-data-updated";
export const acquisitionCoreFieldIds = ["nome", "email", "empresa"] as const;

const fieldTypeLabels: Record<AcquisitionFormFieldType, string> = {
  text: "Texto",
  email: "E-mail",
  phone: "Telefone",
  number: "Número",
  select: "Seletor",
  textarea: "Texto longo",
};

export function sortAcquisitionFields(fields: AcquisitionFormField[]) {
  return [...fields].sort((a, b) => a.order - b.order);
}

function moduleNameById(moduleId: string) {
  return seedModules.find((module) => module.id === moduleId)?.shortName ?? moduleId;
}

export function getAdminModuleById(moduleId: string) {
  return seedModules.find((module) => module.id === moduleId) ?? null;
}

export function createAcquisitionSlug(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "campanha"
  );
}

function deriveCompanies(leads: Lead[]): LeadCompany[] {
  const grouped = new Map<string, Lead[]>();

  leads.forEach((lead) => {
    const key = lead.companyName.trim().toLowerCase();
    grouped.set(key, [...(grouped.get(key) ?? []), lead]);
  });

  return [...grouped.values()]
    .map((items) => {
      const ordered = [...items].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const latest = ordered[ordered.length - 1];
      const moduleNames = [...new Set(items.map((lead) => moduleNameById(lead.moduleId)))];
      const sources = [...new Set(items.map((lead) => lead.source))];

      return leadCompanySchema.parse({
        id: `company_${createAcquisitionSlug(latest.companyName) || latest.id}`,
        name: latest.companyName,
        companySize: latest.companySize,
        leadCount: items.length,
        moduleNames,
        sources,
        firstLeadAt: ordered[0].createdAt,
        lastLeadAt: latest.createdAt,
      });
    })
    .sort(
      (a, b) =>
        new Date(b.lastLeadAt).getTime() - new Date(a.lastLeadAt).getTime(),
    );
}

function deriveModules(
  campaigns: AcquisitionCampaign[],
  leads: Lead[],
  companies: LeadCompany[],
) {
  return seedModules.map((module) => {
    const moduleCampaigns = campaigns.filter(
      (campaign) => campaign.moduleId === module.id,
    );
    const moduleLeads = leads.filter((lead) => lead.moduleId === module.id);
    const companyNames = new Set(moduleLeads.map((lead) => lead.companyName));

    return adminModuleSchema.parse({
      ...module,
      campaignsCount: moduleCampaigns.length,
      activeCampaigns: moduleCampaigns.filter(
        (campaign) => campaign.status === "ativo",
      ).length,
      leadCount: moduleLeads.length,
      companyCount: companies.filter((company) =>
        companyNames.has(company.name),
      ).length,
    });
  });
}

export function buildAdminDataSnapshot({
  campaigns,
  leads,
}: {
  campaigns: AcquisitionCampaign[];
  leads: Lead[];
}): AdminDataSnapshot {
  const parsedCampaigns = campaigns
    .map((campaign) =>
      acquisitionCampaignSchema.parse({
        ...campaign,
        fields: sortAcquisitionFields(campaign.fields),
      }),
    )
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  const companies = deriveCompanies(leads);
  const modules = deriveModules(parsedCampaigns, leads, companies);

  return {
    modules,
    campaigns: parsedCampaigns,
    leads,
    companies,
  };
}

const adminDataServerSnapshot = buildAdminDataSnapshot({
  campaigns: seedCampaigns,
  leads: [],
});

export function getAdminDataServerSnapshot(): AdminDataSnapshot {
  return adminDataServerSnapshot;
}

export function fieldTypeLabel(type: AcquisitionFormFieldType) {
  return fieldTypeLabels[type];
}

export function createAcquisitionCampaignDraft(
  module: AdminModule,
): AcquisitionCampaign {
  const createdAt = new Date().toISOString();
  const token = createAcquisitionSlug(`${module.slug}-${Date.now().toString(36)}`);
  const defaultFields = sortAcquisitionFields(seedCampaigns[0]?.fields ?? []).map(
    (field) => ({ ...field }),
  );

  return acquisitionCampaignSchema.parse({
    id: `camp_${token}`,
    moduleId: module.id,
    name: `Nova campanha — ${module.shortName}`,
    source: "Origem não definida",
    status: "ativo",
    token,
    publicPath: `/a/${token}`,
    createdAt,
    updatedAt: createdAt,
    visits: 0,
    fields: defaultFields,
  });
}

export function isCoreAcquisitionField(fieldId: string) {
  return acquisitionCoreFieldIds.some((id) => id === fieldId);
}

export function notifyAdminDataChanged() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(adminUpdatedEventName));
}
