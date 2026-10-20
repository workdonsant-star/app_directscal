import type { RoutineExecutionRecord, RoutineReplyOperation } from "@/lib/contracts/routine-replies";
import { getAdherenceCycleState } from "@/lib/data/asset-adherence";

const date = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
function ProposalOperation({ operation }: { operation: RoutineReplyOperation }) {
  if (operation.kind === "leitura") return <p>Leitura do ativo. Não comprova execução.</p>;
  if (operation.kind === "progresso") return <p>Implantação: <span className="tabular-nums">{operation.value}%</span>. {operation.reason}</p>;
  if (operation.kind === "bloqueio") return <p>Bloqueio relatado: {operation.reason}</p>;
  if (operation.kind === "excecao") return <p>Exceção solicitada, sujeita à revisão: {operation.reason}</p>;
  return <><p>{operation.performed ? "Execução relatada" : "Não execução relatada"}: {operation.description}</p>
    {operation.evidence.length ? <ul className="mt-2 space-y-1">{operation.evidence.map(url => <li key={url}><a className="break-all underline underline-offset-4" href={url} target="_blank" rel="noopener noreferrer">{url}</a></li>)}</ul> : <p className="mt-1 text-xs text-muted-foreground">Sem referência de evidência anexada.</p>}</>;
}

export function RoutineExecutionRecords({ records, now }: { records: RoutineExecutionRecord[]; now: Date }) {
  if (!records.length) return <p className="text-xs text-muted-foreground">Nenhuma oportunidade de execução disponível para acompanhamento.</p>;
  const states = records.map(record => ({ record, state: getAdherenceCycleState(record.cycle, now) }));
  const eligible = states.filter(({ record, state }) => Date.parse(record.cycle.dueAt) <= now.getTime() && !state.excluded);
  const reported = eligible.filter(({ state }) => state.reported).length;
  const validated = eligible.filter(({ state }) => state.validated).length;
  return <section className="space-y-4" aria-label="Registros de execução da rotina">
    <div className="space-y-1">
      <h3 className="font-medium">Execução e evidências</h3>
      <p className="tabular-nums">{eligible.length ? `${reported} de ${eligible.length} oportunidades vencidas no histórico deste acordo com execução relatada · ${validated} com evidência validada` : "Ainda não há oportunidades vencidas elegíveis para medir execução."}</p>
      <p className="text-xs text-muted-foreground">{states.filter(({ record }) => Date.parse(record.cycle.dueAt) > now.getTime()).length} com prazo em aberto · {states.filter(({ state }) => state.excluded).length} exceções aprovadas. Leitura e progresso de implantação são acompanhados separadamente.</p>
    </div>
    <div className="divide-y">{states.map(({ record, state }) => <details key={record.cycle.id} className="py-3">
      <summary className="cursor-pointer">Ciclo de {date(record.cycle.opensAt)} a {date(record.cycle.dueAt)}<span className="ml-2 text-muted-foreground">{state.excluded ? "Exceção aprovada" : state.validated ? "Evidência validada" : state.reported ? "Execução relatada" : "Sem execução relatada"}</span></summary>
      <div className="mt-3 space-y-5">
        <p className="break-all text-xs text-muted-foreground">Referência: {record.cycle.id} · revisão {record.cycle.rule.revision} do acordo · horários de São Paulo</p>
        {record.supervision?.map(event => <div key={event.id} className="space-y-1">
          <p className="text-xs text-muted-foreground">{event.actorName} · {date(event.recordedAt)} · {event.operation === "prazo" ? "Prazo de retorno" : event.operation === "orientar" ? "Orientação da operação" : event.operation === "evidencia" ? event.accepted ? "Evidência aceita" : "Evidência devolvida" : event.accepted ? "Exceção aprovada" : "Exceção recusada"}</p>
          <p className="whitespace-pre-wrap break-words">{event.reason}</p>
          {event.responseDueAt ? <p className="text-xs text-muted-foreground">Retorno até {date(event.responseDueAt)}. O prazo original da oportunidade foi preservado.</p> : null}
        </div>)}
        {record.proposals.map(proposal => <div key={proposal.id} className="space-y-1">
          <p className="text-xs text-muted-foreground">{proposal.actorName} · {date(proposal.createdAt)} · {proposal.status === "pendente" ? Date.parse(proposal.expiresAt) <= now.getTime() ? "Proposta expirada, sem registro" : "Aguardando confirmação, sem registro" : proposal.status === "cancelada" ? "Proposta cancelada" : "Registro confirmado"}</p>
          <div className="whitespace-pre-wrap break-words"><ProposalOperation operation={proposal.operation} /></div>
          <p className="break-all text-xs text-muted-foreground">Registro: {proposal.id}</p>
        </div>)}
        {record.cycle.facts.filter(fact => !record.proposals.some(proposal => proposal.factId === fact.id)).map(fact => <div key={fact.id} className="space-y-1">
          <p className="text-xs text-muted-foreground">Registro da operação · {date(fact.recordedAt)}</p>
          <p>{fact.payload.kind === "execucao_relatada" ? fact.payload.performed ? "Execução relatada" : "Não execução relatada"
            : fact.payload.kind === "leitura_confirmada" ? "Leitura confirmada"
            : fact.payload.kind === "evidencia_revisada" ? fact.payload.accepted ? "Evidência aceita pela operação" : "Evidência devolvida pela operação"
            : fact.payload.kind === "excecao_solicitada" ? "Solicitação de exceção"
            : fact.payload.kind === "excecao_revisada" ? fact.payload.accepted ? "Exceção aprovada pela operação" : "Exceção recusada pela operação" : "Resultado registrado"}</p>
          {"reason" in fact.payload ? <p className="whitespace-pre-wrap break-words">{fact.payload.reason}</p> : null}
          {fact.payload.kind === "execucao_relatada" ? fact.payload.evidence.map(url => <a key={url} className="block break-all underline underline-offset-4" href={url} target="_blank" rel="noopener noreferrer">{url}</a>) : null}
        </div>)}
        {record.messages.length ? <details><summary className="cursor-pointer text-xs text-muted-foreground">Conversa registrada no Slack</summary><ol className="mt-3 space-y-4">{record.messages.map(message => <li key={message.id}>
          <p className="text-xs text-muted-foreground">{message.name} · {message.actor === "agente" ? "Mensagem do agente entregue" : "Mensagem recebida"} · {date(message.at)}</p>
          <p className="mt-1 whitespace-pre-wrap break-words">{message.text}</p>
        </li>)}</ol></details> : null}
      </div>
    </details>)}</div>
  </section>;
}
