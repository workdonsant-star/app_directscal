"use client";

import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { analyzeMaturityResponsesCsv, type GeneratorAnalysis } from "@/lib/data/diagnostic-generator-csv";
import { buildDiagnosticDraft, serializeDiagnosticDraft, type DiagnosticDraftSection } from "@/lib/data/diagnostic-generator-report";
import { buildGeneratorBriefing, generatorConfigs, type GeneratorKind } from "./generator-config";

const formatScore = (value: number | null) => value === null ? "Sem base" : value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function GeneratorBriefingWorkspace({ kind }: { kind: GeneratorKind }) {
  const config = generatorConfigs[kind];
  const [values, setValues] = useState<Record<string, string>>({});
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const [analysis, setAnalysis] = useState<GeneratorAnalysis | null>(null);
  const [csvName, setCsvName] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DiagnosticDraftSection[] | null>(null);
  const [draftStale, setDraftStale] = useState(false);
  const fields = config.sections.flatMap((section) => section.fields);
  const pending = fields.filter((field) => field.required && !values[field.id]?.trim());
  const briefing = buildGeneratorBriefing(config, values);

  function updateValue(id: string, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
    setCopyState("idle");
    if (draft) setDraftStale(true);
  }

  async function importCsv(file: File | undefined) {
    if (!file) return;
    setCsvError(null);
    setAnalysis(null);
    setDraft(null);
    setCsvName(null);
    if (file.size > 10 * 1024 * 1024) {
      setCsvError("O CSV deve ter no máximo 10 MB.");
      return;
    }
    try {
      const result = analyzeMaturityResponsesCsv(await file.text());
      setAnalysis(result);
      setCsvName(file.name);
    } catch (error) {
      setCsvError(error instanceof Error ? error.message : "Não foi possível ler o CSV.");
    }
  }

  async function copyBriefing() {
    try {
      await navigator.clipboard.writeText(briefing);
      setCopyState("done");
    } catch {
      setCopyState("error");
    }
  }

  function downloadBriefing() {
    downloadMarkdown(briefing, `briefing-${kind}.md`);
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="text-ui-title-lg font-bold tracking-tight">{config.title}</h1>
          <p className="text-sm text-muted-foreground">{config.description}</p>
          <p className="text-xs text-muted-foreground">Base: {config.source}</p>
        </div>
        <span className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">
          Formulário de briefing
        </span>
      </div>

      <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
        <div className="space-y-10">
          {config.sections.map((section) => (
            <section key={section.title} aria-label={section.title} className="space-y-5">
              <div className="border-b border-border pb-3">
                <h2 className="text-base font-bold">{section.title}</h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {section.fields.map((field) => (
                  <div key={field.id} className={`space-y-2 ${field.multiline ? "md:col-span-2" : ""}`}>
                    <label htmlFor={`${kind}-${field.id}`} className="text-sm font-medium">
                      {field.label}{field.required ? <span className="ml-1 text-muted-foreground">*</span> : null}
                    </label>
                    {field.multiline ? (
                      <textarea
                        id={`${kind}-${field.id}`}
                        value={values[field.id] ?? ""}
                        onChange={(event) => updateValue(field.id, event.target.value)}
                        placeholder={field.hint}
                        rows={4}
                        className="w-full resize-y rounded-lg border border-transparent bg-input px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                      />
                    ) : (
                      <Input
                        id={`${kind}-${field.id}`}
                        value={values[field.id] ?? ""}
                        onChange={(event) => updateValue(field.id, event.target.value)}
                        placeholder={field.hint}
                        className="h-10 text-foreground"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
          {kind === "diagnosticos" ? (
            <section aria-labelledby="generator-csv-title" className="space-y-5">
              <div className="border-b border-border pb-3">
                <h2 id="generator-csv-title" className="text-base font-bold">Dados da pesquisa</h2>
              </div>
              <div className="space-y-2">
                <label htmlFor="generator-csv" className="text-sm font-medium">CSV de respostas</label>
                <Input id="generator-csv" type="file" accept=".csv,text/csv" onChange={(event) => { void importCsv(event.target.files?.[0]); event.target.value = ""; }} className="h-10 cursor-pointer" />
                <p className="text-xs text-muted-foreground">Use a exportação de Pesquisas com resposta, grupo, data, dimensão, pergunta e nota. O arquivo é analisado nesta tela, sem envio ao servidor.</p>
                {csvError ? <p role="alert" className="text-sm text-destructive">{csvError}</p> : null}
              </div>
              {analysis ? (
                <div className="space-y-5">
                  <p className="text-sm text-foreground">{csvName}: {analysis.totalResponses} respostas completas, {analysis.dimensions.length} dimensões, média geral <span className="tabular-nums font-medium">{formatScore(analysis.score)}</span>.</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(["fundador", "lideranca", "operacao"] as const).map((group) => (
                      <div key={group} className="rounded-lg border border-border p-4">
                        <p className="text-xs text-muted-foreground">{{ fundador: "Fundador", lideranca: "Liderança", operacao: "Operação" }[group]}</p>
                        <p className="mt-2 text-lg font-medium tabular-nums">{formatScore(analysis.layers[group].score)}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">{analysis.layers[group].responses} resposta(s)</p>
                      </div>
                    ))}
                  </div>
                  <Table variant="operational">
                    <TableHeader><TableRow><TableHead>Dimensão</TableHead><TableHead>Média</TableHead><TableHead>Diferença entre grupos</TableHead></TableRow></TableHeader>
                    <TableBody>{analysis.dimensions.map((dimension) => (
                      <TableRow key={dimension.name}><TableCell>{dimension.name}</TableCell><TableCell className="tabular-nums">{formatScore(dimension.score)}</TableCell><TableCell className="tabular-nums">{formatScore(dimension.gap)}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                  {analysis.warnings.map((warning) => <p key={warning} role="status" className="text-sm text-muted-foreground">{warning}</p>)}
                  <Button type="button" onClick={() => { setDraft(buildDiagnosticDraft(analysis, values)); setDraftStale(false); }}>Gerar rascunho</Button>
                </div>
              ) : null}
            </section>
          ) : null}
          {kind === "diagnosticos" && draft ? (
            <section aria-labelledby="diagnostic-draft-title" className="space-y-5">
              <div className="border-b border-border pb-3"><h2 id="diagnostic-draft-title" className="text-base font-bold">Rascunho do diagnóstico</h2></div>
              {draftStale ? <p role="status" className="text-sm text-muted-foreground">O briefing mudou depois da geração. Gerar novamente atualiza os dados e substitui as edições deste rascunho.</p> : null}
              {draft.map((section, index) => (
                <div key={section.title} className="space-y-2">
                  <label htmlFor={`diagnostic-draft-${index}`} className="text-sm font-medium">{section.title}</label>
                  <textarea id={`diagnostic-draft-${index}`} rows={Math.min(12, Math.max(5, section.body.split("\n").length + 2))} value={section.body} onChange={(event) => setDraft((current) => current?.map((item, itemIndex) => itemIndex === index ? { ...item, body: event.target.value } : item) ?? null)} className="w-full resize-y rounded-lg border border-transparent bg-input px-2.5 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50" />
                </div>
              ))}
              <Button type="button" variant="ghost" className="border border-border text-foreground" onClick={() => downloadMarkdown(`# ${values.titulo?.trim() || "Diagnóstico de maturidade"}\n\n${serializeDiagnosticDraft(draft)}`, "diagnostico-rascunho.md")}><Download /> Baixar diagnóstico .md</Button>
              <p className="text-xs text-muted-foreground">Rascunho local para revisão. Nenhuma seção é publicada automaticamente.</p>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold">Revisão do briefing</h2>
              <span className="text-xs tabular-nums text-muted-foreground">
                {pending.length === 0 ? "Campos essenciais preenchidos" : `${pending.length} essenciais pendentes`}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Campos vazios são marcados como pendentes no arquivo. Revise fatos, valores e fontes antes de usar o briefing.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" variant={kind === "diagnosticos" ? "ghost" : "default"} className={kind === "diagnosticos" ? "border border-border text-foreground" : undefined} onClick={copyBriefing}>
                {copyState === "done" ? <Check /> : <Copy />}
                {copyState === "done" ? "Copiado" : "Copiar briefing"}
              </Button>
              <Button type="button" variant="ghost" className="border border-border text-foreground" onClick={downloadBriefing}>
                <Download /> Baixar .md
              </Button>
            </div>
            {copyState === "error" ? <p role="alert" className="mt-3 text-xs text-destructive">Não foi possível copiar. Baixe o arquivo .md.</p> : null}
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-bold">Prévia</h3>
            <pre className="mt-3 max-h-[440px] overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-muted-foreground">{briefing}</pre>
          </div>
          <p className="text-xs text-muted-foreground">O conteúdo é mantido somente nesta tela. Ao sair, o preenchimento será perdido.</p>
        </aside>
      </div>
    </div>
  );
}
