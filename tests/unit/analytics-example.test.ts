import { describe, expect, it } from "vitest";
import { buildAnalyticsExample } from "@/lib/data/analytics-example";
import { buildProcessUsageExample } from "@/lib/data/process-usage-example";

describe("Analytics example", () => {
  it("fills the complete dashboard and filters historical comparison", () => {
    const all = buildAnalyticsExample();
    expect(all.analytics.dimensions).toHaveLength(6);
    expect(all.analytics.leverageRows).toHaveLength(6);
    expect(all.analytics.summaryMetrics).toHaveLength(3);
    expect(all.analytics.layerScores.every((layer) => layer.score !== null)).toBe(true);
    const latest = buildAnalyticsExample(all.diagnosticOptions[1].id);
    expect(latest.comparison?.historicalDiagnosticCount).toBe(1);
    expect(latest.analytics.dimensions).not.toEqual(all.analytics.dimensions);
  });

  it("keeps irregular weekly activity and consistent period totals", () => {
    const usage = buildProcessUsageExample(new Date("2026-10-14T12:00:00Z"));
    expect(usage.weekly.map((week) => week.answered + week.gaps)).toEqual([15, 8, 19, 12, 21, 9, 24, 14]);
    expect(usage.totals.questions).toBe(68);
    expect(usage.totals.gaps).toBe(12);
    expect(usage.processes).toHaveLength(6);
    expect(usage.processes.every((process) => process.href === null)).toBe(true);
  });
});
