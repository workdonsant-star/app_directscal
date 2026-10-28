"use client";

import { reportFields } from "@/components/admin/delivery/delivery-draft";
import { useDeliveryDraft } from "@/components/admin/delivery/delivery-draft-provider";

export function DeliveryReportStep() {
  const { report, reportFilledCount, setReport } = useDeliveryDraft();

  return (
    <div className="space-y-6">
      <section className="space-y-1" aria-labelledby="report-editor-title">
        <h2 id="report-editor-title" className="text-ui-section">
          Relatório de análise
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Escreva a interpretação consultiva que será combinada aos dados e gráficos do diagnóstico.
          Os textos iniciais são apoios editáveis: revise, substitua ou descarte conforme sua análise.
          Salvar rascunho não altera a versão do cliente; Publicar confirma a entrega.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          {reportFields.map((field) => (
            <section key={field.key} className="grid gap-2">
              <div>
                <label htmlFor={`report-${field.key}`} className="font-heading text-base font-bold">
                  {field.label}
                </label>
                <p className="text-xs text-muted-foreground">{field.description}</p>
              </div>
              <textarea
                id={`report-${field.key}`}
                value={report[field.key]}
                onChange={(event) =>
                  setReport((current) => ({ ...current, [field.key]: event.target.value }))
                }
                rows={5}
                className="min-h-32 w-full resize-y rounded-lg border border-transparent bg-input px-3 py-2 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              />
            </section>
          ))}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <div className="rounded-lg bg-card p-4">
            <p className="font-heading text-sm font-medium">Progresso do relatório</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {reportFilledCount}
              <span className="text-base font-normal text-muted-foreground">/{reportFields.length}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Seções com conteúdo suficiente</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            Os gráficos e scores entram automaticamente na versão publicada. O texto acima compõe a camada analítica do especialista.
          </div>
        </aside>
      </div>
    </div>
  );
}
