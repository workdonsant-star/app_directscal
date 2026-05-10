import {
  acquisitionCampaigns as seedCampaigns,
  acquisitionLeads as seedLeads,
  adminModules as seedModules,
} from "@/lib/mock-data";
import {
  acquisitionCampaignSchema,
  acquisitionSubmissionInputSchema,
  adminModuleSchema,
  leadCompanySchema,
  leadSchema,
  type AcquisitionCampaign,
  type AcquisitionFormField,
  type AcquisitionFormFieldType,
  type AcquisitionSubmissionInput,
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

type AdminStorageRaw = {
  campaigns: string | null;
  leads: string | null;
};

export const adminCampaignsStorageKey = "directscal:admin-campaigns";
export const adminLeadsStorageKey = "directscal:admin-leads";
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

let cachedClientRaw: AdminStorageRaw | null = null;
let cachedClientSnapshot: AdminDataSnapshot | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function parseStoredJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStoredJson<T>(key: string, value: T) {
  if (!isBrowser()) return;

  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(adminUpdatedEventName));
}

function getStorageRaw(): AdminStorageRaw {
  if (!isBrowser()) {
    return { campaigns: null, leads: null };
  }

  return {
    campaigns: window.localStorage.getItem(adminCampaignsStorageKey),
    leads: window.localStorage.getItem(adminLeadsStorageKey),
  };
}

function isSameStorageRaw(a: AdminStorageRaw | null, b: AdminStorageRaw) {
  return Boolean(a && a.campaigns === b.campaigns && a.leads === b.leads);
}

function getStoredCampaigns(): AcquisitionCampaign[] {
  const parsed = acquisitionCampaignSchema
    .array()
    .safeParse(parseStoredJson(adminCampaignsStorageKey, []));

  return parsed.success ? parsed.data : [];
}

function getStoredLeads(): Lead[] {
  const parsed = leadSchema
    .array()
    .safeParse(parseStoredJson(adminLeadsStorageKey, []));

  return parsed.success ? parsed.data : [];
}

function sortFields(fields: AcquisitionFormField[]) {
  return [...fields].sort((a, b) => a.order - b.order);
}

function mergeCampaigns() {
  const overrides = new Map(
    getStoredCampaigns().map((campaign) => [campaign.id, campaign]),
  );
  const merged = seedCampaigns.map((campaign) =>
    overrides.get(campaign.id) ?? campaign,
  );
  const custom = getStoredCampaigns().filter(
    (campaign) => !seedCampaigns.some((seed) => seed.id === campaign.id),
  );

  return [...merged, ...custom].map((campaign) =>
    acquisitionCampaignSchema.parse({
      ...campaign,
      fields: sortFields(campaign.fields),
    }),
  );
}

