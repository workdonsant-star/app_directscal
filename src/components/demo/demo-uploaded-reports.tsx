"use client";

import { CustomerDocumentDownloadLink } from "@/components/management-assets/customer-document-download-link";
import { useDemo } from "./demo-store";

export function DemoUploadedReports() {
  const { state } = useDemo();
  const reports = (state.uploadedDocuments ?? []).filter(document => document.kind === "report");
  if (!reports.length) return null;
  return <section className="space-y-3" aria-labelledby="demo-uploaded-reports-title"><h2 id="demo-uploaded-reports-title" className="text-ui-section">Relatórios enviados</h2><ul className="divide-y border-t">{reports.map(report => <li key={report.id} className="py-4"><CustomerDocumentDownloadLink document={report} /><p className="text-sm text-muted-foreground">PDF · {report.fileName}</p></li>)}</ul></section>;
}
