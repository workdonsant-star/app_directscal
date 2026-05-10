import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AdminStatusBadgeProps = {
  status: "ativo" | "inativo" | "pausado";
};

const statusLabel: Record<AdminStatusBadgeProps["status"], string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  pausado: "Pausado",
};

const statusStyles: Record<AdminStatusBadgeProps["status"], string> = {
  ativo:
    "border-[var(--chart-positive)]/20 bg-[var(--chart-positive)]/10 text-[var(--chart-positive)]",
  inativo: "border-border bg-secondary text-muted-foreground",
  pausado: "border-border bg-muted text-muted-foreground",
};

export function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("capitalize", statusStyles[status])}>
      {statusLabel[status]}
    </Badge>
  );
}
