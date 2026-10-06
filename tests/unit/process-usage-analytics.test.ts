import { describe, expect, it } from "vitest";

import {
  buildProcessUsageAnalytics,
  type ProcessUsageAuditInput,
} from "@/lib/data/process-usage-analytics";

const now = new Date("2026-10-02T12:00:00.000Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

const papeis = { assetId: "a1", title: "Geração de papéis", assetType: "sop" as const };
const fechamento = { assetId: "a2", title: "Fechamento mensal", assetType: "sop" as const };

function audit(overrides: Partial<ProcessUsageAuditInput>): ProcessUsageAuditInput {
  return {
    id: Math.random().toString(36).slice(2),
    createdAt: daysAgo(1),
    status: "respondida",
    askerKey: "pessoa-1",
    citations: [papeis],
    ...overrides,
  };
}

describe("process usage analytics", () => {
  it("computes adoption, coverage and usefulness with the previous period delta", () => {
    const audits = [
      audit({ id: "q1", askerKey: "pessoa-1" }),
      audit({ id: "q2", askerKey: "pessoa-2", citations: [papeis, papeis, fechamento] }),
      audit({ id: "q3", askerKey: "T1:U9", status: "insuficiente", citations: [] }),
      audit({ id: "q4", askerKey: "pessoa-1", status: "erro", citations: [] }),
      audit({ id: "old1", createdAt: daysAgo(40), askerKey: "pessoa-1" }),
      audit({ id: "old2", createdAt: daysAgo(45), status: "insuficiente", citations: [] }),
    ];

    const analytics = buildProcessUsageAnalytics({
      audits,
      feedback: [
        { auditId: "q1", value: "util" },
        { auditId: "q2", value: "nao_util" },
        { auditId: "old1", value: "util" },
      ],
      teamSize: 10,
      now,
    });

    expect(analytics.totals).toEqual({ questions: 4, answered: 2, gaps: 1, askers: 3, teamSize: 10 });
    expect(analytics.adoption).toMatchObject({ value: 30, previous: 10, deltaPoints: 20 });
    expect(analytics.coverage).toMatchObject({ value: 67, previous: 50, deltaPoints: 17 });
    expect(analytics.usefulness).toMatchObject({ value: 50, previous: 100, deltaPoints: -50 });
    expect(analytics.processes).toEqual([
      expect.objectContaining({ assetId: "a1", questions: 2, notUseful: 1, href: "/ativos-de-gestao/sops/a1" }),
      expect.objectContaining({ assetId: "a2", questions: 1, notUseful: 1 }),
    ]);
  });

  it("buckets eight rolling weeks and ignores technical errors as gaps", () => {
    const analytics = buildProcessUsageAnalytics({
      audits: [
        audit({ createdAt: daysAgo(1) }),
        audit({ createdAt: daysAgo(2), status: "insuficiente", citations: [] }),
        audit({ createdAt: daysAgo(3), status: "erro", citations: [] }),
        audit({ createdAt: daysAgo(50) }),
        audit({ createdAt: daysAgo(70) }),
      ],
      feedback: [],
      teamSize: 0,
      now,
    });

    expect(analytics.weekly).toHaveLength(8);
    expect(analytics.weekly.at(-1)).toMatchObject({ answered: 1, gaps: 1 });
    expect(analytics.weekly[0]).toMatchObject({ answered: 1, gaps: 0 });
    expect(analytics.weekly.reduce((sum, week) => sum + week.answered, 0)).toBe(2);
    expect(analytics.adoption.value).toBeNull();
    expect(analytics.usefulness).toMatchObject({ value: null, detail: "Sem avaliações no período" });
  });
});
