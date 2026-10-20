import { z } from "zod";
export const resultBaselineSchema = z.object({
 ruleId: z.uuid(), routineId: z.uuid(), diagnosticId: z.uuid(), questionId: z.uuid(), actionPointId: z.string(), assetId: z.uuid(), assetVersionId: z.uuid(),
 capturedAt: z.iso.datetime({ offset: true }), diagnosticClosedAt: z.iso.datetime({ offset: true }).nullable(), questionText: z.string(),
 layers: z.object({ group: z.enum(["fundador", "lideranca", "operacao"]), responses: z.number().int().nonnegative(), score: z.number().min(1).max(5).nullable() }).superRefine((layer, ctx) => {
  if ((layer.responses === 0) !== (layer.score === null)) ctx.addIssue({ code: "custom", message: "Score ausente somente quando não há respostas." });
 }).array().length(3).refine(layers => new Set(layers.map(layer => layer.group)).size === 3, "Uma linha por camada."),
});
export const captureResultBaselineInputSchema = z.object({ ruleId: z.uuid() }).strict();
export type ResultBaseline = z.infer<typeof resultBaselineSchema>;
