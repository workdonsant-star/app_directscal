import { describe, expect, it } from "vitest";

import type { RichTextDocument } from "@/lib/contracts";
import { buildManagementAssetChunks } from "@/lib/data/management-asset-indexer";

const text = (value: string) => [{ type: "text" as const, text: value }];

const content: RichTextDocument = {
  type: "doc",
  content: [
    { type: "paragraph", content: text("Abertura antes do primeiro título.") },
    { type: "heading", attrs: { level: 2 }, content: text("Objetivo") },
    { type: "paragraph", content: text("Explicar o objetivo do procedimento.") },
    { type: "heading", attrs: { level: 2 }, content: text("Alçadas") },
    { type: "heading", attrs: { level: 3 }, content: text("Descontos") },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: text("Acima de 15% exige o Diretor Comercial.") },
          ],
        },
      ],
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            { type: "tableHeader", content: [{ type: "paragraph", content: text("Atividade") }] },
            { type: "tableHeader", content: [{ type: "paragraph", content: text("Responsável") }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: text("Revisar") }] },
            { type: "tableCell", content: [{ type: "paragraph", content: text("Líder da área") }] },
          ],
        },
      ],
    },
  ],
};

describe("management asset indexer", () => {
  it("splits by H2 and H3 and keeps lists and tables searchable", () => {
    const chunks = buildManagementAssetChunks({ title: "Política comercial", content });

    expect(chunks.map((chunk) => chunk.headingPath)).toEqual([
      "Política comercial",
      "Objetivo",
      "Alçadas › Descontos",
    ]);
    expect(chunks[2].content).toBe(
      "• Acima de 15% exige o Diretor Comercial.\n\nAtividade | Responsável\nRevisar | Líder da área",
    );
    expect(chunks.map((chunk) => chunk.ordinal)).toEqual([0, 1, 2]);
    expect(chunks.every((chunk) => chunk.tokenCount > 0)).toBe(true);
  });

  it("splits long sections without losing ordered chunks", () => {
    const longContent: RichTextDocument = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: text("Procedimento") },
        {
          type: "paragraph",
          content: text(Array.from({ length: 80 }, (_, index) => `Etapa ${index + 1}`).join(" ")),
        },
      ],
    };

    const chunks = buildManagementAssetChunks(
      { title: "SOP", content: longContent },
      { chunkSize: 100, overlap: 20 },
    );

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map((chunk) => chunk.ordinal)).toEqual(chunks.map((_, index) => index));
    expect(chunks.every((chunk) => chunk.headingPath === "Procedimento")).toBe(true);
  });

  it("ignores headings without body text", () => {
    const chunks = buildManagementAssetChunks({
      title: "Vazio",
      content: {
        type: "doc",
        content: [{ type: "heading", attrs: { level: 2 }, content: text("Sem corpo") }],
      },
    });

    expect(chunks).toEqual([]);
  });
});
