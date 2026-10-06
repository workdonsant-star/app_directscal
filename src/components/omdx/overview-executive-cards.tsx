"use client";

import { ArrowDownRight, ArrowUpRight, Info, Minus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ExecutiveMetric } from "@/lib/data/omdx-overview-analytics";
import { cn } from "@/lib/utils";

export type ExecutiveCardMetric = Omit<
  ExecutiveMetric,
  "classification" | "technicalDetail"
> & {
  classification: ExecutiveMetric["classification"] | "Sem dados";
  technicalDetail?: string;
};

type OverviewExecutiveCardsProps = {
  layout?: "grid" | "stack";
  metrics: ExecutiveCardMetric[];
  presentation?: "gauge" | "number" | "overview";
};

function getStatusColor(status: ExecutiveCardMetric["classification"]) {
  const colorByStatus: Record<string, string> = {
    Consistente: "var(--omdx-status-consistente)",
    Inconsistente: "var(--omdx-status-inconsistente)",
    Atenção: "var(--omdx-status-atencao)",
    Crítico: "var(--omdx-status-critico)",
    "Sem dados": "var(--muted-foreground)",
  };

  return colorByStatus[status] ?? colorByStatus["Sem dados"];
}

function parseMetricValue(value: string) {
  const numeric = Number(value.replace(/[^\d,-]/g, "").replace(",", "."));

  return Number.isFinite(numeric) ? numeric : 0;
}

function getGaugeMax(metric: ExecutiveCardMetric) {
  if (metric.suffix === "/100") return 100;

  const value = parseMetricValue(metric.value);

  if (value <= 5) return 5;
  if (value <= 10) return 10;
  if (value <= 50) return 50;

  return Math.ceil(value / 100) * 100;
}

function getGaugeValue(metric: ExecutiveCardMetric) {
  const max = getGaugeMax(metric);

  return Math.min(parseMetricValue(metric.value), max);
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(centerX, centerY, radius, startAngle);
  const end = polarToCartesian(centerX, centerY, radius, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    1,
    end.x,
    end.y,
  ].join(" ");
}

function GaugeChart({ metric }: { metric: ExecutiveCardMetric }) {
  const value = getGaugeValue(metric);
  const max = getGaugeMax(metric);
  const progress = max > 0 ? Math.max(0, Math.min(value / max, 1)) : 0;
  const startAngle = 200;
  const endAngle = 340;
  const progressEndAngle = startAngle + (endAngle - startAngle) * progress;

  return (
    <div
      className="relative h-24"
      aria-label={`${metric.title}: ${metric.value}${metric.suffix ?? ""}`}
      role="img"
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full"
        viewBox="0 0 160 92"
      >
        <path
          d={describeArc(80, 70, 52, startAngle, endAngle)}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="10"
          strokeLinecap="butt"
        />
        {progress > 0 && (
          <path
            d={describeArc(80, 70, 52, startAngle, progressEndAngle)}
            fill="none"
            stroke={getStatusColor(metric.classification)}
            strokeWidth="10"
            strokeLinecap="butt"
          />
        )}
      </svg>
      <p className="pointer-events-none absolute inset-x-0 top-[50%] flex items-baseline justify-center gap-1 tabular-nums">
        <span className="text-foreground text-2xl font-semibold tracking-tight">
          {metric.value}
        </span>
        {metric.suffix && (
          <span className="text-muted-foreground text-xs font-medium">
            {metric.suffix}
          </span>
        )}
      </p>
    </div>
  );
}

function getMetricDetail(metric: ExecutiveCardMetric) {
  return metric.technicalDetail ?? metric.description;
}

