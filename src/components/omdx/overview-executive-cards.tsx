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
  comparison?: {
    label: string;
    lowerIsBetter?: boolean;
    percentage: number;
  };
  technicalDetail?: string;
};

type OverviewExecutiveCardsProps = {
  metrics: ExecutiveCardMetric[];
  presentation?: "gauge" | "number";
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
}: {
  comparison: NonNullable<ExecutiveCardMetric["comparison"]>;
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
    <p className="mt-1 flex items-center gap-1.5 text-xs">
      <span
        className="flex items-center gap-0.5 font-medium tabular-nums"
        style={{ color }}
      >
        <DirectionIcon aria-hidden="true" className="size-3.5" />
        {formattedPercentage}%
      </span>
      <span className="text-muted-foreground">{comparison.label}</span>
    </p>
  );
}

export function OverviewExecutiveCards({
  metrics,
  presentation = "gauge",
}: OverviewExecutiveCardsProps) {
  if (metrics.length === 0) return null;

  return (
    <TooltipProvider delay={120}>
      <section
        className={cn(
          "grid gap-4 sm:grid-cols-2",
          metrics.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4",
        )}
      >
        {metrics.map((metric) => (
          <Card
            key={metric.title}
            size="sm"
            className={cn(
              presentation === "number" ? "gap-1 py-2" : "gap-2",
              presentation === "number" && "rounded-[5px]",
            )}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-0">
              <CardTitle className="text-muted-foreground text-sm font-normal">
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
            <CardContent>
              {presentation === "gauge" ? (
                <GaugeChart metric={metric} />
              ) : (
                <div className="py-2">
                  <p className="flex items-baseline justify-start gap-1 tabular-nums">
                    <span className="text-foreground text-3xl font-semibold tracking-tight">
                      {metric.value}
                    </span>
                    {metric.suffix && (
                      <span className="text-muted-foreground text-sm font-medium">
                        {metric.suffix}
                      </span>
                    )}
                  </p>
                  {metric.comparison ? (
                    <MetricComparison comparison={metric.comparison} />
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
