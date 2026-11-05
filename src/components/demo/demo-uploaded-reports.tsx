"use client";

import { UploadedReportsList } from "@/components/reports/uploaded-reports-list";
import { useDemo } from "./demo-store";

export function DemoUploadedReports() {
  const { state } = useDemo();
  const reports = (state.uploadedDocuments ?? []).filter(document => document.kind === "report");
  return <UploadedReportsList documents={reports} />;
}
