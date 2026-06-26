import { z } from "zod";

import {
  diagnosticActionPointOwnerSchema,
  diagnosticActionPointPrioritySchema,
  dimensionIdSchema,
  idSchema,
  isoDateSchema,
  isoDateTimeSchema,
} from "./omdx";

export const ganttTaskStatusValues = [
  "semStatus",
  "concluido",
  "andamento",
  "atencao",
  "planejado",
  "proximo",
] as const;

export const ganttTaskStatusSchema = z.enum(ganttTaskStatusValues);

export type GanttTaskStatus = z.infer<typeof ganttTaskStatusSchema>;

export const ganttActionPointDetailsSchema = z.object({
  dimensionId: dimensionIdSchema,
  dimensionName: z.string().min(1),
  problem: z.string().min(1),
  recommendedAction: z.string().min(1),
  owner: diagnosticActionPointOwnerSchema,
  involved: z.array(z.string().min(1)).min(1),
  suggestedDeadline: z.string().min(1),
  expectedImpact: z.string().min(1),
  successIndicator: z.string().min(1),
  priority: diagnosticActionPointPrioritySchema,
  score: z.number().min(1).max(5),
  gap: z.number().nonnegative().nullable(),
});

export type GanttActionPointDetails = z.infer<
  typeof ganttActionPointDetailsSchema
>;

export type GanttTask = {
  id: string;
  title: string;
  owner: string;
  blocker: string;
  status: GanttTaskStatus;
  progress: number;
  start: string;
  end: string;
  actionPoint?: GanttActionPointDetails;
  subitems?: GanttTask[];
};

export const ganttTaskSchema: z.ZodType<GanttTask> = z.object({
  id: idSchema,
  title: z.string().min(1),
  owner: z.string().min(1),
  blocker: z.string().min(1),
  status: ganttTaskStatusSchema,
  progress: z.number().int().min(0).max(100),
  start: isoDateSchema,
  end: isoDateSchema,
  actionPoint: ganttActionPointDetailsSchema.optional(),
  subitems: z.lazy(() => z.array(ganttTaskSchema).min(1)).optional(),
});

export const ganttWorkspaceDataSchema = z.object({
  source: z
    .object({
      diagnosticId: idSchema,
      diagnosticName: z.string().min(1),
      company: z.string().min(1),
      generatedAt: isoDateTimeSchema,
    })
    .nullable(),
  tasks: z.array(ganttTaskSchema),
});

export type GanttWorkspaceData = z.infer<typeof ganttWorkspaceDataSchema>;
