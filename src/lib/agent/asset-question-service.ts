import "server-only";

import {
  buildExtractiveAnswer,
  buildRetrievalQuery,
  type ConversationTurn,
  INSUFFICIENT_EVIDENCE_ANSWER,
  resolveGroundedAnswer,
  selectEvidence,
  type ResolvedAnswer,
  type RetrievedChunk,
} from "@/lib/agent/answer-policy";
import { generateGroundedAnswer } from "@/lib/agent/answer-providers";
import { getAnswerProviderConfig } from "@/lib/agent/config";
import { embedTexts, toPgVector } from "@/lib/agent/embeddings";
import {
  assetQuestionAnswerSchema,
  type AssetQuestionAnswer,
  type AssetQuestionChannel,
} from "@/lib/contracts";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

const SEARCH_LIMIT = 8;

export async function searchPublishedAssetChunks(
  organizationId: string,
  question: string,
): Promise<RetrievedChunk[]> {
  let queryEmbedding: string | null = null;
  let queryEmbeddingModel: string | null = null;

  try {
    const embedding = await embedTexts([question], "query");

    if (embedding) {
      queryEmbedding = toPgVector(embedding.vectors[0]);
      queryEmbeddingModel = embedding.modelKey;
    }
  } catch (error) {
    // Sem embedding da pergunta, a busca textual continua funcionando.
    console.error("[asset-agent] query embedding failed", error);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc(
    "search_management_asset_chunks_for_organization",
    {
      query_text: question,
      target_organization_id: organizationId,
      result_limit: SEARCH_LIMIT,
      query_embedding: queryEmbedding,
      query_embedding_model: queryEmbeddingModel,
    },
  );

  if (error) throw error;

  return data
    .filter((row) => row.asset_type !== null)
    .map((row) => ({
      chunkId: row.chunk_id,
      assetId: row.asset_id,
      versionId: row.version_id,
      assetType: row.asset_type as RetrievedChunk["assetType"],
      title: row.title,
      headingPath: row.heading_path,
      content: row.content,
      versionNumber: row.version_number,
      publishedAt: new Date(row.published_at).toISOString(),
      textRank: row.text_rank,
      vectorSimilarity: row.vector_similarity,
      score: row.score,
    }));
}

async function recordAudit(input: {
  organizationId: string;
  userId: string | null;
  externalUserId: string | null;
  channel: AssetQuestionChannel;
  question: string;
  answer: string;
  answerStatus: "respondida" | "insuficiente" | "erro";
  confidence: string;
  citations: ResolvedAnswer["citations"];
  provider: string;
  model: string | null;
  latencyMs: number;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("asset_question_audits")
    .insert({
      organization_id: input.organizationId,
      user_id: input.userId,
      external_user_id: input.externalUserId,
      channel: input.channel,
      question: input.question.slice(0, 2000),
      answer: input.answer,
      answer_status: input.answerStatus,
      confidence: input.confidence,
      source_version_ids: Array.from(
        new Set(input.citations.map((citation) => citation.versionId)),
      ),
      citations: input.citations as unknown as Json,
      provider: input.provider,
      model: input.model,
      latency_ms: input.latencyMs,
    })
    .select("id")
    .single();

  if (error) {
    // A resposta ainda chega à pessoa; a falha fica visível nos logs.
    console.error("[asset-agent] audit insert failed", error);
    return null;
  }

  return data.id;
}

export async function answerAssetQuestion(input: {
  organizationId: string;
  question: string;
  channel: AssetQuestionChannel;
  userId?: string | null;
  externalUserId?: string | null;
  // Turnos anteriores da mesma conversa (thread do Slack ou tela do app).
  history?: ConversationTurn[];
  // A avaliação offline não grava auditoria para não poluir o painel de lacunas.
  skipAudit?: boolean;
}): Promise<AssetQuestionAnswer> {
  const startedAt = Date.now();
  const question = input.question.trim().replace(/\s+/g, " ");
  const { provider, model } = getAnswerProviderConfig();
  let resolved: ResolvedAnswer;
  let failed = false;
  const history = input.history ?? [];

  try {
    const evidence = selectEvidence(
      await searchPublishedAssetChunks(
        input.organizationId,
        buildRetrievalQuery(question, history),
      ),
    );

    if (evidence.length === 0) {
      resolved = {
        status: "insufficient_evidence",
        answer: INSUFFICIENT_EVIDENCE_ANSWER,
        confidence: "insuficiente",
        citations: [],
        refusalReason: "Nenhum trecho publicado corresponde à pergunta.",
      };
    } else if (provider === "extractive" || !model) {
      resolved = buildExtractiveAnswer(evidence);
    } else {
      resolved = resolveGroundedAnswer(
        await generateGroundedAnswer(provider, model, question, evidence, history),
        evidence,
      );
    }
  } catch (error) {
    console.error("[asset-agent] answer failed", error);
    failed = true;
    resolved = {
      status: "insufficient_evidence",
      answer:
        "Não consegui consultar os ativos publicados agora. Tente novamente em alguns instantes.",
      confidence: "insuficiente",
      citations: [],
      refusalReason: "Falha técnica na consulta.",
    };
  }

  const auditId = input.skipAudit
    ? null
    : await recordAudit({
        organizationId: input.organizationId,
        userId: input.userId ?? null,
        externalUserId: input.externalUserId ?? null,
        channel: input.channel,
        question,
        answer: resolved.answer,
        answerStatus: failed
          ? "erro"
          : resolved.status === "answered"
            ? "respondida"
            : "insuficiente",
        confidence: resolved.confidence,
        citations: resolved.citations,
        provider,
        model,
        latencyMs: Date.now() - startedAt,
      });

  return assetQuestionAnswerSchema.parse({
    auditId,
    status: failed ? "error" : resolved.status,
    answer: resolved.answer,
    confidence: resolved.confidence,
    citations: resolved.citations,
    ...(resolved.refusalReason
      ? { refusalReason: resolved.refusalReason }
      : {}),
  });
}

export async function recordAssetAnswerFeedback(input: {
  auditId: string;
  organizationId: string;
  value: "util" | "nao_util";
  comment?: string | null;
  userId?: string | null;
  externalUserId?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: audit, error: auditError } = await supabase
    .from("asset_question_audits")
    .select("id,organization_id,user_id,external_user_id")
    .eq("id", input.auditId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (auditError) throw auditError;

  const ownsAudit =
    audit &&
    ((input.userId && audit.user_id === input.userId) ||
      (input.externalUserId &&
        audit.external_user_id === input.externalUserId));

  if (!ownsAudit) return false;

  const identity = input.userId
    ? { column: "user_id" as const, value: input.userId }
    : {
        column: "external_user_id" as const,
        value: input.externalUserId ?? "",
      };

  const { error: deleteError } = await supabase
    .from("asset_answer_feedback")
    .delete()
    .eq("question_audit_id", input.auditId)
    .eq(identity.column, identity.value);

  if (deleteError) throw deleteError;

  const { error } = await supabase.from("asset_answer_feedback").insert({
    question_audit_id: input.auditId,
    organization_id: input.organizationId,
    user_id: input.userId ?? null,
    external_user_id: input.userId ? null : (input.externalUserId ?? null),
    value: input.value,
    comment: input.comment?.trim() || null,
  });

  if (error) throw error;

  return true;
}
