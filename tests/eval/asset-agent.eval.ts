import { describe, expect, it } from "vitest";

import { answerAssetQuestion } from "@/lib/agent/asset-question-service";
import { getAnswerProviderConfig, getEmbeddingModelKey } from "@/lib/agent/config";
import type { AssetQuestionAnswer } from "@/lib/contracts";

import { assetAgentQuestions, type EvalQuestion } from "./asset-agent-questions";

// Mede respostas corretas ou corretamente recusadas contra a meta do piloto
// (85%) e confirma que outra empresa não recebe trechos da empresa de teste.
const organizationId = process.env.ASSET_EVAL_ORGANIZATION_ID;
const otherOrganizationId = process.env.ASSET_EVAL_OTHER_ORGANIZATION_ID;
const TARGET = 0.85;

function grade(question: EvalQuestion, answer: AssetQuestionAnswer) {
  const citedTitles = new Set(answer.citations.map((citation) => citation.title));
  const citesExpected =
    question.expect.type !== "refuse" &&
    question.expect.assets.some((title) => citedTitles.has(title));
  const refused = answer.status === "insufficient_evidence";

  switch (question.expect.type) {
    case "answer":
      return answer.status === "answered" && citesExpected;
    case "answer_or_refuse":
      return refused || (answer.status === "answered" && citesExpected);
    case "refuse":
      return refused;
  }
}

describe.runIf(Boolean(organizationId))("agente de consulta", () => {
  it(`acerta ao menos ${TARGET * 100}% do conjunto de avaliação`, async () => {
    const results: Array<{
      question: EvalQuestion;
      answer: AssetQuestionAnswer;
      ok: boolean;
      ms: number;
    }> = [];

    for (const question of assetAgentQuestions) {
      const startedAt = Date.now();
      const answer = await answerAssetQuestion({
        organizationId: organizationId!,
        question: question.question,
        channel: "app",
        skipAudit: true,
      });

      results.push({ question, answer, ok: grade(question, answer), ms: Date.now() - startedAt });
    }

    const accuracy = results.filter((result) => result.ok).length / results.length;
    const byKind = new Map<string, { ok: number; total: number }>();

    for (const result of results) {
      const entry = byKind.get(result.question.kind) ?? { ok: 0, total: 0 };
      entry.total += 1;
      if (result.ok) entry.ok += 1;
      byKind.set(result.question.kind, entry);
    }

    const latencies = results.map((result) => result.ms).sort((a, b) => a - b);
    const { provider, model } = getAnswerProviderConfig();

    console.log(
      [
        `Provedor: ${provider}${model ? ` (${model})` : ""} · embeddings: ${getEmbeddingModelKey() ?? "desligados"}`,
        `Acerto geral: ${(accuracy * 100).toFixed(1)}% (${results.filter((result) => result.ok).length}/${results.length})`,
        ...Array.from(byKind.entries()).map(
          ([kind, entry]) => `  ${kind}: ${entry.ok}/${entry.total}`,
        ),
        `Latência mediana: ${latencies[Math.floor(latencies.length / 2)]} ms`,
        "Falhas:",
        ...results
          .filter((result) => !result.ok)
          .map(
            (result) =>
              `  [${result.question.id}] ${result.question.question}\n    → ${result.answer.status}: ${result.answer.answer.slice(0, 160)}\n    fontes: ${result.answer.citations.map((citation) => citation.title).join(", ") || "nenhuma"}`,
          ),
      ].join("\n"),
    );

    expect(accuracy).toBeGreaterThanOrEqual(TARGET);
  });

  it.runIf(Boolean(otherOrganizationId))(
    "não recupera trechos da empresa de teste para outra empresa",
    async () => {
      const answer = await answerAssetQuestion({
        organizationId: otherOrganizationId!,
        question: "Até quando o fechamento financeiro do mês precisa estar concluído?",
        channel: "app",
        skipAudit: true,
      });
      const leaked = answer.citations.filter(
        (citation) => citation.title === "Fechamento financeiro mensal",
      );

      expect(leaked).toEqual([]);
    },
  );
});
