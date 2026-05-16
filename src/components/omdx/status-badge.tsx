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
          "border-border text-muted-foreground bg-muted",
        status === "ativo" &&
          "border-primary/20 bg-primary/10 text-primary",
        status === "encerrado" &&
          "border-border text-foreground bg-secondary",
      )}
    >
      {labels[status]}
    </span>
  );
}
