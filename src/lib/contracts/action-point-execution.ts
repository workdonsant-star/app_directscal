import { z } from "zod";

import { idSchema, isoDateSchema, isoDateTimeSchema } from "./omdx";

export const actionPointStageValues = [
  "atribuido",
  "em_implementacao",
  "bloqueado",
  "concluido",
] as const;
export const actionPointCadenceValues = [
  "semanal",
  "quinzenal",
  "mensal",
] as const;
export const actionPointEventKindValues = [
  "atribuicao",
  "etapa",
  "prazo",
  "andamento",
  "nota",
  // Reservado para as respostas do líder ao agente no Slack.
  "resposta",
] as const;

export const actionPointStageSchema = z.enum(actionPointStageValues);
export const actionPointCadenceSchema = z.enum(actionPointCadenceValues);
export const actionPointEventKindSchema = z.enum(actionPointEventKindValues);

export const actionPointAssigneeSchema = z.object({
  teamId: idSchema,
  userId: idSchema,
  name: z.string().min(1),
  avatarUrl: z.string().url().nullable(),
});

export const actionPointAssignmentSchema = z.object({
  diagnosticId: idSchema,
  actionPointId: idSchema,
  assignee: actionPointAssigneeSchema,
  stage: actionPointStageSchema,
  startsOn: isoDateSchema.nullable(),
  dueOn: isoDateSchema.nullable(),
  cadence: actionPointCadenceSchema,
  progress: z.number().int().min(0).max(100),
  updatedAt: isoDateTimeSchema,
});

export const actionPointEventSchema = z.object({
  id: idSchema,
  actionPointId: idSchema,
  kind: actionPointEventKindSchema,
  authorName: z.string().min(1),
  // Frase de ação iniciada por verbo ("alterou o prazo de … para …").
  body: z.string().min(1),
  detail: z.string().min(1).nullable(),
  createdAt: isoDateTimeSchema,
});

// `assigneeUserId`: texto atribui ou troca; null remove o responsável.
export const actionPointUpdateInputSchema = z.object({
  diagnosticId: idSchema,
  actionPointId: idSchema,
  assigneeUserId: z.string().min(1).nullable().optional(),
  stage: actionPointStageSchema.optional(),
  startsOn: isoDateSchema.nullable().optional(),
  dueOn: isoDateSchema.nullable().optional(),
  cadence: actionPointCadenceSchema.optional(),
  progress: z.number().int().min(0).max(100).optional(),
  note: z.string().trim().min(1).max(1000).optional(),
});

export type ActionPointStageValue = z.infer<typeof actionPointStageSchema>;
export type ActionPointCadence = z.infer<typeof actionPointCadenceSchema>;
export type ActionPointEventKind = z.infer<typeof actionPointEventKindSchema>;
export type ActionPointAssignee = z.infer<typeof actionPointAssigneeSchema>;
export type ActionPointAssignment = z.infer<typeof actionPointAssignmentSchema>;
export type ActionPointEvent = z.infer<typeof actionPointEventSchema>;
export type ActionPointUpdateInput = z.infer<
  typeof actionPointUpdateInputSchema
>;

// Estado da conexão com o Slack para escolher responsáveis. "reconectar"
// indica instalação anterior às permissões de leitura de pessoas.
export type ActionPointSlackStatus = "desconectado" | "reconectar" | "conectado";
