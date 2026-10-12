import {
  managementAssetTypeLabels,
  type ManagementAssetDocument,
  type RichTextBlock,
  type RichTextInline,
} from "@/lib/contracts";

function escapeText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/([\\`*_{}\[\]()#+.!|~\-])/g, "\\$1");
}

function inlineToMarkdown(nodes?: RichTextInline[]): string {
  return (nodes ?? []).map((node) => {
    if (node.type === "hardBreak") return "  \n";
    let value = escapeText(node.text).replace(/\r?\n/g, "  \n");
    const leading = value.match(/^\s*/)?.[0] ?? "";
    const trailing = value.match(/\s*$/)?.[0] ?? "";
    value = value.trim();
    if (!value) return leading;
    if (node.marks?.some((mark) => mark.type === "bold")) value = `**${value}**`;
    if (node.marks?.some((mark) => mark.type === "italic")) value = `_${value}_`;
    const link = node.marks?.find((mark) => mark.type === "link");
    if (link?.type === "link") {
      const href = link.attrs.href.replace(/[\s<>()[\]\\]/g, (character) =>
        encodeURIComponent(character).replace(/\(/g, "%28").replace(/\)/g, "%29"),
      );
      value = `[${value}](<${href}>)`;
    }
    return `${leading}${value}${trailing}`;
  }).join("");
}

function blockToMarkdown(block: RichTextBlock): string {
  switch (block.type) {
    case "paragraph":
      return inlineToMarkdown(block.content);
    case "heading":
      return `${"#".repeat(block.attrs.level)} ${inlineToMarkdown(block.content)}`;
    case "bulletList":
    case "orderedList":
      return block.content.map((item, index) => {
        const marker = block.type === "orderedList" ? `${(block.attrs?.start ?? 1) + index}.` : "-";
        const indent = " ".repeat(marker.length + 1);
        const content = item.content.map(blockToMarkdown).join("\n\n");
        return `${marker} ${content.replace(/\n/g, `\n${indent}`)}`;
      }).join("\n");
    case "blockquote":
      return block.content.map(blockToMarkdown).join("\n\n").split("\n").map((line) => `> ${line}`).join("\n");
    case "table": {
      const rows = block.content.map((row) => row.content.flatMap((cell) => {
        const value = cell.content.map((paragraph) => inlineToMarkdown(paragraph.content).replace(/ *\n/g, "<br>")).join("<br><br>");
        return [value, ...Array.from({ length: (cell.attrs?.colspan ?? 1) - 1 }, () => "")];
      }));
      const columns = Math.max(...rows.map((row) => row.length));
      const hasHeader = block.content[0]?.content.every((cell) => cell.type === "tableHeader");
      const formatRow = (row: string[]) => `| ${Array.from({ length: columns }, (_, index) => row[index] ?? "").join(" | ")} |`;
      const header = hasHeader ? rows.shift()! : Array<string>(columns).fill("");
      return [formatRow(header), formatRow(Array<string>(columns).fill("---")), ...rows.map(formatRow)].join("\n");
    }
  }
}

export function buildManagementAssetMarkdown(asset: ManagementAssetDocument): string {
  const updatedAt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date(asset.updatedAt));
  return [
    `# ${escapeText(asset.title)}`,
    escapeText(asset.summary),
    [
      `- **Tipo:** ${managementAssetTypeLabels[asset.type]}`,
      ...(asset.category ? [`- **Categoria:** ${escapeText(asset.category)}`] : []),
      `- **Líder responsável:** ${escapeText(asset.operationalOwner)}`,
      `- **Versão:** ${escapeText(asset.versionNumber)}`,
      `- **Revisão:** ${escapeText(asset.reviewCycle)}`,
      `- **Autoria:** ${escapeText(asset.author.name)}`,
      `- **Atualizado em:** ${updatedAt}`,
    ].join("\n"),
    ...asset.content.content.map(blockToMarkdown),
  ].filter(Boolean).join("\n\n") + "\n";
}
