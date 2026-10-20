export type ManagementAssetReviewStatus = "sem_publicacao" | "sem_periodicidade" | "sob_demanda" | "em_dia" | "vencida" | "arquivado";

export type ManagementAssetReview = { status: ManagementAssetReviewStatus; nextReviewDate: string | null };

export const managementAssetReviewLabels: Record<ManagementAssetReviewStatus, string> = {
  sem_publicacao: "Sem publicação",
  sem_periodicidade: "Definir periodicidade",
  sob_demanda: "Sob demanda",
  em_dia: "Em dia",
  vencida: "Revisão vencida",
  arquivado: "Arquivado",
};

function saoPauloDate(iso: string | Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(iso));
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Revisão pendente não arquiva nem invalida automaticamente a versão publicada. */
export function getManagementAssetReview({ publishedAt, reviewCycle, archivedAt }: { publishedAt: string | null; reviewCycle: string | null; archivedAt: string | null }, now = new Date()): ManagementAssetReview {
  if (archivedAt) return { status: "arquivado", nextReviewDate: null };
  if (!publishedAt) return { status: "sem_publicacao", nextReviewDate: null };
  const cycle = reviewCycle?.trim().toLowerCase();
  if (cycle === "sob demanda") return { status: "sob_demanda", nextReviewDate: null };
  const months = ({ mensal: 1, trimestral: 3, semestral: 6, anual: 12 } as Record<string, number>)[cycle ?? ""];
  if (!months) return { status: "sem_periodicidade", nextReviewDate: null };
  const [year, month, day] = saoPauloDate(publishedAt).split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  const nextReviewDate = target.toISOString().slice(0, 10);
  return { nextReviewDate, status: saoPauloDate(now) > nextReviewDate ? "vencida" : "em_dia" };
}
