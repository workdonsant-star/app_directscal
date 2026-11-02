import type {
  ManagementAssetStatus,
  ManagementAssetVersionStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Status = ManagementAssetStatus | ManagementAssetVersionStatus;

export const managementAssetStatusLabels: Record<Status, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  arquivado: "Arquivado",
  substituido: "Substituído",
};

export function ManagementAssetStatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        (status === "rascunho" || status === "substituido") &&
          "border-border bg-muted text-muted-foreground",
        status === "publicado" && "border-primary/20 bg-primary/10 text-primary",
        status === "arquivado" && "border-dashed border-border text-muted-foreground",
      )}
    >
      {managementAssetStatusLabels[status]}
    </span>
  );
}
