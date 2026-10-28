"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DimensionDiagnosticFilter } from "@/components/omdx/dimension-diagnostic-filter";
import type { Diagnostic } from "@/lib/types";

type OverviewDiagnosticFilterProps = {
  id?: string;
  diagnostics: Diagnostic[];
  value: string;
  allowAll?: boolean;
};

export function OverviewDiagnosticFilter({
  id = "overview-diagnostic-filter",
  diagnostics,
  value,
  allowAll = true,
}: OverviewDiagnosticFilterProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleDiagnosticChange(nextValue: string) {
    const params = new URLSearchParams(searchParams);

    if (nextValue === "todos") {
      params.delete("diagnostico");
    } else {
      params.set("diagnostico", nextValue);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <DimensionDiagnosticFilter
      id={id}
      compact
      allowAll={allowAll}
      diagnostics={diagnostics}
      value={value}
      onChange={handleDiagnosticChange}
    />
  );
}
