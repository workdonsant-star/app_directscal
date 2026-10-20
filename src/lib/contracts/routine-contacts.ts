import { z } from "zod";
export const contactTimeZones = ["America/Sao_Paulo", "America/Manaus", "America/Rio_Branco", "America/Fortaleza"] as const;
export const routineContactPolicyInputSchema = z.object({
  id: z.uuid(), expectedRevision: z.number().int().nonnegative(), enabled: z.boolean(),
  sectorIds: z.array(z.uuid()).max(200).refine(values => new Set(values).size === values.length).transform(values => [...values].sort()),
  weekdays: z.array(z.number().int().min(1).max(5)).min(1).max(5).refine(values => new Set(values).size === values.length).transform(values => [...values].sort((a, b) => a - b)),
  startHour: z.number().int().min(6).max(21), endHour: z.number().int().min(7).max(22),
  timeZone: z.enum(contactTimeZones), maxCompanyPerDay: z.number().int().min(1).max(50), maxPersonPerDay: z.number().int().min(1).max(5),
  reason: z.string().trim().min(1).max(2000),
}).strict().superRefine((value, ctx) => {
  if (value.endHour <= value.startHour) ctx.addIssue({ code: "custom", message: "O fim precisa ser posterior ao início.", path: ["endHour"] });
  if (value.enabled && !value.sectorIds.length) ctx.addIssue({ code: "custom", message: "Selecione o público antes de ativar.", path: ["sectorIds"] });
  if (value.maxPersonPerDay > value.maxCompanyPerDay) ctx.addIssue({ code: "custom", message: "O limite por pessoa não pode superar o da empresa.", path: ["maxPersonPerDay"] });
});
export type RoutineContactPolicyInput = z.infer<typeof routineContactPolicyInputSchema>;
export type RoutineContactPolicy = Omit<RoutineContactPolicyInput, "expectedRevision"> & { revision: number; createdAt: string; enabledAt: string | null };
export type RoutineContactDisposition = { disposition: "cancelar" } | { disposition: "adiar"; availableAt: string } | { disposition: "enviar"; purpose?: "inicial" | "lembrete"; title: string; expectation: string; successIndicator: string; assetTitle: string; assetVersion: string; opensAt: string; dueAt: string; cycleId: string };

const localInstant = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, "Informe data e horário válidos.");
export const routineEventInputSchema = z.object({
  id: z.uuid(), ruleId: z.uuid(), expectedPolicyRevision: z.number().int().positive(),
  sourceKey: z.string().trim().min(1).max(160), referenceUrl: z.url().max(2000).refine(value => value.startsWith("https://"), "Use uma referência HTTPS."),
  description: z.string().trim().min(1).max(2000), happenedLocal: localInstant, dueLocal: localInstant,
}).strict();
export type RoutineEventInput = z.infer<typeof routineEventInputSchema>;
