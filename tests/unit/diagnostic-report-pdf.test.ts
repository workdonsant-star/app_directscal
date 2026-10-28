import { createElement } from "react";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { buildAcmeReportExample, acmeReportEditorial } from "@/lib/data/acme-report-example";
import { OmdxEditorialReportDocument } from "@/lib/pdf/omdx-editorial-report-document";

describe("paginação do relatório formatado", () => {
  it("gera A4 com fontes locais, suporta texto extenso e camada sem base", async () => {
    const report = buildAcmeReportExample();
    const render = async (name: string, long = false) => {
      const editorial = long ? Object.fromEntries(Object.entries(acmeReportEditorial).map(([key, text]) => [key, Array.from({ length: 8 }, (_, index) => `${text}\n\nParágrafo ${index + 1} da seção ${key}.`).join("\n\n")])) as typeof acmeReportEditorial : acmeReportEditorial;
      const document = createElement(OmdxEditorialReportDocument, { report, editorial, example: true }) as Parameters<typeof renderToBuffer>[0];
      const buffer = await renderToBuffer(document);
      expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
      const pages = [...buffer.toString("latin1").matchAll(/\/Type \/Page\b/g)].length;
      const pageSizes = [...buffer.toString("latin1").matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g)];
      expect(pageSizes).toHaveLength(pages);
      pageSizes.forEach(([, width, height]) => {
        expect(Number(width)).toBeCloseTo(595.28, 1);
        expect(Number(height)).toBeCloseTo(841.89, 1);
      });
      if (process.env.PDF_REVIEW_DIR) {
        await mkdir(process.env.PDF_REVIEW_DIR, { recursive: true });
        await writeFile(path.join(process.env.PDF_REVIEW_DIR, `${name}.pdf`), buffer);
      }
      return pages;
    };
    const regularPages = await render("acme");
    expect(regularPages).toBe(7);
    report.layerAverages.lideranca = null;
    report.layerAverages.operacao = null;
    report.responses.lideranca = 0;
    report.responses.operacao = 0;
    expect(await render("acme-long", true)).toBeGreaterThan(regularPages);
  }, 30_000);
});
