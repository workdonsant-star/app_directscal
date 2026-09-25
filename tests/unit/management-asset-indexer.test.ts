import { describe, expect, it } from "vitest";

import { buildManagementAssetChunks } from "@/lib/data/management-asset-indexer";
import type { ManagementSopDocument } from "@/lib/types";

const sop = {
  id: "sop-exemplo",
  organizationId: "org-exemplo",
  type: "sop",
  title: "SOP de exemplo",
  summary: "Resumo do SOP.",
  category: "Operação",
  author: { name: "DirectScal", role: "Especialista" },
  publishedAt: "2026-09-25T12:00:00.000Z",
  updatedAt: "2026-09-25T12:00:00.000Z",
  document: {
    version: "1.0",
    operationalOwner: "DirectScal",
    reviewCycle: "Semestral",
    sections: [
      {
        id: "objetivo",
        title: "Objetivo",
        blocks: [
          { type: "paragraph", text: "Explicar o objetivo do procedimento." },
        ],
      },
      {
        id: "matriz",
        title: "Matriz RACI",
        blocks: [
          {
            type: "table",
            columns: ["Atividade", "Responsável"],
            rows: [["Revisar o documento", "Líder da área"]],
          },
        ],
      },
    ],
  },
} satisfies ManagementSopDocument;

describe("management asset indexer", () => {
  it("preserves section headings and table content in searchable chunks", () => {
    const chunks = buildManagementAssetChunks(sop);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toMatchObject({
      ordinal: 0,
      headingPath: "Objetivo",
      content: "Explicar o objetivo do procedimento.",
    });
    expect(chunks[1]).toMatchObject({
      ordinal: 1,
      headingPath: "Matriz RACI",
      content: "Atividade | Responsável Revisar o documento | Líder da área",
    });
    expect(chunks.every((chunk) => chunk.tokenCount > 0)).toBe(true);
  });

  it("splits long sections without losing ordered chunks", () => {
    const longSop = {
      ...sop,
      document: {
        ...sop.document,
        sections: [
          {
            id: "procedimento",
            title: "Procedimento",
            blocks: [
              {
                type: "paragraph" as const,
                text: Array.from({ length: 80 }, (_, index) => `Etapa ${index + 1}`).join(" "),
              },
            ],
          },
        ],
      },
    } satisfies ManagementSopDocument;

    const chunks = buildManagementAssetChunks(longSop, {
      chunkSize: 100,
      overlap: 20,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map((chunk) => chunk.ordinal)).toEqual(
      chunks.map((_, index) => index),
    );
    expect(chunks.every((chunk) => chunk.headingPath === "Procedimento")).toBe(
      true,
    );
  });
});
