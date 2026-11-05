import Image from "next/image";
import { Clock } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { adherenceLeaderPhotos } from "@/lib/data/action-points-adherence-example";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  AdherenceActionPoint,
  AdherenceCategory,
  AdherenceCheckIn,
} from "@/lib/data/action-points-adherence-example";
import { cn } from "@/lib/utils";

import { HealthBadge } from "./adherence-ui";

export type AdherenceSelection = {
  category: AdherenceCategory;
  actionPoint: AdherenceActionPoint;
};

const resultMeta: Record<NonNullable<AdherenceCheckIn["result"]>, { label: string; className: string }> = {
  validado: { label: "Validado", className: "bg-ap-positive/15 text-ap-positive-foreground" },
  duvida: { label: "Dúvida", className: "bg-[var(--omdx-status-atencao)]/15 text-foreground" },
  nao_respondido: { label: "Não respondido", className: "bg-destructive/10 text-destructive" },
  aguardando: { label: "Aguardando resposta", className: "bg-secondary text-secondary-foreground" },
  aguardando_confirmacao: { label: "Aguardando confirmação", className: "bg-secondary text-secondary-foreground" },
  parcial: { label: "Parcial", className: "bg-[var(--omdx-status-atencao)]/15 text-foreground" },
  nao_executado: { label: "Não executado", className: "bg-destructive/10 text-destructive" },
  bloqueado: { label: "Bloqueado", className: "bg-destructive/10 text-destructive" },
  inconclusivo: { label: "Resposta inconclusiva", className: "bg-secondary text-secondary-foreground" },
};

