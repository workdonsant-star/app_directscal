import { describe, expect, it } from "vitest";
import { buildAnalyticsExampleReports } from "@/lib/data/analytics-example";
import { haveCompatibleCollectionInstruments, selectCollectionForOverview } from "@/lib/data/collection-comparison";
import { buildOmdxOverviewComparisonFromReports } from "@/lib/data/omdx-overview-analytics";

describe("comparação de coletas", () => {
  it("seleciona a última coleta pela data, sem misturar todas nem usar updatedAt", () => {
    const reports = buildAnalyticsExampleReports();
    reports[0].diagnostic.updatedAt = "2099-01-01T00:00:00Z";
    expect(selectCollectionForOverview([...reports].reverse())?.diagnostic.id).toBe(reports[1].diagnostic.id);
    expect(selectCollectionForOverview(reports, "todos")?.diagnostic.id).toBe(reports[1].diagnostic.id);
    expect(selectCollectionForOverview(reports, reports[0].diagnostic.id)?.diagnostic.id).toBe(reports[0].diagnostic.id);
    expect(selectCollectionForOverview([])).toBeUndefined();
  });
  it("permite IDs diferentes das perguntas, mas bloqueia mudança de texto ou empresa", () => {
    const [old, current] = buildAnalyticsExampleReports();
    expect(haveCompatibleCollectionInstruments(old, current)).toBe(true);
    old.dimensions[0].questions[0].text = "Pergunta de outro instrumento";
    expect(haveCompatibleCollectionInstruments(old, current)).toBe(false);
    expect(buildOmdxOverviewComparisonFromReports([old, current], current.diagnostic.id).comparison).toBeNull();
    const [other, same] = buildAnalyticsExampleReports();
    other.diagnostic.organizationId = "outra-empresa";
    expect(haveCompatibleCollectionInstruments(other, same)).toBe(false);
  });
  it("exclui somente a referência incompatível e preserva dados originais", () => {
    const [old, current] = buildAnalyticsExampleReports();
    const incompatible = structuredClone(old);
    incompatible.diagnostic.id = "instrumento-incompativel";
    incompatible.dimensions[0].questions.pop();
    const snapshot = JSON.stringify([old, current, incompatible]);
    const result = buildOmdxOverviewComparisonFromReports([old, current, incompatible], current.diagnostic.id);
    expect(result.comparison?.historicalDiagnosticCount).toBe(1);
    expect(JSON.stringify([old, current, incompatible])).toBe(snapshot);
  });
});
