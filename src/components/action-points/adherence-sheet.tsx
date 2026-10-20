import Image from "next/image";
import { Clock } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "@/lib/data/action-points-adherence-example";
import { cn } from "@/lib/utils";

import { HealthBadge } from "./adherence-ui";

export type AdherenceSelection = {
  category: AdherenceCategory;
  actionPoint: AdherenceActionPoint;
};

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
        {selection && category && ap && (
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
                {ap.why}
              </SheetDescription>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-6">
              <h3 className="mb-5 text-sm font-medium">Atualizações</h3>
              {ap.checkIns.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma conversa registrada ainda.
                </p>
              ) : (
                <ol aria-label="Conversa com o agente" className="flex flex-col">
                  {ap.checkIns.map((event, index) => (
                    <li key={index} className="relative flex gap-3 pb-6 last:pb-0">
                      {index < ap.checkIns.length - 1 && (
                        <span aria-hidden="true" className="absolute top-10 bottom-1 left-[18px] w-px bg-border" />
                      )}
                      {event.fromLeader ? (
                        <Avatar className="size-9">
                          <AvatarImage src={event.source === "slack" ? undefined : adherenceLeaderPhotos[event.author]} alt="" />
                          <AvatarFallback>
                            {event.author.split(" ").map((name) => name[0]).slice(0, 2).join("")}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full border border-primary bg-primary">
                          <Image src="/action-points/agent-mark.svg" width={21.445} height={13} alt="" />
                        </span>
                      )}
                      <div className="min-w-0 max-w-[460px] flex-1 pt-0.5">
                        <p className="text-sm leading-5 text-foreground">
                          <span className={cn("font-medium", (!event.fromLeader || event.message.length > 50) && "block")}>{event.fromLeader ? event.author : "Agente DirectScal"}</span>{" "}
                          <span className="whitespace-pre-wrap break-words text-muted-foreground">{event.message}</span>
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                          <span className={cn(
                            "inline-flex rounded-full px-2 py-0.5 leading-4",
                            event.fromLeader ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary dark:text-ap-comunicacao",
                          )}>
                            {event.source === "slack" ? event.fromLeader ? "Mensagem recebida" : "Mensagem do agente entregue" : event.fromLeader ? "Resposta" : "Pergunta do agente"}
                          </span>
                          <span className="text-muted-foreground">{event.when}</span>
                        </div>
                        {event.context ? <p className="mt-1 text-xs text-muted-foreground">{event.context}</p> : null}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
