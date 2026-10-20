import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/data/agent-operations-data-source", () => ({requireAgentOperator: vi.fn()}));
vi.mock("@/lib/supabase/server", () => ({createSupabaseAdminClient: vi.fn()}));
vi.mock("@/lib/agent/embeddings", () => ({embedTexts: vi.fn(), toPgVector: vi.fn()}));
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { listAdminAssetQuestionAudits } from "@/lib/data/management-assets-admin-data-source";
const org = "00000000-0000-4000-8000-000000000001";
it("conserva lacuna depois da página 500 com cursor preciso e escopo da empresa", async () => {
 const rows = Array.from({length: 501}, (_, index) => ({id: `00000000-0000-4000-8000-${String(9999-index).padStart(12,"0")}`, organization_id: org, channel: "app", question: "Pergunta", answer: "Resposta", answer_status: index===500 ? "insuficiente" : "respondida", citations: [], provider: null, latency_ms: null, created_at: "2026-10-20T12:00:00.123456Z"}));
 const eq = vi.fn(), or = vi.fn(); let auditPage = 0;
 vi.mocked(createSupabaseAdminClient).mockReturnValue({from: (table: string) => {
  const data = table === "asset_question_audits" ? (auditPage++ === 0 ? rows.slice(0,500) : rows.slice(500)) : table === "organizations" ? [{id: org, name: "Fixture"}] : [];
  const chain: Record<string, unknown> = {};
  for (const method of ["select","order","in","limit"]) chain[method] = () => chain;
  chain.eq = (...args: unknown[]) => {eq(...args);return chain;}; chain.or = (...args: unknown[]) => {or(...args);return chain;};
  chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve({data,error:null}).then(resolve);
  return chain;
 }} as unknown as ReturnType<typeof createSupabaseAdminClient>);
 const gaps = await listAdminAssetQuestionAudits({onlyGaps:true,organizationId:org});
 expect(gaps).toHaveLength(1);expect(gaps[0].id).toBe(rows[500].id);
 expect(or).toHaveBeenCalledWith(`created_at.lt.${rows[499].created_at},and(created_at.eq.${rows[499].created_at},id.lt.${rows[499].id})`);
 expect(eq).toHaveBeenCalledWith("organization_id",org);
});
