import { RefreshCcw } from "lucide-react";

import { DocumentTableOfContents } from "@/components/document-table-of-contents";
import { Badge } from "@/components/ui/badge";
import type { ManagementSopDocument } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function SopDocumentView({ sop }: { sop: ManagementSopDocument }) {
  const tableOfContents = sop.document.sections.map((section) => ({
    href: `#${section.id}`,
    label: section.title,
  }));

  return (
    <div className="grid w-full max-w-[1028px] grid-cols-1 lg:grid-cols-[220px_minmax(0,768px)] lg:gap-10">
      <aside className="hidden lg:block">
        <div className="sticky top-20 px-4 pt-3">
          <DocumentTableOfContents
            ariaLabel="Navegação do SOP"
            items={tableOfContents}
          />
        </div>
      </aside>

      <article className="min-w-0">
        <header className="border-b pb-8">
          <div className="flex flex-wrap items-center gap-2">
            {sop.category ? (
              <Badge className="rounded-[5px] bg-[rgba(173,229,23,0.36)] text-foreground">
                {sop.category}
              </Badge>
            ) : null}
            <p className="text-sm leading-5 text-muted-foreground">
              Atualizado em {dateFormatter.format(new Date(sop.updatedAt))}
            </p>
          </div>

          <h1 className="mt-4 font-heading text-4xl font-semibold leading-10 tracking-tight">
            {sop.title}
          </h1>
          <p className="mt-[10px] max-w-2xl text-base leading-7 text-muted-foreground">
            {sop.summary}
          </p>
        </header>

        <dl className="grid grid-cols-3 gap-4 border-b py-5">
          <div className="min-w-0">
            <dt className="font-mono text-xs uppercase tracking-normal text-muted-foreground">
              Líder responsável
            </dt>
            <dd className="mt-2 text-sm font-medium">
              {sop.document.operationalOwner}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Versão
            </dt>
            <dd className="mt-2 text-sm font-medium tabular-nums">
              {sop.document.version}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              <RefreshCcw aria-hidden="true" className="size-3.5" />
              Revisão
            </dt>
            <dd className="mt-2 text-sm font-medium">
              {sop.document.reviewCycle}
            </dd>
          </div>
        </dl>

        {sop.document.sections.map((section) => {
          const hasList = section.blocks.some((block) => block.type === "list");
          const hasDivider = hasList || section.id === "criterio-de-pronto";

          return (
            <section
              key={section.id}
              id={section.id}
              className={`scroll-mt-24 py-5 ${hasDivider ? "border-b" : ""}`}
            >
              <h2 className="font-heading text-[32px] font-semibold leading-10 tracking-[-0.9px]">
                {section.title}
              </h2>

              <div
                className={`text-muted-foreground ${
                  hasList
                    ? "mt-5 pl-5 text-sm leading-7"
                    : section.id === "criterio-de-pronto"
                      ? "pt-5 text-sm leading-7"
                      : "mt-2.5 text-[15px] leading-[25px]"
                }`}
              >
                {section.blocks.map((block, blockIndex) => {
                  if (block.type === "paragraph") {
                    return <p key={`${section.id}-${blockIndex}`}>{block.text}</p>;
                  }

                  if (block.type === "table") {
                    return (
                      <div
                        key={`${section.id}-${blockIndex}`}
                        className="-mx-5 mt-5 overflow-x-auto"
                      >
                        <table className="w-full min-w-[640px] border-collapse text-sm leading-7">
                          <thead>
                            <tr className="border-b text-left text-foreground">
                              {block.columns.map((column) => (
                                <th
                                  key={column}
                                  scope="col"
                                  className="px-5 py-3 font-medium"
                                >
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {block.rows.map((row, rowIndex) => (
                              <tr
                                key={`${section.id}-${blockIndex}-${rowIndex}`}
                                className="border-b last:border-b-0"
                              >
                                {row.map((cell, cellIndex) => (
                                  <td
                                    key={`${section.id}-${blockIndex}-${rowIndex}-${cellIndex}`}
                                    className="px-5 py-3 align-top"
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  const List = block.ordered ? "ol" : "ul";

                  return (
                    <List
                      key={`${section.id}-${blockIndex}`}
                      className={
                        block.ordered
                          ? "space-y-0 marker:font-mono marker:text-xs marker:text-foreground"
                          : "space-y-0 marker:text-foreground"
                      }
                    >
                      {block.items.map((item) => (
                        <li
                          key={item}
                          className={`${
                            block.ordered ? "list-decimal" : "list-disc"
                          } pl-2 [&+li]:pt-3`}
                        >
                          {item}
                        </li>
                      ))}
                    </List>
                  );
                })}
              </div>
            </section>
          );
        })}
      </article>
    </div>
  );
}
