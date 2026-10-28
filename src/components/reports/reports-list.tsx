import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Diagnostic } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function getReportDate(diagnostic: Diagnostic) {
  return diagnostic.closedAt ?? diagnostic.updatedAt;
}

function creatorInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ReportsList({ diagnostics, baseHref = "/relatorios" }: { diagnostics: Diagnostic[]; baseHref?: string }) {
  if (diagnostics.length === 0) {
    return (
      <div className="rounded-lg bg-card px-6 py-12 text-center">
        <p className="font-heading text-base font-medium">
          Nenhum relatório disponível
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Os relatórios aparecem aqui depois que a entrega é publicada pela Directscal.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {diagnostics.map((diagnostic) => {
        const reportDate = getReportDate(diagnostic);

        return (
          <Link
            key={diagnostic.id}
            href={`${baseHref}/${diagnostic.id}`}
            className="group rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label={`Abrir relatório ${diagnostic.name}`}
          >
            <Card className="h-full min-h-[277px] rounded-[5px] bg-card ring-0 transition-colors duration-150 group-hover:bg-muted/50 group-active:bg-muted">
              <CardHeader className="gap-3">
                <div className="flex items-start justify-between gap-3">
                  <Badge className="h-5 rounded-[5px] px-2 text-xs leading-4" variant="outline">
                    Diagnóstico
                  </Badge>
                  <ChevronRight
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground"
                  />
                </div>

                <CardTitle className="line-clamp-2 text-lg leading-7">
                  {diagnostic.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-6">
                <div>
                  {diagnostic.id === "exemplo-acme" && (
                    <p className="line-clamp-3 text-sm leading-5 text-muted-foreground">Empresa fictícia · Relatório de exemplo</p>
                  )}
                </div>
                <div className="space-y-3 border-t pt-4">
                  {diagnostic.creator ? (
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar size="sm">
                        {diagnostic.creator.avatarUrl && (
                          <AvatarImage
                            src={diagnostic.creator.avatarUrl}
                            alt=""
                          />
                        )}
                        <AvatarFallback>
                          {creatorInitials(diagnostic.creator.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm text-foreground">
                        {diagnostic.creator.name}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Responsável não identificado
                    </p>
                  )}

                  <p className="text-sm leading-5 text-muted-foreground">
                    <time dateTime={reportDate} className="tabular-nums">
                      {dateFormatter.format(new Date(reportDate))}
                    </time>
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
