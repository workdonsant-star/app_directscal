import { getLayerColor } from "@/components/omdx/chart-colors";
import { getRespondentGroups } from "@/lib/data/omdx-domain";
import type { RespondentGroup } from "@/lib/types";

type LayerInsightComparisonProps = {
  scores: Record<RespondentGroup, number | null>;
};

export function LayerInsightComparison({ scores }: LayerInsightComparisonProps) {
  const respondentGroups = getRespondentGroups();

  return (
    <div className="flex flex-col gap-4">
      {respondentGroups.map((group) => {
        const score = scores[group.id];
        const widthPct = score === null ? 0 : (score / 5) * 100;

        return (
          <div key={group.id} className="grid gap-1">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {group.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {group.description}
                </p>
              </div>
              <span className="text-base font-semibold tabular-nums text-foreground">
                {score === null ? "—" : score.toFixed(1)}
              </span>
            </div>
            <div className="relative h-2 overflow-hidden bg-muted">
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  backgroundColor:
                    score === null
                      ? undefined
                      : getLayerColor(group.id),
                  width: `${widthPct}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
