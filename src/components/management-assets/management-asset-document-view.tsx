import { Download, RefreshCcw } from "lucide-react";

import { DocumentTableOfContents } from "@/components/document-table-of-contents";
import { RichTextView } from "@/components/management-assets/rich-text-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { managementAssetTypeLabels, type ManagementAssetDocument } from "@/lib/contracts";
import { getRichTextOutline } from "@/lib/data/rich-text";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function DownloadButton({ asset }: { asset: ManagementAssetDocument }) {
  return (
    <Button
      variant="secondary"
      nativeButton={false}
      render={<a href={`/ativos-de-gestao/download/${asset.type}/${asset.id}`} download />}
    >
      <Download aria-hidden="true" className="size-4" />
      Baixar MD
    </Button>
  );
}

export function ManagementAssetDocumentView({
  asset,
}: {
  asset: ManagementAssetDocument;
}) {
  const tableOfContents = getRichTextOutline(asset.content)
    .filter((item) => item.level === 2)
    .map((item) => ({ href: `#${item.id}`, label: item.label }));
  const typeLabel = managementAssetTypeLabels[asset.type];

  return (
    <div className="grid w-full max-w-[1028px] grid-cols-1 lg:grid-cols-[220px_minmax(0,768px)] lg:gap-10">
      <aside className="hidden lg:block">
        <div className="sticky top-8 px-4">
          {tableOfContents.length > 0 ? (
            <DocumentTableOfContents
              ariaLabel={`Navegação do ${typeLabel}`}
              items={tableOfContents}
            />
          ) : null}
          <div className="mt-6">
            <DownloadButton asset={asset} />
          </div>
        </div>
      </aside>

      <article className="min-w-0">
        <div className="mb-6 lg:hidden">
          <DownloadButton asset={asset} />
        </div>
        <header className="border-b pb-8">
          <div className="flex flex-wrap items-center gap-2">
            {asset.category ? (
              <Badge className="rounded-[5px] bg-[rgba(173,229,23,0.36)] text-foreground">
                {asset.category}
              </Badge>
            ) : null}
          </div>

          <h1 className="mt-4 font-doc-heading text-doc-title">
            {asset.title}
          </h1>
          <p className="mt-[10px] max-w-2xl font-doc text-base leading-7 text-muted-foreground">
            {asset.summary}
          </p>
        </header>

        <dl className="grid grid-cols-2 gap-4 border-b py-5 sm:grid-cols-3 xl:grid-cols-[1fr_0.4fr_0.9fr_1.2fr_1fr]">
          <div className="min-w-0">
            <dt className="font-label text-doc-label text-muted-foreground">
              Líder responsável
            </dt>
            <dd className="mt-2 text-sm font-medium">{asset.operationalOwner}</dd>
          </div>
          <div className="min-w-0">
            <dt className="font-label text-doc-label text-muted-foreground">
              Versão
            </dt>
            <dd className="mt-2 text-sm font-medium tabular-nums">
              {asset.versionNumber}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="flex items-center gap-2 font-label text-doc-label text-muted-foreground">
              <RefreshCcw aria-hidden="true" className="size-3.5" />
              Revisão
            </dt>
            <dd className="mt-2 text-sm font-medium">{asset.reviewCycle}</dd>
          </div>
          <div className="min-w-0">
            <dt className="font-label text-doc-label text-muted-foreground">
              Atualizado em
            </dt>
            <dd className="mt-2 text-sm font-medium tabular-nums">
              <time dateTime={asset.updatedAt}>
                {dateFormatter.format(new Date(asset.updatedAt))}
              </time>
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-label text-doc-label text-muted-foreground">
              Editado por
            </dt>
            <dd className="mt-2 break-words text-sm font-medium">
              {asset.lastEditedBy ?? "Não registrado"}
            </dd>
          </div>
        </dl>

        <RichTextView
          content={asset.content}
          className="py-8"
          callouts={asset.type === "sop"}
        />
      </article>
    </div>
  );
}
