import type { AdherenceBoard } from "@/lib/data/action-points-adherence-example";
import type { CustomerCompanyActionPoint } from "@/lib/data/customer-company-action-points";

const frequencyLabels = { diaria: "Diária", semanal: "Semanal", quinzenal: "Quinzenal", mensal: "Mensal" };

export function buildManualActionPointsBoard(items: CustomerCompanyActionPoint[]): AdherenceBoard {
  return {
    company: items[0]?.companyName ?? "",
    categories: items.map(item => ({
      id: item.id,
      name: item.assetTitle,
      colorKey: "governanca",
      version: item.assetAvailable ? "Publicado" : "Indisponível",
      leader: { id: `${item.organizationId}:${item.leaderUserId}`, name: item.leaderName, sector: "Responsável via Slack", avatarUrl: item.leaderAvatarUrl },
      actionPoints: [{
        id: item.id, name: item.title, frequency: item.frequency ? frequencyLabels[item.frequency] : "Pontual",
        mode: "evento", health: "aguardando", trend: "estavel", eventLabel: item.reports.length ? "Relato recebido" : "Sem medição",
        lastCheckIn: item.reports.length ? "Relato recebido" : "Sem relato", lastCheckInAt: item.reports[0]?.registeredAt,
        why: item.reason, description: item.action,
        checkIns: item.reports.map(report => ({ author: item.leaderName, fromLeader: true, when: new Date(report.registeredAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), message: report.summary, source: "slack", context: `${report.status.replaceAll("_", " ")} · relato não verificado` })),
        manualDetails: { assetAvailable: item.assetAvailable, deadline: item.deadline, reason: item.reason, action: item.action, continuity: item.continuity },
      }],
    })),
  };
}
