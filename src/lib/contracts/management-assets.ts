import { z } from "zod";

import { idSchema, isoDateTimeSchema } from "./omdx";
import { richTextDocumentSchema } from "./rich-text";

// Tipos com biblioteca própria no app do cliente. A matriz RACI terá um
// componente tabular dedicado; por ora só os ativos textuais são editáveis.
export const managementAssetTypeValues = [
  "sop",
  "playbook",
  "governanca",
  "raci",
] as const;

export const editableManagementAssetTypeValues = [
  "sop",
  "playbook",
  "governanca",
] as const;

export const managementAssetTypeSchema = z.enum(managementAssetTypeValues);
export const editableManagementAssetTypeSchema = z.enum(
  editableManagementAssetTypeValues,
);

export const managementAssetTypeLabels: Record<ManagementAssetType, string> = {
  sop: "SOP",
  playbook: "Playbook",
  governanca: "Governança",
  raci: "Matriz RACI",
};

export const managementAssetStatusValues = [
  "rascunho",
  "em_revisao",
  "pronto_para_publicar",
  "publicado",
  "arquivado",
] as const;

export const managementAssetStatusSchema = z.enum(managementAssetStatusValues);

export const managementAssetVersionStatusValues = [
  "rascunho",
  "em_revisao",
  "pronto_para_publicar",
  "publicado",
  "substituido",
] as const;

export const managementAssetVersionStatusSchema = z.enum(
  managementAssetVersionStatusValues,
);

export const managementAssetAuthorSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  avatarUrl: z.string().url().optional(),
});

// Card das bibliotecas do cliente: somente a versão publicada vigente.
export const managementAssetSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  type: managementAssetTypeSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  category: z.string().min(1).nullable(),
  author: managementAssetAuthorSchema,
  versionNumber: z.string().min(1),
  publishedAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

// Leitura individual do cliente.
export const managementAssetDocumentSchema = managementAssetSchema.extend({
  versionId: idSchema,
  operationalOwner: z.string().min(1),
  reviewCycle: z.string().min(1),
  content: richTextDocumentSchema,
});

// Formato legado em blocos, usado pelos modelos de partida e por versões
// gravadas antes do editor de texto.
export const legacySopContentBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("paragraph"),
    text: z.string().min(1),
  }),
  z.object({
    type: z.literal("list"),
    ordered: z.boolean(),
    items: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal("table"),
    columns: z.array(z.string().min(1)).min(1),
    rows: z.array(z.array(z.string().min(1)).min(1)).min(1),
  }),
]);

export const legacySopSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  blocks: z.array(legacySopContentBlockSchema).min(1),
});

export const legacySopDocumentContentSchema = z.object({
  version: z.string().min(1).optional(),
  operationalOwner: z.string().min(1).optional(),
  reviewCycle: z.string().min(1).optional(),
  sections: z.array(legacySopSectionSchema).min(1),
});

// Operação Directscal.
export const adminManagementAssetListItemSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  organizationName: z.string().min(1),
  type: managementAssetTypeSchema,
  title: z.string().min(1),
  category: z.string().nullable(),
  status: managementAssetStatusSchema,
  draftStatus: managementAssetVersionStatusSchema.nullable(),
  publishedVersionNumber: z.string().nullable(),
  specialistId: z.string().nullable(),
  updatedAt: isoDateTimeSchema,
});

export const adminManagementAssetVersionSchema = z.object({
  id: idSchema,
  versionNumber: z.string().min(1),
  status: managementAssetVersionStatusSchema,
  changeNote: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  reviewedAt: isoDateTimeSchema.nullable(),
  publishedAt: isoDateTimeSchema.nullable(),
  indexStatus: z.enum(["pendente", "processando", "pronto", "erro"]),
  indexError: z.string().nullable(),
});

export const adminManagementAssetDetailSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  organizationName: z.string().min(1),
  type: managementAssetTypeSchema,
  title: z.string().min(1),
  summary: z.string(),
  category: z.string().nullable(),
  ownerLabel: z.string().nullable(),
  reviewCycle: z.string().nullable(),
  specialistId: z.string().nullable(),
  status: managementAssetStatusSchema,
  archivedAt: isoDateTimeSchema.nullable(),
  updatedAt: isoDateTimeSchema,
  draft: adminManagementAssetVersionSchema
    .extend({ content: richTextDocumentSchema })
    .nullable(),
  published: adminManagementAssetVersionSchema
    .extend({ content: richTextDocumentSchema })
    .nullable(),
  versions: z.array(adminManagementAssetVersionSchema),
  chunkCount: z.number().int().min(0),
  embeddedChunkCount: z.number().int().min(0),
});

const trimmedText = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

export const createManagementAssetInputSchema = z.object({
  organizationId: idSchema,
  type: editableManagementAssetTypeSchema,
  title: trimmedText(3, 240),
  summary: trimmedText(10, 600),
  category: trimmedText(2, 80).nullable(),
  ownerLabel: trimmedText(2, 120),
  reviewCycle: trimmedText(2, 80),
  specialistId: z.string().trim().min(1).nullable(),
  templateId: z.string().trim().min(1).nullable(),
});

