import type { Dimension } from "@/lib/types";

type DimensionsSummaryProps = {
  dimensions: Dimension[];
};

export function DimensionsSummary({ dimensions }: DimensionsSummaryProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {dimensions.map((dimension) => (
        <article
          key={dimension.id}
          className="rounded-lg border bg-background p-3"
        >
          <div className="flex items-start gap-3">
            <span className="text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-medium tabular-nums">
              {dimension.number}
            </span>
            <div className="min-w-0">
              <h3 className="text-foreground text-sm font-medium">
                {dimension.shortName}
              </h3>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                {dimension.question}
              </p>
              <p className="text-muted-foreground/80 mt-2 text-xs leading-relaxed">
                {dimension.description}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
