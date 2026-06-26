import { sopDocumentSchema, type SopDocument } from "@/lib/contracts";

const directscalOrganizationId = "org_directscal";

const seedSops = [
  {
    id: "sop_onboarding_cliente",
    organizationId: directscalOrganizationId,
    title: "Onboarding de cliente",
    department: "Operação",
    owner: "CS",
    status: "publicado",
    updatedAt: "2026-05-20T13:00:00.000Z",
    contentHtml:
      "<h2>Objetivo</h2><p>Padronizar a entrada de novos clientes depois da assinatura do contrato.</p><h2>Passos</h2><ol><li>Confirmar dados da empresa e responsáveis.</li><li>Registrar acesso aos canais oficiais.</li><li>Agendar reunião de estruturação com pauta fechada.</li></ol><h2>Critério de pronto</h2><p>Cliente com responsável definido, canais ativos e primeira reunião registrada.</p>",
  },
  {
    id: "sop_revisao_semanal",
    organizationId: directscalOrganizationId,
    title: "Revisão semanal de operação",
    department: "Gestão",
    owner: "Liderança",
    status: "rascunho",
    updatedAt: "2026-05-18T16:30:00.000Z",
    contentHtml:
      "<h2>Ritual</h2><p>Revisar indicadores operacionais, bloqueios e decisões pendentes toda segunda-feira.</p><ul><li>Scorecards atualizados antes da reunião.</li><li>Bloqueios com dono e prazo.</li><li>Decisões registradas no fim do encontro.</li></ul>",
  },
] satisfies SopDocument[];

export async function getSopDocumentsByOrganization(
  organizationId = directscalOrganizationId,
) {
  return seedSops
    .filter((sop) => sop.organizationId === organizationId)
    .map((sop) => sopDocumentSchema.parse(sop));
}
