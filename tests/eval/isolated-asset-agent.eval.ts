import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { answerAssetQuestion } from "@/lib/agent/asset-question-service";
import { getAnswerProviderConfig, getEmbeddingModelKey } from "@/lib/agent/config";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createManagementAsset, transitionManagementAsset } from "@/lib/data/management-assets-admin-data-source";
import { managementAssetTemplates } from "@/lib/data/management-asset-templates";
import { assetAgentQuestions } from "./asset-agent-questions";
import { gradeAssetAnswer } from "./asset-agent-grader";

// Exclusivamente empresas e documentos fictícios novos. Nunca reutiliza tenant.
describe.runIf(process.env.ASSET_EVAL_ISOLATED === "true")("avaliação isolada com limpeza", () => {
 it("publica, consulta, verifica outra empresa e remove as fixtures", async () => {
  const client = createSupabaseAdminClient();
  const organizationId = randomUUID(), otherId = randomUUID(), actorId = randomUUID();
  const marker = { organizationId, otherId, actorId };
  writeFileSync("/tmp/directscal-agent-eval-fixtures.json", JSON.stringify(marker));
  const check = (error: unknown) => { if (error) throw error; };
  const results: Array<{id: string; ok: boolean; status: string; answer: string; sources: string[]}> = [];
  try {
   check((await client.schema("next_auth").from("users").insert({ id: actorId, name: "Operação de avaliação fictícia", email: `${actorId}@fixture.invalid` })).error);
   check((await client.from("organizations").insert([{ id: organizationId, name: "Fixture avaliação do agente" }, { id: otherId, name: "Fixture isolamento do agente" }])).error);
   check((await client.from("organization_members").insert({ organization_id: organizationId, user_id: actorId, role: "superadmin" })).error);
   for (const template of managementAssetTemplates.filter(item => item.type === "sop" && item.title)) {
    const id = await createManagementAsset(actorId, { organizationId, type: "sop", title: template.title!, summary: template.summary!, category: template.category ?? "Operação", ownerLabel: template.ownerLabel ?? "Fixture", reviewCycle: template.reviewCycle ?? "Semestral", specialistId: null, templateId: template.id });
    await transitionManagementAsset(actorId, id, "enviar_para_revisao");
    await transitionManagementAsset(actorId, id, "aprovar_revisao");
    const publication = await transitionManagementAsset(actorId, id, "publicar");
    console.log(`Fixture publicada: ${template.title} · ${publication.notice}`);
   }
   let next = 0;
   const evaluateNext = async () => {
    for (;;) {
     const question = assetAgentQuestions[next++]; if (!question) return;
     const answer = await answerAssetQuestion({ organizationId, question: question.question, channel: "app", skipAudit: true });
     const result = { id: question.id, ok: gradeAssetAnswer(question, answer), status: answer.status, answer: answer.answer, sources: answer.citations.map(item => item.title) };
     results.push(result);
     writeFileSync("/tmp/directscal-agent-eval-report.json", JSON.stringify({ complete: false, benchmark: "2026-10-20-v3", provider: getAnswerProviderConfig(), embeddings: getEmbeddingModelKey(), total: assetAgentQuestions.length, completed: results.length, results }, null, 2));
     console.log(`${result.id}: ${result.ok ? "ok" : "revisar"}`);
    }
   };
   await Promise.all([evaluateNext(), evaluateNext()]);
   const other = await answerAssetQuestion({ organizationId: otherId, question: "Até quando o fechamento financeiro do mês precisa estar concluído?", channel: "app", skipAudit: true });
   expect(other.status).toBe("insufficient_evidence"); expect(other.citations).toEqual([]);
   const accuracy = results.filter(result => result.ok).length / results.length;
   const report = { complete: true, benchmark: "2026-10-20-v3", provider: getAnswerProviderConfig(), embeddings: getEmbeddingModelKey(), accuracy, total: results.length, passed: results.filter(result => result.ok).length, results, isolated: true };
   writeFileSync("/tmp/directscal-agent-eval-report.json", JSON.stringify(report, null, 2));
   console.log(`Avaliação: ${report.passed}/${report.total} (${(accuracy * 100).toFixed(1)}%). Relatório fictício em /tmp/directscal-agent-eval-report.json`);
   expect(accuracy).toBeGreaterThanOrEqual(0.85);
  } finally {
   // FKs removem versões/escopos/índice somente dessas organizações recém-criadas.
   check((await client.from("management_assets").delete().eq("organization_id", organizationId)).error);
   check((await client.from("organization_members").delete().eq("user_id", actorId)).error);
   check((await client.from("organizations").delete().in("id", [organizationId, otherId])).error);
   check((await client.schema("next_auth").from("users").delete().eq("id", actorId)).error);
   const { count, error } = await client.from("organizations").select("id", { count: "exact", head: true }).in("id", [organizationId, otherId]); check(error); expect(count).toBe(0);
   console.log("Fixtures removidas e ausência conferida.");
  }
 }, 45 * 60 * 1000);
});
