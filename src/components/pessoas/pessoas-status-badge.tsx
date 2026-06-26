import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  PeopleDocumentStatus,
  PeoplePaymentStatus,
  PeoplePersonStatus,
} from "@/lib/types";

import {
  documentStatusLabel,
  paymentStatusLabel,
  personStatusLabel,
} from "./pessoas-formatters";

type StatusKind = "document" | "payment" | "person";

type PessoasStatusBadgeProps =
  | { kind: "document"; status: PeopleDocumentStatus }
  | { kind: "payment"; status: PeoplePaymentStatus }
  | { kind: "person"; status: PeoplePersonStatus };

function statusLabel({ kind, status }: PessoasStatusBadgeProps) {
  if (kind === "document") return documentStatusLabel[status];
  if (kind === "payment") return paymentStatusLabel[status];

  return personStatusLabel[status];
}

function statusClassName(kind: StatusKind, status: string) {
  if (status === "ativo" || status === "aprovado" || status === "valido") {
    return "border-chart-positive/30 text-chart-positive";
  }

  if (
    status === "pendente" ||
    status === "com_pendencia" ||
    status === "vencido"
  ) {
    return "border-destructive/30 text-destructive";
  }

  if (
    status === "em_revisao" ||
    status === "calculado" ||
    status === "vence_em_breve"
  ) {
    return "text-foreground";
  }

  if (kind === "payment" && ["exportado", "pago"].includes(status)) {
    return "border-primary/30 text-primary";
  }

  return "text-muted-foreground";
}

export function PessoasStatusBadge(props: PessoasStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("h-5 px-2 font-medium", statusClassName(props.kind, props.status))}
    >
      {statusLabel(props)}
    </Badge>
  );
}
