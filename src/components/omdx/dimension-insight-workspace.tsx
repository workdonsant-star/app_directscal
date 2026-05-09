"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AppTopbar } from "@/components/app-topbar";
import { DimensionDiagnosticFilter } from "@/components/omdx/dimension-diagnostic-filter";
import { DimensionInsightDashboard } from "@/components/omdx/dimension-insight-dashboard";
import { getDimensionInsightDiagnosticOptions } from "@/lib/data/omdx-data-source";
import type { Dimension } from "@/lib/types";

type DimensionInsightWorkspaceProps = {
  dimension: Dimension;
};

export function DimensionInsightWorkspace({
  dimension,
}: DimensionInsightWorkspaceProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const diagnosticOptions = useMemo(
    () => getDimensionInsightDiagnosticOptions(),
    [],
  );
  const currentDiagnostic = searchParams.get("diagnostico") ?? "todos";
  const selectedDiagnostic = diagnosticOptions.some(
    (diagnostic) => diagnostic.id === currentDiagnostic,
  )
    ? currentDiagnostic
    : "todos";

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
            diagnostics={diagnosticOptions}
            value={selectedDiagnostic}
            onChange={handleDiagnosticChange}
          />
        }
      />
      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl">
          <DimensionInsightDashboard
            dimension={dimension}
            selectedDiagnostic={selectedDiagnostic}
          />
        </div>
      </main>
    </>
  );
}