function CheckInTimeline({ category, ap, manual = false }: { category: AdherenceCategory; ap: AdherenceActionPoint; manual?: boolean }) {
  if (ap.checkIns.length === 0) {
    return <p className="text-sm text-muted-foreground">{manual ? "Nenhuma interação registrada para esta ação." : "Nenhuma conversa registrada ainda."}</p>;
  }

  return <ol aria-label={manual ? "Atualizações do acompanhamento" : "Conversa com o agente"} className="flex flex-col">
    {ap.checkIns.map((event, index) => (
      <li key={`${event.when}:${index}`} className="relative flex gap-3 pb-6 last:pb-0">
        {index < ap.checkIns.length - 1 && <span aria-hidden="true" className="absolute top-10 bottom-1 left-[18px] w-px bg-border" />}
        {event.fromLeader ? (
          <Avatar className="size-9">
            <AvatarImage src={(category.leader?.name === event.author ? category.leader.avatarUrl : undefined) ?? (event.source ? undefined : adherenceLeaderPhotos[event.author])} alt="" />
            <AvatarFallback>{event.author.split(" ").map((name) => name[0]).slice(0, 2).join("")}</AvatarFallback>
          </Avatar>
        ) : (
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full border border-primary bg-primary">
            <Image src="/action-points/agent-mark.svg" width={21.445} height={13} alt="" />
          </span>
        )}
        <div className="min-w-0 max-w-[460px] flex-1 pt-0.5">
          <p className="text-sm leading-5 text-foreground">
            <span className="block font-medium">{event.fromLeader ? event.author : "Agente DirectScal"}</span>
            <span className="mt-1 block whitespace-pre-wrap break-words text-muted-foreground">{event.message}</span>
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {event.source !== "slack" && <span className={cn("inline-flex rounded-full px-2 py-0.5 leading-4", event.fromLeader ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary dark:text-ap-comunicacao")}>{event.fromLeader ? "Resposta" : "Pergunta do agente"}</span>}
            {event.result ? <Badge variant="secondary" className={cn("font-normal", resultMeta[event.result].className)}>{resultMeta[event.result].label}</Badge> : null}
            <span className="text-muted-foreground">{event.when}</span>
          </div>
          {event.context ? <p className="mt-1 text-xs text-muted-foreground">{event.context}</p> : null}
        </div>
      </li>
    ))}
  </ol>;
}

function ManualDetails({ category, ap }: { category: AdherenceCategory; ap: AdherenceActionPoint }) {
  const details = ap.manualDetails;
  if (!details) return null;
  const deadline = details.deadline ? details.deadline.split("-").reverse().join("/") : ap.frequency === "Pontual" ? "Sem prazo" : "Sem encerramento";
  return <>
    <SheetHeader className="shrink-0 gap-3 px-6 pt-[43px] pb-5">
      <div className="flex flex-wrap items-center gap-4 pr-8 text-xs text-muted-foreground"><span>{ap.checkIns.length ? ap.eventLabel : "Não iniciado"}</span><span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" aria-hidden="true" />{ap.frequency}</span></div>
      <SheetTitle className="max-w-[371px] pr-2 text-ui-section text-balance">{ap.name}</SheetTitle>
      <SheetDescription className="max-w-[531px] text-sm leading-5">{details.reason}</SheetDescription>
    </SheetHeader>
    <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 text-sm">
      <h3 className="mb-5 font-medium">Atualizações</h3>
      <CheckInTimeline category={category} ap={ap} manual />
      <details className="mt-8 border-t border-border pt-5">
        <summary className="cursor-pointer rounded-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Detalhes da ação</summary>
        <div className="mt-5 space-y-5">
          <dl className="grid grid-cols-2 gap-4"><div><dt className="text-xs text-muted-foreground">Responsável</dt><dd>{category.leader?.name ?? "Sem responsável"}</dd></div><div><dt className="text-xs text-muted-foreground">Prazo</dt><dd className="tabular-nums">{deadline}</dd></div></dl>
          <div><h4 className="font-medium">Ativo de gestão</h4><p className="mt-1 text-muted-foreground">{category.name}{details.assetAvailable ? "" : " · Indisponível"}</p></div>
          <div><h4 className="font-medium">O que fazer</h4><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{details.action}</p></div>
          <div><h4 className="font-medium">Papel do ativo na continuidade</h4><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{details.continuity}</p></div>
        </div>
      </details>
    </div>
  </>;
}

export function AdherenceSheet({
  selection,
  onClose,
}: {
  selection: AdherenceSelection | null;
  onClose: () => void;
}) {
  const open = selection !== null;
  const { category, actionPoint: ap } = selection ?? {};

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:w-[640px] data-[side=right]:sm:max-w-[min(640px,100vw)]">
        {selection && category && ap && (ap.manualDetails ? <ManualDetails category={category} ap={ap} /> : (
          <>
            <SheetHeader className="shrink-0 gap-3 px-6 pt-[43px] pb-5">
              <div className="flex flex-wrap items-center gap-4 pr-8 text-xs text-muted-foreground">
                <HealthBadge health={ap.health} />
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {ap.frequency}
                </span>
              </div>
              <SheetTitle className="max-w-[371px] pr-2 text-ui-section text-balance">
                {ap.name}
              </SheetTitle>
              <SheetDescription className="max-w-[531px] text-sm leading-5">
                {ap.description ?? ap.why}
              </SheetDescription>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-6">
              {ap.implementation ? <dl className="mb-6 grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-xs text-muted-foreground">Responsável</dt><dd>{category.leader?.name ?? "Sem responsável"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Etapa da implantação</dt><dd>{ap.implementation.stage}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Prazo acordado</dt><dd className="tabular-nums">{ap.implementation.dueOn ? ap.implementation.dueOn.split("-").reverse().join("/") : "Não definido"}</dd><dd className="text-xs text-muted-foreground">Sugestão publicada: {ap.implementation.suggestedDeadline}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Andamento da implantação</dt><dd className="tabular-nums">{ap.implementation.progress === null ? "Não informado" : `${ap.implementation.progress}%`}</dd><dd className="text-xs text-muted-foreground">Não mede execução recorrente</dd></div>
              </dl> : null}
              {ap.description && ap.why ? <div className="mb-6 space-y-2">
                <h3 className="text-sm font-medium">Leitura que orientou a ação</h3>
                <p className="whitespace-pre-wrap text-sm leading-5 text-muted-foreground">{ap.why}</p>
              </div> : null}
              <h3 className="mb-5 text-sm font-medium">Atualizações</h3>
              <CheckInTimeline category={category} ap={ap} />
            </div>
          </>
        ))}
      </SheetContent>
    </Sheet>
  );
}
