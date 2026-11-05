import type { AdherenceBoard, AdherenceCheckIn } from "@/lib/data/action-points-adherence-example";
import type { CustomerCompanyActionPoint } from "@/lib/data/customer-company-action-points";

const frequencyLabels = { diaria: "Diária", semanal: "Semanal", quinzenal: "Quinzenal", mensal: "Mensal" };
const statusLabels: Record<string, string> = { executado_relato: "Validado", duvida: "Dúvida", nao_respondido: "Não respondido", aguardando: "Aguardando resposta", aguardando_confirmacao: "Aguardando confirmação", parcial: "Parcial", nao_executado: "Não executado", bloqueado: "Bloqueado", inconclusivo: "Resposta inconclusiva" };

function result(status: string): AdherenceCheckIn["result"] {
  if (status === "executado_relato") return "validado";
  if (status === "duvida" || status === "nao_respondido" || status === "aguardando" || status === "aguardando_confirmacao" || status === "parcial" || status === "nao_executado" || status === "bloqueado" || status === "inconclusivo") return status;
  return undefined;
}

export function buildManualActionPointsBoard(items: CustomerCompanyActionPoint[]): AdherenceBoard {
  return {
    company: items[0]?.companyName ?? "",
    categories: items.map(item => {
      const latestStatus = item.messages.toReversed().find(message => message.status)?.status;
      const { eligible, executed, partial } = item.followupCounts;
      const rate = eligible ? executed / eligible : null;
      return {
        id: item.id,
        name: item.assetTitle,
        colorKey: "governanca",
        version: item.assetAvailable ? "Publicado" : "Indisponível",
        leader: { id: `${item.organizationId}:${item.leaderUserId}`, name: item.leaderName, sector: "Responsável via Slack", avatarUrl: item.leaderAvatarUrl },
        actionPoints: [{
          id: item.id, name: item.title, frequency: item.frequency ? frequencyLabels[item.frequency] : "Pontual",
          mode: "evento", health: rate === null ? "aguardando" : rate >= 0.8 ? "consistente" : rate >= 0.5 ? "atencao" : "risco", trend: "estavel", eventLabel: statusLabels[latestStatus ?? ""] ?? "Sem relato",
          actualCounts: { eligible, reported: executed, validated: executed, partial },
          lastCheckIn: statusLabels[latestStatus ?? ""] ?? "Sem relato", lastCheckInAt: item.messages.at(-1)?.at,
          why: item.reason, description: item.action,
          checkIns: item.messages.toReversed().map(message => ({
            author: message.actor === "pessoa" ? item.leaderName : "Agente DirectScal",
            fromLeader: message.actor === "pessoa",
            when: new Date(message.at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
            message: message.text,
            source: "slack" as const,
            originalAvailable: message.actor === "pessoa" ? message.originalAvailable : undefined,
            result: message.status ? result(message.status) : undefined,
          })),
          manualDetails: { assetAvailable: item.assetAvailable, deadline: item.deadline, reason: item.reason, action: item.action, continuity: item.continuity },
        }],
      };
    }),
  };
}
