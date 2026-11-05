import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/agent/follow-up/manual-follow-up-question-provider", () => ({ generateManualFollowupQuestion: vi.fn() }));
vi.mock("@/lib/data/agent-provider-data-source", () => ({ getActiveAgentProvider: vi.fn(), verifyAgentProvider: vi.fn() }));
vi.mock("@/lib/data/admin-adherence-data-source", () => ({ routineOrganizationId: vi.fn(() => "org-a") }));
vi.mock("@/lib/integrations/slack", () => ({
  getSlackBotTokenForOrganization: vi.fn(), getSlackWorkspaceUser: vi.fn(), openSlackDirectConversation: vi.fn(), postSlackMessage: vi.fn(),
  SlackDeliveryError: class extends Error { uncertain = false; code = "erro"; },
}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));

import { generateManualFollowupQuestion } from "@/lib/agent/follow-up/manual-follow-up-question-provider";
import { startManualActionPointFollowup } from "@/lib/data/manual-action-point-followups";
import { getActiveAgentProvider, verifyAgentProvider } from "@/lib/data/agent-provider-data-source";
import { getSlackBotTokenForOrganization, getSlackWorkspaceUser, openSlackDirectConversation, postSlackMessage } from "@/lib/integrations/slack";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const inserted = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  const point = { id: "point-a", organization_id: "org-a", asset_id: "asset-a", asset_version_id: "version-a", slack_team_id: "team-a", slack_user_id: "user-a", title: "Matriz de direitos de decisão", action: "Toda semana, revisar as decisões abertas." };
  const asset = { id: "asset-a", title: "Matriz", status: "publicado", archived_at: null, current_published_version_id: "version-a" };
  const from = (table: string) => {
    let mode = "select";
    const chain = {
      select: () => chain, eq: () => chain, in: () => chain, order: () => chain, limit: () => chain,
      maybeSingle: async () => ({ data: mode === "update" ? { id: "cycle-a" } : table === "admin_company_action_points" ? point : table === "management_assets" ? asset : null, error: null }),
      insert: (value: unknown) => { inserted(value); return { error: null }; },
      update: () => { mode = "update"; return chain; },
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: [{ question: "Pergunta anterior" }], error: null })),
    };
    return chain;
  };
  vi.mocked(createSupabaseAdminClient).mockReturnValue({ schema: () => ({ from }), from } as unknown as ReturnType<typeof createSupabaseAdminClient>);
  vi.mocked(getActiveAgentProvider).mockResolvedValue({ provider: "openai", model: "modelo-ficticio", apiKey: "chave-ficticia" } as Awaited<ReturnType<typeof getActiveAgentProvider>>);
  vi.mocked(verifyAgentProvider).mockResolvedValue(undefined);
  vi.mocked(getSlackBotTokenForOrganization).mockResolvedValue({ teamId: "team-a", botToken: "token" } as Awaited<ReturnType<typeof getSlackBotTokenForOrganization>>);
  vi.mocked(getSlackWorkspaceUser).mockResolvedValue({ userId: "user-a", name: "Mary Verguerio", avatarUrl: null });
  vi.mocked(openSlackDirectConversation).mockResolvedValue("D1");
  vi.mocked(postSlackMessage).mockResolvedValue({ channel: "D1", ts: "123.456" });
});

describe("envio da pergunta manual", () => {
  it("gera com o nome e histórico da mesma ação e persiste exatamente o texto enviado", async () => {
    vi.mocked(generateManualFollowupQuestion).mockResolvedValue("Mary, como está indo a manutenção da Matriz de direitos de decisão?");
    await startManualActionPointFollowup("org-a", "admin-a", "point-a");
    expect(generateManualFollowupQuestion).toHaveBeenCalledWith(expect.objectContaining({ provider: "openai" }), expect.objectContaining({ name: "Mary", title: "Matriz de direitos de decisão", previousQuestions: ["Pergunta anterior"] }));
    expect(inserted).toHaveBeenCalledWith(expect.objectContaining({ question: "Mary, como está indo a manutenção da Matriz de direitos de decisão?" }));
    expect(postSlackMessage).toHaveBeenCalledWith("token", expect.objectContaining({ text: "Mary, como está indo a manutenção da Matriz de direitos de decisão?" }));
  });

  it("não grava nem envia quando a geração falha", async () => {
    vi.mocked(generateManualFollowupQuestion).mockRejectedValue(new Error("falha do provedor"));
    await expect(startManualActionPointFollowup("org-a", "admin-a", "point-a")).rejects.toThrow("não conseguiu preparar a pergunta");
    expect(inserted).not.toHaveBeenCalled();
    expect(postSlackMessage).not.toHaveBeenCalled();
  });

  it("explica a indisponibilidade do Gemini sem enviar a pergunta", async () => {
    vi.mocked(generateManualFollowupQuestion).mockRejectedValue(new Error("O Gemini está temporariamente sobrecarregado. Nenhuma pergunta foi enviada. Tente novamente em alguns minutos."));
    await expect(startManualActionPointFollowup("org-a", "admin-a", "point-a")).rejects.toThrow("Gemini está temporariamente sobrecarregado");
    expect(inserted).not.toHaveBeenCalled();
    expect(postSlackMessage).not.toHaveBeenCalled();
  });
});