function MetricComparison({
  comparison,
  compact = false,
}: {
  comparison: NonNullable<ExecutiveCardMetric["comparison"]>;
  compact?: boolean;
}) {
  const direction =
    comparison.percentage > 0
      ? "positive"
      : comparison.percentage < 0
        ? "negative"
        : "neutral";
  const DirectionIcon =
    direction === "positive"
      ? ArrowUpRight
      : direction === "negative"
        ? ArrowDownRight
        : Minus;
  const improved = comparison.lowerIsBetter
    ? comparison.percentage < 0
    : comparison.percentage > 0;
  const color =
    direction === "neutral"
      ? "var(--muted-foreground)"
      : improved
        ? "var(--omdx-status-consistente)"
        : "var(--omdx-status-atencao)";
  const formattedPercentage = Math.abs(comparison.percentage).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  );

  return (
    <p
      className={cn(
        "flex items-center",
        compact ? "gap-0.5" : "mt-1 gap-1.5 text-xs",
      )}
    >
      <span
        className={cn(
          "flex items-center gap-0.5 font-medium tabular-nums",
          compact && "text-xs leading-4",
        )}
        style={{ color }}
      >
        <DirectionIcon aria-hidden="true" className="size-3.5" />
        {formattedPercentage}%
      </span>
      <span
        className={cn(
          "text-muted-foreground",
          compact && "text-[10px] leading-[13px]",
        )}
      >
        {comparison.label}
      </span>
    </p>
  );
}

export function OverviewExecutiveCards({
  layout = "grid",
  metrics,
  presentation = "gauge",
}: OverviewExecutiveCardsProps) {
  if (metrics.length === 0) return null;

  return (
    <TooltipProvider delay={120}>
      <section
        className={cn(
          layout === "stack"
            ? "flex h-[434px] flex-col justify-between"
            : "grid gap-4 sm:grid-cols-2",
          layout === "grid" &&
            (metrics.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4"),
          layout === "grid" && presentation === "overview" && "sm:grid-cols-3",
        )}
      >
        {metrics.map((metric) => (
          <Card
            key={metric.title}
            size="sm"
            className={cn(
              presentation === "number"
                ? "h-[128px] gap-1 rounded-[5px] border-0 bg-sidebar py-2 shadow-none ring-0"
                : presentation === "overview"
                  ? "h-[109px] gap-3 rounded-[5px] border-0 bg-sidebar px-5 py-2.5 shadow-none ring-0 data-[size=sm]:py-2.5"
                : "gap-2",
            )}
          >
            <CardHeader
              className={cn(
                "flex flex-row items-start justify-between gap-3 pb-0",
                presentation === "overview" && "px-0",
              )}
            >
              <CardTitle
                className={cn(
                  "text-muted-foreground font-normal",
                  presentation === "overview"
                    ? "text-[10px] leading-[13px] group-data-[size=sm]/card:text-[10px]"
                    : "text-sm",
                )}
              >
                {metric.title}
              </CardTitle>
              {presentation === "gauge" ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        aria-label={`Detalhes de ${metric.title}`}
                        title={getMetricDetail(metric)}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon-xs" }),
                          "text-muted-foreground hover:text-foreground -mt-1"
                        )}
                      />
                    }
                  >
                    <Info className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="end"
                    className="max-w-72 text-left leading-relaxed"
                  >
                    {getMetricDetail(metric)}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </CardHeader>
            <CardContent
              className={presentation === "overview" ? "px-0" : undefined}
            >
              {presentation === "gauge" ? (
                <GaugeChart metric={metric} />
              ) : (
                <div
                  className={
                    presentation === "overview"
                      ? "flex flex-col gap-3"
                      : "py-2"
                  }
                >
                  <p className="flex items-baseline justify-start gap-1 tabular-nums">
                    <span
                      className={cn(
                        "text-foreground tracking-tight",
                        presentation === "overview"
                          ? "text-[40px] leading-9 font-light tracking-[-0.75px]"
                          : "text-3xl font-semibold",
                      )}
                    >
                      {metric.value}
                    </span>
                    {metric.suffix && presentation !== "overview" ? (
                      <span className="text-muted-foreground text-sm font-medium">
                        {metric.suffix}
                      </span>
                    ) : null}
                  </p>
                  {metric.comparison ? (
                    <MetricComparison
                      comparison={metric.comparison}
                      compact={presentation === "overview"}
                    />
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </section>
    </TooltipProvider>
  );
}
