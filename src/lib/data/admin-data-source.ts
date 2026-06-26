import {
  acquisitionCampaigns as seedCampaigns,
  adminModules as seedModules,
  mockOrganizations as seedOrganizations,
} from "@/lib/mock-data";
import {
  acquisitionCampaignSchema,
  adminModuleSchema,
  clientModuleAccessSchema,
  leadCompanySchema,
  type AcquisitionCampaign,
  type AcquisitionFormField,
  type AcquisitionFormFieldType,
  type AdminModule,
  type ClientModuleAccess,
  type Lead,
  type LeadCompany,
} from "@/lib/contracts";

type AdminOrganization = {
  id: string;
  name: string;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationModuleAccessRecord = {
  organizationId: string;
  moduleId: string;
  enabled: boolean;
  updatedAt: string | null;
};

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

function moduleAccessForOrganization(
  organizationId: string,
  accessRecords: OrganizationModuleAccessRecord[],
): ClientModuleAccess[] {
  return seedModules.map((module) => {
    const record = accessRecords.find(
      (item) =>
        item.organizationId === organizationId && item.moduleId === module.id,
    );

    return clientModuleAccessSchema.parse({
      moduleId: module.id,
      enabled: record?.enabled ?? module.status === "ativo",
      updatedAt: record?.updatedAt ?? null,
    });
  });
}

function isCompanyModuleEnabled(company: LeadCompany, moduleId: string) {
  return (
    company.moduleAccess.find((access) => access.moduleId === moduleId)
      ?.enabled ?? true
  );
}

function deriveCompanies({
  accessRecords,
  leads,
  organizations,
}: {
  accessRecords: OrganizationModuleAccessRecord[];
  leads: Lead[];
  organizations: AdminOrganization[];
}): LeadCompany[] {
  const grouped = new Map<string, Lead[]>();

  leads.forEach((lead) => {
    const key =
      lead.organizationId ?? `lead:${lead.companyName.trim().toLowerCase()}`;
    grouped.set(key, [...(grouped.get(key) ?? []), lead]);
  });

  const companiesById = new Map<string, LeadCompany>();

  organizations.forEach((organization) => {
    const items = grouped.get(organization.id) ?? [];
    const ordered = [...items].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const latest = ordered[ordered.length - 1];
    const moduleNames = [...new Set(items.map((lead) => moduleNameById(lead.moduleId)))];
    const sources = [...new Set(items.map((lead) => lead.source))];

    companiesById.set(
      organization.id,
      leadCompanySchema.parse({
        id: `company_${organization.id}`,
        organizationId: organization.id,
        name: organization.name,
        companySize: latest?.companySize ?? null,
        employeeCount: organization.employeeCount,
        leadCount: items.length,
        moduleNames,
        sources,
        moduleAccess: moduleAccessForOrganization(organization.id, accessRecords),
        firstLeadAt: ordered[0]?.createdAt ?? null,
        lastLeadAt: latest?.createdAt ?? null,
      }),
    );
  });

  grouped.forEach((items, key) => {
    if (!key.startsWith("lead:")) return;

    const ordered = [...items].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const latest = ordered[ordered.length - 1];
    const moduleNames = [...new Set(items.map((lead) => moduleNameById(lead.moduleId)))];
    const sources = [...new Set(items.map((lead) => lead.source))];

    companiesById.set(
      key,
      leadCompanySchema.parse({
        id: `company_${createAcquisitionSlug(latest.companyName) || latest.id}`,
        organizationId: null,
        name: latest.companyName,
        companySize: latest.companySize,
        employeeCount: null,
        leadCount: items.length,
        moduleNames,
        sources,
        moduleAccess: [],
        firstLeadAt: ordered[0].createdAt,
        lastLeadAt: latest.createdAt,
      }),
    );
  });

  return [...companiesById.values()]
    .sort(
      (a, b) => {
        if (a.lastLeadAt && b.lastLeadAt) {
          return (
            new Date(b.lastLeadAt).getTime() -
            new Date(a.lastLeadAt).getTime()
          );
        }

        if (a.lastLeadAt) return -1;
        if (b.lastLeadAt) return 1;

        return a.name.localeCompare(b.name, "pt-BR");
      },
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
        company.organizationId
          ? isCompanyModuleEnabled(company, module.id)
          : companyNames.has(company.name),
      ).length,
    });
  });
}

export function buildAdminDataSnapshot({
  accessRecords = [],
  campaigns,
  leads,
  organizations = seedOrganizations.map((organization) => ({
    id: organization.id,
    name: organization.name,
    employeeCount: organization.employeeCount,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
  })),
}: {
  accessRecords?: OrganizationModuleAccessRecord[];
  campaigns: AcquisitionCampaign[];
  leads: Lead[];
  organizations?: AdminOrganization[];
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
  const companies = deriveCompanies({ accessRecords, leads, organizations });
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
  const slug = createAcquisitionSlug(`${module.slug}-${Date.now().toString(36)}`);
  const defaultFields = sortAcquisitionFields(seedCampaigns[0]?.fields ?? []).map(
    (field) => ({ ...field }),
  );

  return acquisitionCampaignSchema.parse({
    id: `camp_${slug}`,
    moduleId: module.id,
    name: `Nova campanha — ${module.shortName}`,
    source: "Origem não definida",
    status: "ativo",
    slug,
    publicPath: `/a/${slug}`,
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
