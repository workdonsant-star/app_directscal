import { Badge } from "@/components/ui/badge";
import type { AdminDeliveryStatus } from "@/lib/contracts/admin-operations";
import { cn } from "@/lib/utils";

const statusLabel: Record<AdminDeliveryStatus, string> = {
  sem_especialista: "Sem especialista",
  aguardando_analise: "Aguardando análise",
  em_analise: "Em análise",
  pronta_para_publicar: "Pronta para publicar",
  publicada: "Publicada",
};

const statusStyles: Record<AdminDeliveryStatus, string> = {
  sem_especialista:
    "border-destructive/20 bg-destructive/10 text-destructive",
  aguardando_analise: "border-border bg-muted text-muted-foreground",
  em_analise: "border-primary/20 bg-primary/10 text-primary",
  pronta_para_publicar:
    "border-[var(--chart-positive)]/20 bg-[var(--chart-positive)]/10 text-[var(--chart-positive)]",
  publicada: "border-border bg-secondary text-foreground",
};

export function AdminDeliveryStatusBadge({
  status,
}: {
  status: AdminDeliveryStatus;
}) {
  return (
    <Badge variant="outline" className={cn(statusStyles[status])}>
      {statusLabel[status]}
    </Badge>
  );
}