function mergeLeads() {
  return [...seedLeads, ...getStoredLeads()]
    .map((lead) => leadSchema.parse(lead))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

function moduleNameById(moduleId: string) {
  return seedModules.find((module) => module.id === moduleId)?.shortName ?? moduleId;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
        id: `company_${slugify(latest.companyName) || latest.id}`,
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

function buildSnapshot(): AdminDataSnapshot {
  const campaigns = mergeCampaigns();
  const leads = mergeLeads();
  const companies = deriveCompanies(leads);
  const modules = deriveModules(campaigns, leads, companies);

  return { modules, campaigns, leads, companies };
}

function buildSeedSnapshot(): AdminDataSnapshot {
  const campaigns = seedCampaigns.map((campaign) =>
    acquisitionCampaignSchema.parse({
      ...campaign,
      fields: sortFields(campaign.fields),
    }),
  );
  const leads = seedLeads.map((lead) => leadSchema.parse(lead));
  const companies = deriveCompanies(leads);
  const modules = deriveModules(campaigns, leads, companies);

  return { modules, campaigns, leads, companies };
}

const adminDataServerSnapshot = buildSeedSnapshot();

export function getAdminDataSnapshot(): AdminDataSnapshot {
  if (!isBrowser()) {
    return adminDataServerSnapshot;
  }

  const raw = getStorageRaw();

  if (cachedClientSnapshot && isSameStorageRaw(cachedClientRaw, raw)) {
    return cachedClientSnapshot;
  }

  cachedClientRaw = raw;
  cachedClientSnapshot = buildSnapshot();

  return cachedClientSnapshot;
}

export function getAdminDataServerSnapshot(): AdminDataSnapshot {
  return adminDataServerSnapshot;
}

export function subscribeAdminData(callback: () => void) {
  if (!isBrowser()) return () => {};

  function handleStorage(event: StorageEvent) {
    if (
      event.key === adminCampaignsStorageKey ||
      event.key === adminLeadsStorageKey
    ) {
      callback();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(adminUpdatedEventName, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(adminUpdatedEventName, callback);
  };
}

export function getAcquisitionCampaignByToken(token: string) {
  return getAdminDataSnapshot().campaigns.find(
    (campaign) => campaign.token === token,
  );
}

export function saveAcquisitionCampaign(campaign: AcquisitionCampaign) {
  const parsed = acquisitionCampaignSchema.parse({
    ...campaign,
    updatedAt: new Date().toISOString(),
    fields: sortFields(campaign.fields),
  });
  const campaigns = mergeCampaigns();
  const next = campaigns.some((item) => item.id === parsed.id)
    ? campaigns.map((item) => (item.id === parsed.id ? parsed : item))
    : [...campaigns, parsed];

  writeStoredJson(adminCampaignsStorageKey, next);
}

export function fieldTypeLabel(type: AcquisitionFormFieldType) {
  return fieldTypeLabels[type];
}

export function createAcquisitionSlug(value: string) {
  return slugify(value) || "campanha";
}

export function createAcquisitionCampaignDraft(
  module: AdminModule,
): AcquisitionCampaign {
  const createdAt = new Date().toISOString();
  const token = createAcquisitionSlug(`${module.slug}-${Date.now().toString(36)}`);
  const defaultFields = sortFields(seedCampaigns[0]?.fields ?? []).map(
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

function valueByField(
  campaign: AcquisitionCampaign,
  values: Record<string, string>,
  candidates: string[],
) {
  for (const candidate of candidates) {
    const value = values[candidate]?.trim();
    if (value) return value;
  }

  const matchingField = campaign.fields.find((field) =>
    candidates.some((candidate) =>
      field.label.toLowerCase().includes(candidate.replace("_", " ")),
    ),
  );

  return matchingField ? values[matchingField.id]?.trim() || null : null;
}

function createLeadId() {
  if (isBrowser() && window.crypto?.randomUUID) {
    return `lead_${window.crypto.randomUUID()}`;
  }

  return `lead_${Date.now()}`;
}

export function submitAcquisitionLead(input: AcquisitionSubmissionInput) {
  const parsedInput = acquisitionSubmissionInputSchema.parse(input);
  const campaign = getAcquisitionCampaignByToken(parsedInput.token);

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const values = parsedInput.values;
  const name = valueByField(campaign, values, ["nome", "name"]) ?? "Lead sem nome";
  const email =
    valueByField(campaign, values, ["email", "e-mail"]) ??
    `lead-${Date.now()}@directscal.local`;
  const companyName =
    valueByField(campaign, values, ["empresa", "company"]) ??
    "Empresa não informada";

  const lead = leadSchema.parse({
    id: createLeadId(),
    moduleId: campaign.moduleId,
    campaignId: campaign.id,
    campaignName: campaign.name,
    source: campaign.source,
    name,
    email,
    phone: valueByField(campaign, values, ["whatsapp", "telefone", "phone"]),
    role: valueByField(campaign, values, ["cargo", "role"]),
    companyName,
    companySize: valueByField(campaign, values, ["tamanho_empresa", "tamanho"]),
    objective: valueByField(campaign, values, ["objetivo", "desafio"]),
    createdAt: new Date().toISOString(),
    fieldValues: values,
  });

  writeStoredJson(adminLeadsStorageKey, [lead, ...getStoredLeads()]);

  return lead;
}
