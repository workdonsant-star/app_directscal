import type {
  PeopleDocumentStatus,
  PeopleEmploymentType,
  PeoplePaymentStatus,
  PeoplePersonStatus,
} from "@/lib/types";

export const employmentTypeLabel: Record<PeopleEmploymentType, string> = {
  afiliado: "Afiliado",
  clt: "CLT",
  freelancer: "Freelancer",
  outro: "Outro",
  pj: "PJ",
  socio: "Sócio",
  temporario: "Temporário",
};

export const personStatusLabel: Record<PeoplePersonStatus, string> = {
  ativo: "Ativo",
  em_revisao: "Em revisão",
  inativo: "Inativo",
  pendente: "Pendente",
  rascunho: "Rascunho",
};

export const paymentStatusLabel: Record<PeoplePaymentStatus, string> = {
  aprovado: "Aprovado",
  calculado: "Calculado",
  cancelado: "Cancelado",
  com_pendencia: "Com pendência",
  em_revisao: "Em revisão",
  exportado: "Exportado",
  nao_calculado: "Não calculado",
  pago: "Pago",
  reaberto: "Reaberto",
};

export const documentStatusLabel: Record<PeopleDocumentStatus, string> = {
  pendente: "Pendente",
  valido: "Válido",
  vence_em_breve: "Vence em breve",
  vencido: "Vencido",
};

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function formatDate(value: string | null) {
  if (!value) return "Sem vencimento";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function formatCompetence(value: string) {
  const [year, month] = value.split("-");

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(Number(year), Number(month) - 1, 1));
}
