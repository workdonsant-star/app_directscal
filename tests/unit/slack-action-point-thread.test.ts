import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));

import { fetchSlackActionPointThread } from "@/lib/integrations/slack";

afterEach(() => vi.unstubAllGlobals());

describe("leitura contextual da thread do Action Point", () => {
  it("pagina somente a thread e exclui a mensagem atual pelo timestamp", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, messages: [{ ts: "100.000", text: "Pergunta" }], response_metadata: { next_cursor: "proxima" } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, messages: [{ ts: "110.000", text: "Resposta" }], response_metadata: { next_cursor: "" } }) });
    vi.stubGlobal("fetch", fetch);
    expect(await fetchSlackActionPointThread("token-ficticio", "D1", "100.000", "123.456")).toHaveLength(2);
    const urls = fetch.mock.calls.map(([url]) => new URL(url));
    expect(urls.map(url => url.pathname)).toEqual(["/api/conversations.replies", "/api/conversations.replies"]);
    expect(urls[0].searchParams.get("channel")).toBe("D1");
    expect(urls[0].searchParams.get("ts")).toBe("100.000");
    expect(urls[0].searchParams.get("latest")).toBe("123.456");
    expect(urls[1].searchParams.get("cursor")).toBe("proxima");
  });
});
