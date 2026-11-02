import type { AcquisitionCampaign, AdminModule, Lead, LeadCompany } from "@/lib/contracts";
import type { z } from "zod";
import { companyOperationsSchema } from "@/lib/contracts/admin-operations";

export type AdminDataSnapshot = {
  modules: AdminModule[];
  campaigns: AcquisitionCampaign[];
  leads: Lead[];
  companies: LeadCompany[];
};

export const adminUpdatedEventName = "directscal:admin-data-updated";

export type AdminCompanyContext = {
  company: LeadCompany;
  modules: AdminModule[];
  operations: z.infer<typeof companyOperationsSchema>;
};
