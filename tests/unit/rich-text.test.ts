import { describe, expect, it } from "vitest";

import { richTextDocumentSchema } from "@/lib/contracts";
import {
  getRichTextOutline,
  isRichTextEmpty,
  legacySopContentToRichText,
  parseStoredAssetContent,
} from "@/lib/data/rich-text";
import { managementAssetTemplates } from "@/lib/data/management-asset-templates";

import tiptapOutput from "./fixtures/tiptap-editor-output.json";

describe("rich text contract", () => {
  it("accepts editor output and drops editor-only attributes", () => {
    const parsed = richTextDocumentSchema.parse({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2, id: null }, content: [{ type: "text", text: "Objetivo" }] },
        {
          type: "orderedList",
          attrs: { start: 1, type: null },
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Ver política",
                      marks: [
                        { type: "bold" },
                        {
                          type: "link",
                          attrs: { href: "https://example.com", target: "_blank", rel: "noopener", class: null },
                        },
                      ],
                    },
                  ],
                },
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
                {
                  type: "tableCell",
                  attrs: { colspan: 1, rowspan: 1, colwidth: null },
                  content: [{ type: "paragraph" }],
                },
              ],
            },
          ],
        },
      ],
    });

    expect(parsed.content[1]).toEqual({
      type: "orderedList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Ver política",
                  marks: [{ type: "bold" }, { type: "link", attrs: { href: "https://example.com" } }],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(parsed.content[2]).toEqual({
      type: "table",
      content: [
        { type: "tableRow", content: [{ type: "tableCell", content: [{ type: "paragraph" }] }] },
      ],
    });
  });

  it("accepts a document captured from the real Tiptap editor", () => {
    const parsed = richTextDocumentSchema.safeParse(tiptapOutput);

    expect(parsed.success).toBe(true);
    expect(parsed.data?.content).toHaveLength(tiptapOutput.content.length);
  });

  it("rejects unsupported nodes and unsafe links", () => {
    expect(
      richTextDocumentSchema.safeParse({
        type: "doc",
        content: [{ type: "heading", attrs: { level: 1 }, content: [] }],
      }).success,
    ).toBe(false);
    expect(
      richTextDocumentSchema.safeParse({
        type: "doc",
        content: [{ type: "codeBlock", content: [{ type: "text", text: "x" }] }],
      }).success,
    ).toBe(false);
    expect(
      richTextDocumentSchema.safeParse({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "clique", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("rich text helpers", () => {
  it("builds unique anchors for repeated headings", () => {
    const doc = richTextDocumentSchema.parse({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Critério de pronto" }] },
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Exceções" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Critério de pronto" }] },
      ],
    });

    expect(getRichTextOutline(doc)).toEqual([
      { id: "criterio-de-pronto", label: "Critério de pronto", level: 2 },
      { id: "excecoes", label: "Exceções", level: 3 },
      { id: "criterio-de-pronto-2", label: "Critério de pronto", level: 2 },
    ]);
  });

  it("converts every starting template into valid editor content", () => {
    for (const template of managementAssetTemplates) {
      const doc = legacySopContentToRichText(template.content);

      expect(richTextDocumentSchema.safeParse(doc).success).toBe(true);
      expect(isRichTextEmpty(doc)).toBe(false);
    }
  });

  it("reads legacy block content stored before the editor", () => {
    const doc = parseStoredAssetContent({
      version: "1.0",
      sections: [{ id: "a", title: "Objetivo", blocks: [{ type: "paragraph", text: "Texto." }] }],
    });

    expect(doc?.content[0]).toMatchObject({ type: "heading", attrs: { level: 2 } });
    expect(parseStoredAssetContent({ foo: "bar" })).toBeNull();
  });
});
