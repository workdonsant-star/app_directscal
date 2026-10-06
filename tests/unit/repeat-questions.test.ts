import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { normalizeQuestion } from "@/lib/agent/repeat-questions";

describe("normalizeQuestion", () => {
  it("ignores case, accents and punctuation", () => {
    expect(normalizeQuestion("Como peço FÉRIAS?")).toBe(normalizeQuestion("como peco ferias"));
    expect(normalizeQuestion("  Quem aprova   compras?! ")).toBe("quem aprova compras");
  });

  it("keeps different questions apart", () => {
    expect(normalizeQuestion("Como peço férias?")).not.toBe(normalizeQuestion("Como peço reembolso?"));
  });
});
