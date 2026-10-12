import { describe, expect, it } from "vitest";
import type { ManagementAssetDocument, RichTextBlock, RichTextParagraph } from "@/lib/contracts";
import { buildManagementAssetMarkdown } from "@/lib/data/management-asset-markdown";

const paragraph = (text: string): RichTextParagraph => ({ type: "paragraph", content: [{ type: "text", text }] });
function exportBlocks(content: RichTextBlock[]) {
  return buildManagementAssetMarkdown({ title: "Operação", summary: "Resumo", type: "sop", category: null, operationalOwner: "Liderança", versionNumber: "1", reviewCycle: "Mensal", author: { name: "Directscal" }, updatedAt: "2026-10-09T12:00:00Z", content: { type: "doc", content } } as ManagementAssetDocument);
}

describe("exportação Markdown dos ativos", () => {
  it("preserva títulos, marcas, links, quebras e texto literal", () => {
    const result = exportBlocks([
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Objetivo" }] },
      { type: "paragraph", content: [{ type: "text", text: " Forte ", marks: [{ type: "bold" }, { type: "italic" }] }, { type: "hardBreak" }, { type: "text", text: "Fonte", marks: [{ type: "link", attrs: { href: "https://example.com/a(b)" } }] }] },
      paragraph("<script> *literal*"),
    ]);
    expect(result).toContain("# Operação");
    expect(result).toContain("## Objetivo");
    expect(result).toContain(" _**Forte**_   \n[Fonte](<https://example.com/a%28b%29>)");
    expect(result).toContain("&lt;script&gt; \\*literal\\*");
    expect(result).toContain("9 de outubro de 2026");
  });

  it("preserva início da lista e recuo de parágrafos e listas aninhadas", () => {
    const result = exportBlocks([{ type: "orderedList", attrs: { start: 9 }, content: [{ type: "listItem", content: [paragraph("Conferir"), paragraph("Registrar"), { type: "bulletList", content: [{ type: "listItem", content: [paragraph("Detalhe")] }] }] }] }]);
    expect(result).toContain("9. Conferir\n   \n   Registrar\n   \n   - Detalhe");
  });

  it("preserva destaques e células com barras, quebras e cabeçalhos", () => {
    const result = exportBlocks([
      { type: "blockquote", content: [paragraph("Atenção"), paragraph("Confirmar")] },
      { type: "table", content: [
        { type: "tableRow", content: [{ type: "tableHeader", content: [paragraph("Atividade")] }] },
        { type: "tableRow", content: [{ type: "tableCell", content: [paragraph("A | B"), paragraph("C")] }] },
      ] },
    ]);
    expect(result).toContain("> Atenção\n> \n> Confirmar");
    expect(result).toContain("| Atividade |\n| --- |\n| A \\| B<br><br>C |");
  });

  it("não transforma a primeira linha de dados em cabeçalho", () => {
    const result = exportBlocks([{ type: "table", content: [{ type: "tableRow", content: [{ type: "tableCell", content: [paragraph("Dado")] }] }] }]);
    expect(result).toContain("|  |\n| --- |\n| Dado |");
  });
});