export const updateManagementAssetInputSchema = z.object({
  title: trimmedText(3, 240),
  summary: trimmedText(10, 600),
  category: trimmedText(2, 80).nullable(),
  ownerLabel: trimmedText(2, 120),
  reviewCycle: trimmedText(2, 80),
  specialistId: z.string().trim().min(1).nullable(),
  changeNote: z.string().trim().max(600).nullable(),
  content: richTextDocumentSchema.nullable(),
});

export const managementAssetTransitionValues = [
  "abrir_rascunho",
  "enviar_para_revisao",
  "aprovar_revisao",
  "devolver_para_rascunho",
  "publicar",
  "arquivar",
  "restaurar",
  "reindexar",
] as const;

export const managementAssetTransitionInputSchema = z.object({
  action: z.enum(managementAssetTransitionValues),
});

// Agente de consulta.
export const assetQuestionChannelSchema = z.enum(["app", "slack"]);

export const assetQuestionCitationSchema = z.object({
  chunkId: idSchema,
  assetId: idSchema,
  versionId: idSchema,
  assetType: managementAssetTypeSchema,
  title: z.string().min(1),
  section: z.string().min(1),
  versionNumber: z.string().min(1),
  publishedAt: isoDateTimeSchema,
  href: z.string().min(1),
});

export const assetQuestionAnswerSchema = z.object({
  auditId: idSchema.nullable(),
  status: z.enum(["answered", "insufficient_evidence", "error"]),
  answer: z.string().min(1),
  confidence: z.enum(["alta", "media", "insuficiente"]),
  citations: z.array(assetQuestionCitationSchema),
  refusalReason: z.string().optional(),
});

export const askAssetQuestionInputSchema = z.object({
  question: z.string().trim().min(3).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().trim().min(1).max(4000),
      }),
    )
    .max(12)
    .default([]),
});

export const assetAnswerFeedbackInputSchema = z.object({
  auditId: idSchema,
  value: z.enum(["util", "nao_util"]),
  comment: z.string().trim().max(1000).nullable().optional(),
});

export const adminAssetQuestionAuditSchema = z.object({
  id: idSchema,
  organizationName: z.string().min(1),
  channel: assetQuestionChannelSchema,
  question: z.string().min(1),
  answer: z.string(),
  status: z.enum(["respondida", "insuficiente", "erro"]),
  sourceTitles: z.array(z.string()),
  feedback: z.enum(["util", "nao_util"]).nullable(),
  feedbackComment: z.string().nullable(),
  provider: z.string().nullable(),
  latencyMs: z.number().int().nullable(),
  createdAt: isoDateTimeSchema,
});

export type ManagementAssetType = z.infer<typeof managementAssetTypeSchema>;
export type EditableManagementAssetType = z.infer<
  typeof editableManagementAssetTypeSchema
>;
export type ManagementAssetStatus = z.infer<typeof managementAssetStatusSchema>;
export type ManagementAssetVersionStatus = z.infer<
  typeof managementAssetVersionStatusSchema
>;
export type ManagementAssetAuthor = z.infer<
  typeof managementAssetAuthorSchema
>;
export type ManagementAsset = z.infer<typeof managementAssetSchema>;
export type ManagementAssetDocument = z.infer<
  typeof managementAssetDocumentSchema
>;
export type LegacySopContentBlock = z.infer<typeof legacySopContentBlockSchema>;
export type LegacySopSection = z.infer<typeof legacySopSectionSchema>;
export type LegacySopDocumentContent = z.infer<
  typeof legacySopDocumentContentSchema
>;
export type AdminManagementAssetListItem = z.infer<
  typeof adminManagementAssetListItemSchema
>;
export type AdminManagementAssetVersion = z.infer<
  typeof adminManagementAssetVersionSchema
>;
export type AdminManagementAssetDetail = z.infer<
  typeof adminManagementAssetDetailSchema
>;
export type CreateManagementAssetInput = z.infer<
  typeof createManagementAssetInputSchema
>;
export type UpdateManagementAssetInput = z.infer<
  typeof updateManagementAssetInputSchema
>;
export type ManagementAssetTransition =
  (typeof managementAssetTransitionValues)[number];
export type AssetQuestionChannel = z.infer<typeof assetQuestionChannelSchema>;
export type AssetQuestionCitation = z.infer<
  typeof assetQuestionCitationSchema
>;
export type AssetQuestionAnswer = z.infer<typeof assetQuestionAnswerSchema>;
export type AssetAnswerFeedbackInput = z.infer<
  typeof assetAnswerFeedbackInputSchema
>;
export type AdminAssetQuestionAudit = z.infer<
  typeof adminAssetQuestionAuditSchema
>;
