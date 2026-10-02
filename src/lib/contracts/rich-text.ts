import { z } from "zod";

// Documento do editor (Tiptap/ProseMirror) restrito ao vocabulário editorial
// da Directscal. Qualquer nó ou marca fora desta lista é rejeitado na escrita,
// e a leitura renderiza apenas estes tipos, sem HTML livre.

export type RichTextMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "link"; attrs: { href: string } };

export type RichTextInline =
  | { type: "text"; text: string; marks?: RichTextMark[] }
  | { type: "hardBreak" };

export type RichTextParagraph = {
  type: "paragraph";
  content?: RichTextInline[];
};

export type RichTextHeading = {
  type: "heading";
  attrs: { level: 2 | 3 };
  content?: RichTextInline[];
};

export type RichTextListItem = {
  type: "listItem";
  content: Array<RichTextParagraph | RichTextList>;
};

export type RichTextList =
  | { type: "bulletList"; content: RichTextListItem[] }
  | {
      type: "orderedList";
      attrs?: { start?: number };
      content: RichTextListItem[];
    };

export type RichTextTableCell = {
  type: "tableCell" | "tableHeader";
  attrs?: { colspan?: number; rowspan?: number };
  content: RichTextParagraph[];
};

export type RichTextTable = {
  type: "table";
  content: Array<{ type: "tableRow"; content: RichTextTableCell[] }>;
};

export type RichTextBlockquote = {
  type: "blockquote";
  content: Array<RichTextParagraph | RichTextList>;
};

export type RichTextBlock =
  | RichTextParagraph
  | RichTextHeading
  | RichTextList
  | RichTextBlockquote
  | RichTextTable;

export type RichTextDocument = {
  type: "doc";
  content: RichTextBlock[];
};

const allowedLinkProtocol = /^(https?:\/\/|mailto:)/i;

const markSchema: z.ZodType<RichTextMark> = z.union([
  z.object({ type: z.literal("bold") }).transform(() => ({ type: "bold" as const })),
  z
    .object({ type: z.literal("italic") })
    .transform(() => ({ type: "italic" as const })),
  z
    .object({
      type: z.literal("link"),
      attrs: z.looseObject({
        href: z
          .string()
          .trim()
          .max(2000)
          .refine((value) => allowedLinkProtocol.test(value), {
            message: "Links aceitam apenas http, https ou mailto.",
          }),
      }),
    })
    .transform((mark) => ({
      type: "link" as const,
      attrs: { href: mark.attrs.href },
    })),
]);

const inlineSchema: z.ZodType<RichTextInline> = z.union([
  z
    .object({
      type: z.literal("text"),
      text: z.string().min(1).max(20000),
      marks: z.array(markSchema).max(3).optional(),
    })
    .transform((node) =>
      node.marks && node.marks.length > 0
        ? { type: "text" as const, text: node.text, marks: node.marks }
        : { type: "text" as const, text: node.text },
    ),
  z
    .object({ type: z.literal("hardBreak") })
    .transform(() => ({ type: "hardBreak" as const })),
]);

const paragraphSchema: z.ZodType<RichTextParagraph> = z
  .object({
    type: z.literal("paragraph"),
    content: z.array(inlineSchema).optional(),
  })
  .transform((node) =>
    node.content && node.content.length > 0
      ? { type: "paragraph" as const, content: node.content }
      : { type: "paragraph" as const },
  );

const headingSchema: z.ZodType<RichTextHeading> = z
  .object({
    type: z.literal("heading"),
    attrs: z.looseObject({ level: z.union([z.literal(2), z.literal(3)]) }),
    content: z.array(inlineSchema).optional(),
  })
  .transform((node) => ({
    type: "heading" as const,
    attrs: { level: node.attrs.level },
    ...(node.content && node.content.length > 0 ? { content: node.content } : {}),
  }));

const listSchema: z.ZodType<RichTextList> = z.lazy(() =>
  z.union([
    z
      .object({
        type: z.literal("bulletList"),
        content: z.array(listItemSchema).min(1),
      })
      .transform((node) => ({
        type: "bulletList" as const,
        content: node.content,
      })),
    z
      .object({
        type: z.literal("orderedList"),
        attrs: z
          .looseObject({ start: z.number().int().min(0).max(10000).optional() })
          .optional(),
        content: z.array(listItemSchema).min(1),
      })
      .transform((node) => ({
        type: "orderedList" as const,
        ...(node.attrs?.start && node.attrs.start !== 1
          ? { attrs: { start: node.attrs.start } }
          : {}),
        content: node.content,
      })),
  ]),
);

const listItemSchema: z.ZodType<RichTextListItem> = z.lazy(() =>
  z
    .object({
      type: z.literal("listItem"),
      content: z.array(z.union([paragraphSchema, listSchema])).min(1),
    })
    .transform((node) => ({ type: "listItem" as const, content: node.content })),
);

const tableCellSchema: z.ZodType<RichTextTableCell> = z
  .object({
    type: z.union([z.literal("tableCell"), z.literal("tableHeader")]),
    attrs: z
      .looseObject({
        colspan: z.number().int().min(1).max(20).optional(),
        rowspan: z.number().int().min(1).max(50).optional(),
      })
      .optional(),
    content: z.array(paragraphSchema).min(1),
  })
  .transform((node) => {
    const colspan = node.attrs?.colspan ?? 1;
    const rowspan = node.attrs?.rowspan ?? 1;

    return {
      type: node.type,
      ...(colspan !== 1 || rowspan !== 1 ? { attrs: { colspan, rowspan } } : {}),
      content: node.content,
    };
  });

const tableSchema: z.ZodType<RichTextTable> = z
  .object({
    type: z.literal("table"),
    content: z
      .array(
        z.object({
          type: z.literal("tableRow"),
          content: z.array(tableCellSchema).min(1).max(20),
        }),
      )
      .min(1)
      .max(200),
  })
  .transform((node) => ({
    type: "table" as const,
    content: node.content.map((row) => ({
      type: "tableRow" as const,
      content: row.content,
    })),
  }));

const blockquoteSchema: z.ZodType<RichTextBlockquote> = z
  .object({
    type: z.literal("blockquote"),
    content: z.array(z.union([paragraphSchema, listSchema])).min(1),
  })
  .transform((node) => ({ type: "blockquote" as const, content: node.content }));

const blockSchema: z.ZodType<RichTextBlock> = z.union([
  paragraphSchema,
  headingSchema,
  listSchema,
  blockquoteSchema,
  tableSchema,
]);

export const richTextDocumentSchema: z.ZodType<RichTextDocument> = z
  .object({
    type: z.literal("doc"),
    content: z.array(blockSchema).max(2000),
  })
  .transform((doc) => ({ type: "doc" as const, content: doc.content }));

export const emptyRichTextDocument: RichTextDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
