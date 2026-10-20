import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({createSupabaseAdminClient: vi.fn()}));
vi.mock("@/lib/agent/answer-providers", () => ({generateGroundedAnswer: vi.fn()}));
vi.mock("@/lib/agent/embeddings", () => ({embedTexts: vi.fn(), toPgVector: vi.fn()}));
import { needsQuestionContext } from "@/lib/agent/answer-policy";
import { answerAssetQuestion } from "@/lib/agent/asset-question-service";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { generateGroundedAnswer } from "@/lib/agent/answer-providers";
describe("pergunta sem processo não inventa aprovador", () => {
 it("pede contexto sem buscar fonte aleatória ou chamar modelo", async () => {
  for (const question of ["Quem aprova?", "QUAL É O PRAZO?", "Quem é o responsável?"]) {
   const answer = await answerAssetQuestion({organizationId: "fixture", question, channel: "app", skipAudit: true});
   expect(answer.status).toBe("insufficient_evidence"); expect(answer.citations).toEqual([]); expect(answer.answer).toContain("qual processo");
  }
  expect(createSupabaseAdminClient).not.toHaveBeenCalled(); expect(generateGroundedAnswer).not.toHaveBeenCalled();
 });
 it("preserva pergunta específica e continuação com contexto", () => {
  expect(needsQuestionContext("Quem aprova a campanha?", [])).toBe(false);
  expect(needsQuestionContext("Qual é o prazo?", [{role: "user", text: "Como fazer o fechamento financeiro mensal?"}])).toBe(false);
 });
});
