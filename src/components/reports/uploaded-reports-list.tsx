"use client";

import { ChevronRight, FileText } from "lucide-react";

import { CustomerDocumentDownloadLink } from "@/components/management-assets/customer-document-download-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CustomerDocument } from "@/lib/contracts/customer-documents";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function UploadedReportsList({ documents }: { documents: CustomerDocument[] }) {
  if (!documents.length) {
    return <div className="rounded-lg bg-card px-6 py-12 text-center">
      <p className="font-heading text-base font-medium">Nenhum diagnóstico disponível</p>
      <p className="mt-1 text-sm text-muted-foreground">Os diagnósticos aparecem aqui quando a Directscal envia o PDF.</p>
    </div>;
  }

  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
    {documents.map(document => <CustomerDocumentDownloadLink
      key={document.id}
      document={document}
      downloadLabel={`Baixar diagnóstico ${document.title}`}
      className="group h-full w-full max-w-none whitespace-normal rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full min-h-[277px] rounded-[5px] bg-card ring-0 transition-colors duration-150 group-hover:bg-muted/50 group-active:bg-muted">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-3">
            <Badge className="h-5 rounded-[5px] px-2 text-xs leading-4" variant="outline">Diagnóstico</Badge>
            <ChevronRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground" />
          </div>
          <CardTitle className="line-clamp-2 text-lg leading-7">{document.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-6">
          <div />
          <div className="space-y-3 border-t pt-4">
            <div className="flex min-w-0 items-center gap-2 text-sm text-foreground">
              <FileText aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">PDF · {document.fileName}</span>
            </div>
            <p className="text-sm leading-5 text-muted-foreground">
              <time dateTime={document.publishedAt} className="tabular-nums">{dateFormatter.format(new Date(document.publishedAt))}</time>
            </p>
          </div>
        </CardContent>
      </Card>
    </CustomerDocumentDownloadLink>)}
  </div>;
}
