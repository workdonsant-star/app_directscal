import { cn } from "@/lib/utils";
import type { DiagnosticStatus } from "@/lib/types";

const labels: Record<DiagnosticStatus, string> = {
  rascunho: "Rascunho",
  ativo: "Ativo",
  encerrado: "Encerrado",
};

export function StatusBadge({ status }: { status: DiagnosticStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        status === "rascunho" &&
          "border-document-attention-foreground/20 bg-document-attention text-document-attention-foreground",
        status === "ativo" &&
          "border-chart-positive/20 bg-chart-positive/10 text-chart-positive",
        status === "encerrado" &&
          "border-chart-negative/20 bg-chart-negative/10 text-chart-negative",
      )}
    >
      {labels[status]}
    </span>
  );
}
