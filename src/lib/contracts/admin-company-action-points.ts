import { z } from "zod";

export const adminCompanyActionPointInputSchema = z.object({
  id: z.uuid(),
  expectedUpdatedAt: z.iso.datetime({ offset: true }).nullable(),
  title: z.string().trim().min(1).max(200),
  assetId: z.uuid(),
  leaderUserId: z.string().trim().min(1).max(100),
  deadline: z.iso.date().nullable(),
  frequency: z.enum(["diaria", "semanal", "quinzenal", "mensal"]).nullable(),
  weekdays: z.array(z.number().int().min(0).max(6)).max(7),
  sendTime: z.string().regex(/^([01]\d|2[0-3]):[0-5][05]$/).nullable(),
  scheduleStartsOn: z.iso.date().nullable(),
  reason: z.string().trim().min(1).max(2000),
  action: z.string().trim().min(1).max(2000),
  continuity: z.string().trim().min(1).max(2000),
}).strict().superRefine((input, context) => {
  if (input.frequency && (!input.weekdays.length || !input.sendTime || !input.scheduleStartsOn)) {
    context.addIssue({ code: "custom", message: "Defina dias, horário e início da recorrência.", path: ["weekdays"] });
  }
  if (new Set(input.weekdays).size !== input.weekdays.length) {
    context.addIssue({ code: "custom", message: "Não repita dias da semana.", path: ["weekdays"] });
  }
  if (!input.frequency && (input.weekdays.length || input.sendTime || input.scheduleStartsOn)) {
    context.addIssue({ code: "custom", message: "A programação exige uma frequência.", path: ["frequency"] });
  }
});

export type AdminCompanyActionPointInput = z.infer<typeof adminCompanyActionPointInputSchema>;
export type AdminCompanyActionPoint = Omit<AdminCompanyActionPointInput, "expectedUpdatedAt"> & {
  assetTitle: string;
  leaderName: string;
  leaderAvatarUrl: string | null;
  updatedAt: string;
  followup: { id: string; status: "preparado" | "enviando" | "enviado" | "respondido" | "falhou" | "incerto"; createdAt: string; reports: Array<{ status: string; summary: string; evidence: string | null; registeredAt: string; confirmedAt: string | null }> } | null;
};

export type AdminCompanyActionPointAsset = { id: string; title: string };
