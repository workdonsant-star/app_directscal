import { leadSchema } from "@/lib/contracts/admin";
import { demoAdminSnapshot } from "./demo-admin-data";
import { DEMO_DATE } from "./demo-data";
import type { DemoState } from "./demo-state";

export function registerDemoLead(state: DemoState, slug: string, values: Record<string, string>, provider: "google" | "password"): DemoState {
  const campaign = (state.adminCampaigns ?? demoAdminSnapshot.campaigns).find(item => item.slug === slug);
  if (!campaign || campaign.status !== "ativo") throw new Error("Este link de campanha não está disponível.");
  const name = values.nome?.trim();
  const email = values.email?.trim().toLowerCase();
  const companyName = values.empresa?.trim() || values.nome_fantasia?.trim() || values.razao_social?.trim() || values.website?.trim().split(".")[0];
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !companyName) throw new Error("Preencha nome, e-mail e empresa.");
  if (campaign.fields.some(field => field.required && !values[field.id]?.trim())) throw new Error("Preencha os campos obrigatórios da campanha.");
  const leads = state.adminLeads ?? demoAdminSnapshot.leads;
  if (leads.some(lead => lead.campaignId === campaign.id && lead.email.toLowerCase() === email)) throw new Error("Este e-mail já foi registrado nesta campanha da demo.");
  const lead = leadSchema.parse({
    id: `demo-lead-${crypto.randomUUID()}`,
    moduleId: campaign.moduleId,
    campaignId: campaign.id,
    campaignName: campaign.name,
    source: campaign.source,
    name,
    email,
    phone: values.whatsapp?.trim() || null,
    role: values.cargo?.trim() || null,
    companyName,
    companySize: values.tamanho_empresa?.trim() || null,
    objective: values.objetivo?.trim() || null,
    createdAt: DEMO_DATE,
    fieldValues: Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()])),
    status: "lead",
    accountProvider: provider,
    userId: null,
    organizationId: null,
  });
  return { ...state, adminLeads: [...leads, lead] };
}
