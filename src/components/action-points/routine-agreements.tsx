import Link from "next/link";
import type { CustomerRoutineAgreement } from "@/lib/contracts/admin-adherence";
import { getManagementAssetHref } from "@/lib/data/management-asset-routes";
import type { RoutineExecutionRecord } from "@/lib/contracts/routine-replies";
import { RoutineExecutionRecords } from "@/components/action-points/routine-execution-records";

const cadences: Record<string, string> = { diaria: "Diária, de segunda a sexta", semanal: "Semanal", quinzenal: "Quinzenal", mensal: "Mensal", trimestral: "Trimestral", semestral: "Semestral", anual: "Anual" };
export function RoutineAgreements({ agreements, records = [] }: { agreements: CustomerRoutineAgreement[]; records?: RoutineExecutionRecord[] }) {
  if (!agreements.length) return null;
  return <section className="mt-8 space-y-4" aria-labelledby="routine-agreements-title">
    <div className="space-y-1"><h2 id="routine-agreements-title" className="text-ui-section">Acordos de execução</h2><p className="text-sm text-muted-foreground">Rotinas definidas com a DirectScal, com origem e critério de sucesso. A execução é acompanhada separadamente.</p></div>
    <div className="divide-y">{agreements.map(item => <details key={item.routineId} className="py-4">
      <summary className="cursor-pointer text-sm font-medium">{item.title ?? "Rotina de execução"}<span className="ml-3 font-normal text-muted-foreground">{item.paused ? "Pausada" : "Ativa"} · {item.assigneeName ?? "Sem responsável"}</span></summary>
      <div className="mt-4 max-w-3xl space-y-4 text-sm">
        <p className="whitespace-pre-wrap">{item.expectation}</p>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Regra de execução</dt><dd>{item.schedule.kind === "periodica" ? cadences[item.schedule.cadence] : `Por evento: ${item.schedule.eventKey}`}</dd></div>
          <div><dt className="text-muted-foreground">Setor</dt><dd>{item.sector}</dd></div>
          <div className="sm:col-span-2"><dt className="text-muted-foreground">Critério de sucesso e evidência esperada</dt><dd className="whitespace-pre-wrap">{item.successIndicator ?? "Ainda não definido"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-muted-foreground">Pergunta de origem</dt><dd>{item.question}</dd></div>
          <div className="sm:col-span-2"><dt className="text-muted-foreground">Ativo de referência</dt><dd>{item.assetAvailable ? <Link className="underline underline-offset-4" href={getManagementAssetHref(item.assetType, item.assetId)}>{item.assetTitle}</Link> : item.assetTitle} · versão vinculada {item.assetVersion}</dd>{item.assetAvailable ? <dd className="mt-1 text-xs text-muted-foreground">O link abre a publicação vigente do ativo.</dd> : <dd className="mt-1 text-xs text-muted-foreground">Ativo indisponível para leitura.</dd>}</div>
        </dl><p className="text-xs text-muted-foreground">Revisão {item.revision} do acordo</p>
        <RoutineExecutionRecords records={records.filter(record => record.cycle.rule.routineId === item.routineId)} now={new Date()} />
      </div>
    </details>)}</div>
  </section>;
}
