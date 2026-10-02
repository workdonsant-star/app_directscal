import { RefreshCcw } from "lucide-react";

import { DocumentTableOfContents } from "@/components/document-table-of-contents";
import { RichTextView } from "@/components/management-assets/rich-text-view";
import { Badge } from "@/components/ui/badge";
import { managementAssetTypeLabels, type ManagementAssetDocument } from "@/lib/contracts";
import { getRichTextOutline } from "@/lib/data/rich-text";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

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
        <div className="sticky top-20 px-4 pt-3">
          {tableOfContents.length > 0 ? (
            <DocumentTableOfContents
              ariaLabel={`Navegação do ${typeLabel}`}
              items={tableOfContents}
            />
          ) : null}
        </div>
      </aside>

      <article className="min-w-0">
        <header className="border-b pb-8">
          <div className="flex flex-wrap items-center gap-2">
            {asset.category ? (
              <Badge className="rounded-[5px] bg-[rgba(173,229,23,0.36)] text-foreground">
                {asset.category}
              </Badge>
            ) : null}
            <p className="text-sm leading-5 text-muted-foreground">
              Atualizado em {dateFormatter.format(new Date(asset.updatedAt))}
            </p>
          </div>

          <h1 className="mt-4 font-heading text-4xl font-semibold leading-10 tracking-tight">
            {asset.title}
          </h1>
          <p className="mt-[10px] max-w-2xl text-base leading-7 text-muted-foreground">
            {asset.summary}
          </p>
        </header>

        <dl className="grid grid-cols-3 gap-4 border-b py-5">
          <div className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Líder responsável
            </dt>
            <dd className="mt-2 text-sm font-medium">{asset.operationalOwner}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Versão
            </dt>
            <dd className="mt-2 text-sm font-medium tabular-nums">
              {asset.versionNumber}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              <RefreshCcw aria-hidden="true" className="size-3.5" />
              Revisão
            </dt>
            <dd className="mt-2 text-sm font-medium">{asset.reviewCycle}</dd>
          </div>
        </dl>

        <RichTextView content={asset.content} className="py-8" />
      </article>
    </div>
  );
}
