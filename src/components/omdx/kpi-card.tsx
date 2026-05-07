import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "flat";

type KpiCardProps = {
  label: string;
  value: string;
  trend?: Trend;
  trendValue?: string;
  caption?: string;
  hint?: string;
};

const trendStyles: Record<Trend, string> = {
  up: "text-[var(--chart-positive)]",
  down: "text-[var(--chart-negative)]",
  flat: "text-muted-foreground",
};

const trendIcon: Record<Trend, React.ComponentType<{ className?: string }>> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
};

export function KpiCard({ label, value, trend, trendValue, caption, hint }: KpiCardProps) {
  const Icon = trend ? trendIcon[trend] : null;

  return (
    <Card className="gap-2">
      <CardHeader className="pb-0">
        <CardTitle className="text-muted-foreground flex items-center justify-between text-sm font-normal">
          <span>{label}</span>
          {trend && trendValue && Icon && (
            <span
              className={cn(
                "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                trendStyles[trend],
              )}
            >
              <Icon className="size-3" />
              {trendValue}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="text-foreground text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {caption && (
          <p className="text-foreground text-sm font-medium">{caption}</p>
        )}
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}
