import { describe, expect, it } from "vitest";
import { getManagementAssetReview } from "@/lib/data/management-asset-review";

const review = (publishedAt: string | null, reviewCycle: string | null, now = new Date("2026-10-20T12:00:00Z"), archivedAt: string | null = null) => getManagementAssetReview({ publishedAt, reviewCycle, archivedAt }, now);

describe("fila de revisão dos ativos", () => {
  it("usa a publicação vigente e vence somente depois do dia limite em São Paulo", () => {
    expect(review("2026-04-20T12:00:00Z", "Semestral")).toEqual({ status: "em_dia", nextReviewDate: "2026-10-20" });
    expect(review("2026-04-20T12:00:00Z", "Semestral", new Date("2026-10-21T02:59:59Z")).status).toBe("em_dia");
    expect(review("2026-04-20T12:00:00Z", "Semestral", new Date("2026-10-21T03:00:00Z")).status).toBe("vencida");
  });
  it("mantém o último dia válido no fim do mês e no ano bissexto", () => {
    expect(review("2026-01-31T12:00:00Z", "Mensal").nextReviewDate).toBe("2026-02-28");
    expect(review("2024-02-29T12:00:00Z", "Anual").nextReviewDate).toBe("2025-02-28");
    expect(review("2026-11-30T12:00:00Z", "Trimestral").nextReviewDate).toBe("2027-02-28");
    expect(review("2026-04-01T01:00:00Z", "Mensal").nextReviewDate).toBe("2026-04-30");
  });
  it("não inventa prazo para publicação ausente, arquivados, sob demanda ou regra desconhecida", () => {
    expect(review(null, "Mensal")).toEqual({ status: "sem_publicacao", nextReviewDate: null });
    expect(review("2026-01-01T12:00:00Z", "Sob demanda").status).toBe("sob_demanda");
    expect(review("2026-01-01T12:00:00Z", "A combinar")).toEqual({ status: "sem_periodicidade", nextReviewDate: null });
    expect(review("2026-01-01T12:00:00Z", "Mensal", undefined, "2026-02-01T12:00:00Z").status).toBe("arquivado");
  });
});
