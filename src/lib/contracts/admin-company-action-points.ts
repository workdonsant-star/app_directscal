import { z } from "zod";

export const adminCompanyActionPointInputSchema = z.object({
  id: z.uuid(),
  expectedUpdatedAt: z.iso.datetime({ offset: true }).nullable(),
  title: z.string().trim().min(1).max(200),
  assetId: z.uuid(),
  leaderUserId: z.string().trim().min(1).max(100),
  deadline: z.iso.date().nullable(),
  frequency: z.enum(["diaria", "semanal", "quinzenal", "mensal"]).nullable(),
  reason: z.string().trim().min(1).max(2000),
  action: z.string().trim().min(1).max(2000),
  continuity: z.string().trim().min(1).max(2000),
}).strict();

export type AdminCompanyActionPointInput = z.infer<typeof adminCompanyActionPointInputSchema>;
export type AdminCompanyActionPoint = Omit<AdminCompanyActionPointInput, "expectedUpdatedAt"> & {
  assetTitle: string;
  leaderName: string;
  leaderAvatarUrl: string | null;
  updatedAt: string;
  followup: { id: string; status: "preparado" | "enviando" | "enviado" | "respondido" | "falhou" | "incerto"; createdAt: string; reports: Array<{ status: string; summary: string; evidence: string | null; registeredAt: string; confirmedAt: string | null }> } | null;
};

export type AdminCompanyActionPointAsset = { id: string; title: string };
