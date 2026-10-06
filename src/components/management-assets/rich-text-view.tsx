import { Table } from "@/components/ui/table";
import { Fragment, type ReactNode } from "react";

import type {
  RichTextBlock,
  RichTextDocument,
  RichTextInline,
  RichTextList,
  RichTextParagraph,
} from "@/lib/contracts";
import { getHeadingIds } from "@/lib/data/rich-text";
import { cn } from "@/lib/utils";

// Renderização segura do documento do editor: cada nó vira um elemento React
// com os tokens do sistema. Não existe caminho para HTML livre.

function renderInline(nodes: RichTextInline[] | undefined, keyPrefix: string) {
  if (!nodes) return null;

  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;

    if (node.type === "hardBreak") return <br key={key} />;

    let element: ReactNode = node.text;

    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") {
        element = <strong className="font-semibold text-foreground">{element}</strong>;
      } else if (mark.type === "italic") {
        element = <em>{element}</em>;
      } else {
        const external = /^https?:\/\//i.test(mark.attrs.href);
        element = (
          <a
            href={mark.attrs.href}
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {element}
          </a>
        );
      }
    }

    return <Fragment key={key}>{element}</Fragment>;
  });
}

function Paragraph({
  node,
  id,
  className,
}: {
  node: RichTextParagraph;
  id: string;
  className?: string;
}) {
  if (!node.content?.length) return null;

  return <p className={className}>{renderInline(node.content, id)}</p>;
}

function List({ node, id }: { node: RichTextList; id: string }) {
  const ordered = node.type === "orderedList";
  const ListTag = ordered ? "ol" : "ul";

  return (
    <ListTag
      start={ordered ? node.attrs?.start : undefined}
      className={cn(
        "space-y-2 pl-5",
        ordered
          ? "list-decimal marker:font-mono marker:text-xs marker:text-foreground"
          : "list-disc marker:text-foreground",
      )}
    >
      {node.content.map((item, itemIndex) => (
        <li key={`${id}-${itemIndex}`} className="pl-1">
          {item.content.map((child, childIndex) =>
            child.type === "paragraph" ? (
              <Paragraph
                key={`${id}-${itemIndex}-${childIndex}`}
                node={child}
                id={`${id}-${itemIndex}-${childIndex}`}
              />
            ) : (
              <div key={`${id}-${itemIndex}-${childIndex}`} className="mt-2">
                <List node={child} id={`${id}-${itemIndex}-${childIndex}`} />
              </div>
            ),
          )}
        </li>
      ))}
    </ListTag>
  );
}

function Block({
  block,
  id,
  headingId,
}: {
  block: RichTextBlock;
  id: string;
  headingId?: string;
}) {
  switch (block.type) {
    case "heading":
      return block.attrs.level === 2 ? (
        <h2
          id={headingId}
          className="scroll-mt-24 border-t pt-8 font-heading text-[28px] font-semibold leading-9 tracking-[-0.6px] text-foreground first:border-t-0 first:pt-0"
        >
          {renderInline(block.content, id)}
        </h2>
      ) : (
        <h3
          id={headingId}
          className="scroll-mt-24 pt-2 font-heading text-lg font-semibold leading-7 text-foreground"
        >
          {renderInline(block.content, id)}
        </h3>
      );
    case "paragraph":
      return <Paragraph node={block} id={id} />;
    case "bulletList":
    case "orderedList":
      return <List node={block} id={id} />;
    case "blockquote":
      return (
        <div className="space-y-2 rounded-lg border bg-muted/40 px-4 py-3 text-foreground">
          {block.content.map((child, index) =>
            child.type === "paragraph" ? (
              <Paragraph key={`${id}-${index}`} node={child} id={`${id}-${index}`} />
            ) : (
              <List key={`${id}-${index}`} node={child} id={`${id}-${index}`} />
            ),
          )}
        </div>
      );
    case "table": {
      const [firstRow, ...otherRows] = block.content;
      const hasHeader = firstRow?.content.every((cell) => cell.type === "tableHeader");
      const bodyRows = hasHeader ? otherRows : block.content;

      return (
        <div className="min-w-0">
          <Table className="min-w-[560px] text-sm leading-6">
            {hasHeader && firstRow ? (
              <thead>
                <tr className="text-left text-foreground">
                  {firstRow.content.map((cell, cellIndex) => (
                    <th
                      key={`${id}-h-${cellIndex}`}
                      scope="col"
                      colSpan={cell.attrs?.colspan}
                      rowSpan={cell.attrs?.rowspan}
                      className="text-left font-medium text-foreground"
                    >
                      {cell.content.map((paragraph, paragraphIndex) => (
                        <Paragraph
                          key={`${id}-h-${cellIndex}-${paragraphIndex}`}
                          node={paragraph}
                          id={`${id}-h-${cellIndex}-${paragraphIndex}`}
                        />
                      ))}
                    </th>
                  ))}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {bodyRows.map((row, rowIndex) => (
                <tr key={`${id}-r-${rowIndex}`} >
                  {row.content.map((cell, cellIndex) => {
                    const CellTag = cell.type === "tableHeader" ? "th" : "td";

                    return (
                      <CellTag
                        key={`${id}-r-${rowIndex}-${cellIndex}`}
                        colSpan={cell.attrs?.colspan}
                        rowSpan={cell.attrs?.rowspan}
                        className="px-4 py-3 text-left align-top font-normal"
                      >
                        {cell.content.map((paragraph, paragraphIndex) => (
                          <Paragraph
                            key={`${id}-r-${rowIndex}-${cellIndex}-${paragraphIndex}`}
                            node={paragraph}
                            id={`${id}-r-${rowIndex}-${cellIndex}-${paragraphIndex}`}
                          />
                        ))}
                      </CellTag>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      );
    }
  }
}

export function RichTextView({
  content,
  className,
}: {
  content: RichTextDocument;
  className?: string;
}) {
  const headingIds = getHeadingIds(content);

  return (
    <div
      className={cn(
        "space-y-5 text-[15px] leading-[25px] text-muted-foreground",
        className,
      )}
    >
      {content.content.map((block, index) => (
        <Block
          key={`block-${index}`}
          block={block}
          id={`block-${index}`}
          headingId={block.type === "heading" ? headingIds.get(block) : undefined}
        />
      ))}
    </div>
  );
}
