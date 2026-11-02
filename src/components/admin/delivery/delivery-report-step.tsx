"use client";

import { reportFields } from "@/components/admin/delivery/delivery-draft";
import { useDeliveryDraft } from "@/components/admin/delivery/delivery-draft-provider";
import { DimensionScoreBarChart } from "@/components/omdx/dimension-score-bar-chart";
import { LayerDimensionStackedChart } from "@/components/omdx/layer-dimension-stacked-chart";
import { LayerScoreBarChart } from "@/components/omdx/layer-score-bar-chart";
import { Button } from "@/components/ui/button";
import type { AdminDeliveryReportDraft } from "@/lib/contracts/admin-operations";

export function DeliveryReportStep() {
  const { analysis, delivery, feedback, feedbackKind, hasUnsavedChanges, isSaving, persistDelivery, report, setReport } = useDeliveryDraft();

  function field(key: keyof AdminDeliveryReportDraft) {
    const definition = reportFields.find(item => item.key === key)!;
    return <section key={key} className="space-y-2 border-t border-border pt-6">
      <label htmlFor={`report-${key}`} className="block font-heading text-lg font-bold">{definition.label}</label>
      <p className="max-w-[70ch] text-sm text-muted-foreground">{definition.description}</p>
      <textarea
        id={`report-${key}`}
        value={report[key]}
        onChange={event => setReport(current => ({ ...current, [key]: event.target.value }))}
        placeholder="Escreva a análise desta coleta."
        rows={5}
        className="min-h-36 w-full resize-y rounded-md border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
      />
    </section>;
  }

  return <article className="mx-auto w-full max-w-5xl space-y-8" aria-labelledby="report-editor-title">
    <header className="space-y-2 border-b border-border pb-6">
      <p className="font-label text-ui-label text-muted-foreground">{delivery.companyName} · Relatório em elaboração</p>
      <h2 id="report-editor-title" className="text-ui-section">{delivery.diagnosticName}</h2>
    </header>

    {field("executiveSummary")}

    <section aria-labelledby="report-chart-title" className="space-y-5 border-t border-border pt-6">
      <div className="space-y-1"><h3 id="report-chart-title" className="font-heading text-lg font-bold">Resultados da coleta</h3><p className="text-sm text-muted-foreground">Pontuações calculadas a partir das respostas, em escala de 1 a 5.</p></div>
      <div className="grid gap-6 xl:grid-cols-2">
        <figure className="min-w-0 space-y-3"><figcaption className="text-sm font-medium">Maturidade por camada</figcaption><LayerScoreBarChart data={analysis.analytics.layerScores} /></figure>
        <figure className="min-w-0 space-y-3"><figcaption className="text-sm font-medium">Maturidade por dimensão</figcaption><DimensionScoreBarChart data={analysis.analytics.dimensions} /></figure>
      </div>
      <figure className="max-w-2xl space-y-3"><figcaption className="text-sm font-medium">Dimensões por camada</figcaption><LayerDimensionStackedChart data={analysis.analytics.dimensions} /></figure>
    </section>

    {field("generalReading")}
    {field("vulnerabilities")}
    {field("structuralCauses")}
    {field("recommendations")}
    {field("conclusion")}
    <footer className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
      <Button type="button" onClick={() => void persistDelivery("save")} disabled={isSaving || !hasUnsavedChanges}>{isSaving ? "Salvando…" : "Salvar rascunho"}</Button>
      {feedback ? <p role={feedbackKind === "error" ? "alert" : "status"} className="text-sm text-muted-foreground">{feedback}</p> : null}
    </footer>
  </article>;
}
