"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AppTopbar } from "@/components/app-topbar";
import { AppPage } from "@/components/app-page";
import { DimensionDiagnosticFilter } from "@/components/omdx/dimension-diagnostic-filter";
import { DimensionInsightDashboard } from "@/components/omdx/dimension-insight-dashboard";
import type {
  Diagnostic,
  Dimension,
  DimensionInsightSummary,
  DimensionQuestionResult,
} from "@/lib/types";

type DimensionInsightWorkspaceProps = {
  diagnosticOptions: Diagnostic[];
  dimension: Dimension;
  questionResults: DimensionQuestionResult[];
  selectedDiagnostic: string;
  summary: DimensionInsightSummary;
};

export function DimensionInsightWorkspace({
  diagnosticOptions,
  dimension,
  questionResults,
  selectedDiagnostic,
  summary,
}: DimensionInsightWorkspaceProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const validDiagnosticOptions = useMemo(() => diagnosticOptions, [diagnosticOptions]);

  function handleDiagnosticChange(value: string) {
    const params = new URLSearchParams(searchParams);

    if (value === "todos") {
      params.delete("diagnostico");
    } else {
      params.set("diagnostico", value);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <>
      <AppTopbar
        breadcrumb={[{ label: "Insights" }, { label: dimension.shortName }]}
        actions={
          <DimensionDiagnosticFilter
            diagnostics={validDiagnosticOptions}
            value={selectedDiagnostic}
            onChange={handleDiagnosticChange}
          />
        }
      />
      <AppPage>
        <div className="w-full">
          <DimensionInsightDashboard
            questionResults={questionResults}
            selectedDiagnostic={selectedDiagnostic}
            summary={summary}
          />
        </div>
      </AppPage>
    </>
  );
}
