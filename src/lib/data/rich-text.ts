import {
  legacySopDocumentContentSchema,
  richTextDocumentSchema,
  type LegacySopContentBlock,
  type LegacySopDocumentContent,
  type RichTextBlock,
  type RichTextDocument,
  type RichTextHeading,
  type RichTextInline,
  type RichTextList,
  type RichTextParagraph,
} from "@/lib/contracts";

export type RichTextOutlineItem = {
  id: string;
  label: string;
  level: 2 | 3;
};

export function inlineToPlainText(content: RichTextInline[] | undefined) {
  if (!content) return "";

  return content
    .map((node) => (node.type === "text" ? node.text : "\n"))
    .join("");
}

export function slugifyHeading(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "secao"
  );
}

// Gera ids estáveis e únicos na ordem do documento. O renderizador e o
// sumário usam a mesma função para que as âncoras coincidam.
export function getHeadingIds(doc: RichTextDocument) {
  const used = new Map<string, number>();
  const ids = new Map<RichTextHeading, string>();

  for (const block of doc.content) {
    if (block.type !== "heading") continue;

    const base = slugifyHeading(inlineToPlainText(block.content));
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    ids.set(block, count === 0 ? base : `${base}-${count + 1}`);
  }

  return ids;
}

export function getRichTextOutline(doc: RichTextDocument): RichTextOutlineItem[] {
  const ids = getHeadingIds(doc);
  const outline: RichTextOutlineItem[] = [];

  for (const block of doc.content) {
    if (block.type !== "heading") continue;

    const label = inlineToPlainText(block.content).trim();
    const id = ids.get(block);

    if (label && id) {
      outline.push({ id, label, level: block.attrs.level });
    }
  }

  return outline;
}

function listToPlainText(list: RichTextList, depth = 0): string {
  const indent = "  ".repeat(depth);
  const start = list.type === "orderedList" ? (list.attrs?.start ?? 1) : 1;

  return list.content
    .map((item, index) => {
      const marker = list.type === "orderedList" ? `${start + index}.` : "•";
      const [first, ...rest] = item.content;
      const head =
        first?.type === "paragraph"
          ? inlineToPlainText(first.content).trim()
          : first
            ? listToPlainText(first, depth + 1)
            : "";
      const tail = rest
        .map((child) =>
          child.type === "paragraph"
            ? `${indent}  ${inlineToPlainText(child.content).trim()}`
            : listToPlainText(child, depth + 1),
        )
        .filter(Boolean);

      return [`${indent}${marker} ${head}`, ...tail].join("\n");
    })
    .join("\n");
}

function paragraphToPlainText(paragraph: RichTextParagraph) {
  return inlineToPlainText(paragraph.content).trim();
}

export function blockToPlainText(block: RichTextBlock): string {
  switch (block.type) {
    case "paragraph":
      return paragraphToPlainText(block);
    case "heading":
      return inlineToPlainText(block.content).trim();
    case "bulletList":
    case "orderedList":
      return listToPlainText(block);
    case "blockquote":
      return block.content
        .map((child) =>
          child.type === "paragraph"
            ? paragraphToPlainText(child)
            : listToPlainText(child),
        )
        .filter(Boolean)
        .join("\n");
    case "table":
      return block.content
        .map((row) =>
          row.content
            .map((cell) => cell.content.map(paragraphToPlainText).join(" "))
            .join(" | "),
        )
        .join("\n");
  }
}

export function richTextToPlainText(doc: RichTextDocument) {
  return doc.content.map(blockToPlainText).filter(Boolean).join("\n\n");
}

export function isRichTextEmpty(doc: RichTextDocument) {
  return richTextToPlainText(doc).trim().length === 0;
}

export type RichTextSection = {
  headingPath: string;
  blocks: RichTextBlock[];
};

// Divide o documento pelos títulos H2 e H3. O texto anterior ao primeiro
// título pertence a uma seção de abertura nomeada pelo próprio ativo.
export function splitRichTextSections(
  doc: RichTextDocument,
  openingTitle: string,
): RichTextSection[] {
  const sections: RichTextSection[] = [];
  let currentH2: string | null = null;
  let current: RichTextSection = { headingPath: openingTitle, blocks: [] };

  for (const block of doc.content) {
    if (block.type === "heading") {
      if (current.blocks.length > 0) sections.push(current);

      const label = inlineToPlainText(block.content).trim() || openingTitle;

      if (block.attrs.level === 2) {
        currentH2 = label;
        current = { headingPath: label, blocks: [] };
      } else {
        current = {
          headingPath: currentH2 ? `${currentH2} › ${label}` : label,
          blocks: [],
        };
      }

      continue;
    }

    current.blocks.push(block);
  }

  if (current.blocks.length > 0) sections.push(current);

  return sections;
}

function textInline(text: string): RichTextInline[] {
  return [{ type: "text", text }];
}

function legacyBlockToRichText(block: LegacySopContentBlock): RichTextBlock {
  if (block.type === "paragraph") {
    return { type: "paragraph", content: textInline(block.text) };
  }

  if (block.type === "list") {
    return {
      type: block.ordered ? "orderedList" : "bulletList",
      content: block.items.map((item) => ({
        type: "listItem" as const,
        content: [{ type: "paragraph" as const, content: textInline(item) }],
      })),
    };
  }

  return {
    type: "table",
    content: [
      {
        type: "tableRow",
        content: block.columns.map((column) => ({
          type: "tableHeader" as const,
          content: [{ type: "paragraph" as const, content: textInline(column) }],
        })),
      },
      ...block.rows.map((row) => ({
        type: "tableRow" as const,
        content: row.map((cell) => ({
          type: "tableCell" as const,
          content: [{ type: "paragraph" as const, content: textInline(cell) }],
        })),
      })),
    ],
  };
}

export function legacySopContentToRichText(
  content: LegacySopDocumentContent,
): RichTextDocument {
  return {
    type: "doc",
    content: content.sections.flatMap((section) => [
      {
        type: "heading" as const,
        attrs: { level: 2 as const },
        content: textInline(section.title),
      },
      ...section.blocks.map(legacyBlockToRichText),
    ]),
  };
}

// Versões gravadas antes do editor usam blocos por seção; ambas as formas
// chegam à interface como documento do editor.
export function parseStoredAssetContent(content: unknown): RichTextDocument | null {
  const richText = richTextDocumentSchema.safeParse(content);
  if (richText.success) return richText.data;

  const legacy = legacySopDocumentContentSchema.safeParse(content);
  if (legacy.success) return legacySopContentToRichText(legacy.data);

  return null;
}
