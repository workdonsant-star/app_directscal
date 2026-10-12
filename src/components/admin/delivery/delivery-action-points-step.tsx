"use client";

import { useDeliveryDraft } from "@/components/admin/delivery/delivery-draft-provider";
import { Badge } from "@/components/ui/badge";
import { adminActionPointTemplates } from "@/lib/data/admin-operations-data-source";
import { cn } from "@/lib/utils";

export function DeliveryActionPointsStep() {
  const { selectedActionPointIds, toggleActionPoint } = useDeliveryDraft();

  return (
    <div className="space-y-6">
      <section className="space-y-1" aria-labelledby="action-point-catalog-title">
        <h2 id="action-point-catalog-title" className="font-heading text-lg font-semibold">
          Catálogo de action points
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Selecione as ações que entrarão na entrega. Somente os itens marcados ficarão disponíveis para o cliente.
        </p>
      </section>

      <div className="overflow-hidden rounded-lg border">
        <div className="divide-y">
          {adminActionPointTemplates.map((actionPoint) => {
            const selected = selectedActionPointIds.has(actionPoint.id);

            return (
              <label
                key={actionPoint.id}
                className={cn(
                  "grid cursor-pointer gap-3 px-4 py-4 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_auto]",
                  selected ? "bg-primary/5" : "hover:bg-muted/40",
                )}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleActionPoint(actionPoint.id)}
                  className="mt-1 size-4 accent-primary"
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{actionPoint.title}</span>
                    <Badge variant="outline">{actionPoint.dimension}</Badge>
                    <Badge variant="secondary">Prioridade {actionPoint.priority.toLocaleLowerCase("pt-BR")}</Badge>
                  </span>
                  <span className="mt-1 block max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {actionPoint.description}
                  </span>
                  <span className="mt-2 block text-xs text-muted-foreground">
                    Responsável: {actionPoint.owner} · Prazo: {actionPoint.deadline} · Indicador: {actionPoint.successIndicator}
                  </span>
                </span>
                <span className={cn("text-xs font-medium", selected ? "text-primary" : "text-muted-foreground")}>
                  {selected ? "Selecionado" : "Adicionar"}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
