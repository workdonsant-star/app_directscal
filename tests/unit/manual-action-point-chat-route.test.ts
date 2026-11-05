import { expect, it, vi } from "vitest";
import type { SlackDeliveryJob } from "@/lib/contracts/slack-delivery";

vi.mock("server-only", () => ({}));
const seen = vi.hoisted(() => ({ filters: [] as Array<[string, unknown]>, writes: [] as string[] }));
vi.mock("@/lib/supabase/server", () => {
  const from = (table: string) => {
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => { seen.filters.push([key, value]); return query; },
      in: () => query,
      order: () => query,
      limit: async () => ({ data: [{ heading_path: "Decisões", content: "Registre decisor e prazo." }], error: null }),
      maybeSingle: async () => ({ error: null, data: table === "manual_action_point_followups"
        ? { id: "cycle-a", action_point_id: "point-a", organization_id: "org-a", asset_version_id: "version-a", title: "Matriz de decisão", action: "Revisar decisões", message_ts: "100.000", question: "O que foi feito?" }
        : table === "manual_action_point_reports" ? null
        : table === "admin_company_action_points" ? { asset_id: "asset-a", asset_version_id: "version-a", action: "Revisar decisões", reason: "Evitar atrasos", continuity: "Preservar alçadas" }
        : table === "management_assets" ? { id: "asset-a", title: "Matriz publicada", status: "publicado", archived_at: null, current_published_version_id: "version-a" }
        : table === "management_asset_versions" ? { version_number: "2", review_status: "publicado", content: null } : null }),
      insert: () => { seen.writes.push(table); return query; },
      update: () => { seen.writes.push(table); return query; },
    };
    return query;
  };
  return { createSupabaseAdminClient: () => ({ schema: () => ({ from }), from }) };
});
vi.mock("@/lib/integrations/slack", () => ({
  getSlackWorkspaceUser: vi.fn().mockResolvedValue({ userId: "U1", name: "Pessoa fictícia", avatarUrl: null }),
  getSlackBotUserId: vi.fn().mockResolvedValue("B1"),
  fetchSlackActionPointThread: vi.fn().mockResolvedValue([{ ts: "110.000", user: "U1", text: "Não entendi o prazo" }]),
}));
vi.mock("@/lib/agent/follow-up/manual-follow-up-provider", () => ({ extractManualFollowupReport: vi.fn().mockResolvedValue({ status: "duvida", summary: "Perguntou o que fazer", evidence: null, followUpQuestion: null, supportingQuote: null }) }));
vi.mock("@/lib/agent/follow-up/manual-follow-up-chat", () => ({ answerManualFollowupQuestion: vi.fn().mockResolvedValue("Revise as decisões abertas.\n\nFonte: Action Point") }));
vi.mock("@/lib/data/admin-company-action-points", () => ({ AdminCompanyActionPointError: class extends Error {} }));
vi.mock("@/lib/data/admin-adherence-data-source", () => ({ routineOrganizationId: vi.fn() }));

import { prepareManualActionPointReply } from "@/lib/data/manual-action-point-followups";
import { answerManualFollowupQuestion } from "@/lib/agent/follow-up/manual-follow-up-chat";
import { extractManualFollowupReport } from "@/lib/agent/follow-up/manual-follow-up-provider";
import { isManualFollowupQuestion } from "@/lib/agent/follow-up/manual-follow-up";

it("responde à pergunta explícita mesmo se o classificador de relatos estiver indisponível", async () => {
  seen.filters = []; seen.writes = [];
  vi.mocked(extractManualFollowupReport).mockRejectedValueOnce(new Error("Modelo indisponível"));
  const job = { id: "job-a", question: { kind: "direct", teamId: "T1", userId: "U1", channel: "D1", ts: "123.456", threadTs: "100.000", text: "O que eu deveria fazer mesmo?" } } as SlackDeliveryJob;
  const installation = { teamId: "T1", organizationId: "org-a", botToken: "ficticio", botUserId: "B1" };
  const reply = await prepareManualActionPointReply(job, installation);
  expect(reply?.text).toContain("Revise as decisões abertas");
  expect(answerManualFollowupQuestion).toHaveBeenCalledWith(expect.objectContaining({
    question: "O que eu deveria fazer mesmo?", reason: "Evitar atrasos", assetVersion: "2",
    history: [{ role: "user", text: "Não entendi o prazo" }],
  }));
  expect(seen.filters).toEqual(expect.arrayContaining([["organization_id", "org-a"], ["asset_id", "asset-a"], ["version_id", "version-a"]]));
  expect(seen.writes).toEqual([]);
  expect(extractManualFollowupReport).not.toHaveBeenCalled();
});

it("distingue perguntas diretas de relatos de execução", () => {
  expect(isManualFollowupQuestion("O que eu deveria fazer mesmo?")).toBe(true);
  expect(isManualFollowupQuestion("Como acompanho as decisões abertas")).toBe(true);
  expect(isManualFollowupQuestion("Eu já fiz tudo")).toBe(false);
  expect(isManualFollowupQuestion("Conferi as decisões, mas faltou registrar o prazo")).toBe(false);
});
