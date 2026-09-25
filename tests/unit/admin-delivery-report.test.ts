import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { diagnosticReportSchema } from "@/lib/contracts";
import {
  buildAdminDeliveryReport,
  getAdminCompanyDeliveries,
  getAdminDelivery,
} from "@/lib/data/admin-operations-data-source";
import { OmdxReportDocument } from "@/lib/pdf/omdx-report-document";

describe("admin delivery reports", () => {
  it("lists multiple reports for the same company in reverse chronological order", () => {
    const reports = getAdminCompanyDeliveries("Shipping Caps").sort(
      (first, second) => second.closedAt.localeCompare(first.closedAt),
    );

    expect(reports.map((report) => report.diagnosticName)).toEqual([
      "Diagnóstico de maturidade Q2",
      "Diagnóstico de maturidade Q1",
    ]);
  });

  it("builds a valid PDF document for the selected delivery", async () => {
    const delivery = getAdminDelivery("delivery_shipping_q1");

    expect(delivery).not.toBeNull();
    if (!delivery) return;

    const report = diagnosticReportSchema.parse(
      buildAdminDeliveryReport(delivery),
    );
    const document = createElement(OmdxReportDocument, {
      report,
    }) as Parameters<typeof renderToBuffer>[0];
    const pdf = await renderToBuffer(document);

    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.byteLength).toBeGreaterThan(10_000);
  });
});
