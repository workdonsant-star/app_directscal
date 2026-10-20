import { describe, expect, it } from "vitest";

import { buildAnalyticsExample } from "@/lib/data/analytics-example";
import { buildAnalyticsOverview } from "@/lib/data/omdx-analytics-overview";
import { buildProcessUsageExample } from "@/lib/data/process-usage-example";

function buildOverview(diagnostic = "todos") {
  const { analytics, comparison } = buildAnalyticsExample(diagnostic);

  return {
    analytics,
    overview: buildAnalyticsOverview({
      illustrativeImpact: true,
      analytics,
      comparison,
      processUsage: buildProcessUsageExample(),
    }),
  };
}

describe("buildAnalyticsOverview", () => {
  it("monta o veredito com a nota real da coleta e a adoção dos ativos", () => {
    const { analytics, overview } = buildOverview();
    const average =
      analytics.dimensions.reduce((total, item) => total + item.maturity, 0) /
      analytics.dimensions.length;

    expect(overview.verdict?.maturity).toBeCloseTo(average, 1);
    expect(overview.verdict?.dimensionCount).toBe(analytics.dimensions.length);
    expect(overview.verdict?.adoption).toBe(buildProcessUsageExample().adoption.value);
  });

  it("ordena as dimensões da menor para a maior nota", () => {
    const { overview } = buildOverview();
    const scores = overview.dimensions.map((item) => item.score);

    expect(scores).toEqual([...scores].sort((first, second) => first - second));
  });

  it("trata as três alavancas mais críticas e marca sinal insuficiente sem estimativa", () => {
    const { overview } = buildOverview();

    expect(overview.levers).toHaveLength(3);
    expect(overview.levers.map((lever) => lever.rank)).toEqual([1, 2, 3]);
    expect(overview.levers[2].estimate).toBeNull();
    expect(overview.levers[0].estimate).toBeGreaterThan(overview.levers[0].score);
    expect(overview.dimensions.filter((item) => item.treated)).toHaveLength(3);
  });

  it("é determinístico", () => {
    expect(buildOverview().overview.levers).toEqual(buildOverview().overview.levers);
  });

  it("limita as perguntas ao top 5 pela menor nota", () => {
    const { overview } = buildOverview();
    const scores = overview.questions.map((item) => item.score);

    expect(overview.questions.length).toBeLessThanOrEqual(5);
    expect(scores).toEqual([...scores].sort((first, second) => first - second));
    expect(overview.questionTotal).toBeGreaterThanOrEqual(overview.questions.length);
  });

  it("não inventa veredito sem dimensões consolidadas", () => {
    const { analytics } = buildAnalyticsExample("todos");
    const overview = buildAnalyticsOverview({
      analytics: { ...analytics, dimensions: [], questions: [], leverageRows: [] },
      comparison: null,
      processUsage: null,
    });

    expect(overview.verdict).toBeNull();
    expect(overview.levers).toEqual([]);
    expect(overview.impact.trend).toEqual([]);
  });
});


describe("Analytics operacional sem impacto fictício", () => {
  it("mantém prioridades reais e não usa dados de exemplo", () => {
    const { analytics } = buildAnalyticsExample("todos");
    const overview = buildAnalyticsOverview({analytics,comparison:null,processUsage:null});
    expect(overview.impact.levers).toEqual([]);
    expect(overview.impact.general).toBeNull();
    expect(overview.impact.trend).toEqual([]);
    expect(overview.levers).toHaveLength(3);
    expect(overview.levers.every(item => !item.measured && item.progress===null && item.assetUsage===null)).toBe(true);
    expect(overview.verdict?.progress).toEqual({status:"sem_base"});
  });
});
