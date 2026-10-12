"use client";

import { UserRoundCheck } from "lucide-react";

import { useDeliveryDraft } from "@/components/admin/delivery/delivery-draft-provider";
import { Badge } from "@/components/ui/badge";

export function DeliveryPublishStep() {
  const { assignedSpecialistName, delivery, report, selectedActionPointIds } =
    useDeliveryDraft();

  return (
    <div className="space-y-6">
      <section className="space-y-1" aria-labelledby="publication-title">
        <h2 id="publication-title" className="font-heading text-lg font-semibold">
          Publicação da entrega
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Confirme a autoria e o conteúdo antes de disponibilizar relatório e action points ao cliente. A checklist de requisitos fica na lateral, em todas as etapas.
        </p>
      </section>

      <section className="rounded-lg border bg-card p-5" aria-labelledby="client-preview-title">
        <div className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Prévia do cliente</p>
            <h3 id="client-preview-title" className="mt-1 font-heading text-xl font-semibold">
              {delivery.diagnosticName}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{delivery.companyName}</p>
          </div>
          <Badge variant="outline">Score {delivery.generalScore.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}</Badge>
        </div>
        <div className="space-y-5 pt-5">
          <div>
            <h4 className="font-heading text-base font-semibold">Resumo executivo</h4>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {report.executiveSummary}
            </p>
          </div>
          <div>
            <h4 className="font-heading text-base font-semibold">Plano de ação</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedActionPointIds.size} action points selecionados para a página Action Points do cliente.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserRoundCheck aria-hidden="true" className="size-4" />
            Assinado por {assignedSpecialistName ?? "especialista não atribuído"}
          </div>
        </div>
      </section>
    </div>
  );
}
