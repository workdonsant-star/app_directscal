import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn com tokens tipográficos", () => {
  it("preserva o tamanho ao lado de uma cor de texto", () => {
    expect(cn("text-ui-label text-muted-foreground")).toBe("text-ui-label text-muted-foreground");
    expect(cn("text-doc-body", "text-foreground")).toBe("text-doc-body text-foreground");
  });

  it("substitui tamanho e família do primitive pelos do consumidor", () => {
    expect(cn("font-heading text-ui-title", "font-label text-ui-label")).toBe("font-label text-ui-label");
  });

  it("não confunde família com peso", () => {
    expect(cn("font-bold", "font-label")).toBe("font-bold font-label");
  });
});
