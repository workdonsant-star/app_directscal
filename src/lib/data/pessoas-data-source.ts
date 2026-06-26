import { cache } from "react";

import {
  peopleConfigurationWorkspaceSchema,
  peopleDirectoryWorkspaceSchema,
  peopleMonthlyClosingWorkspaceSchema,
  peopleOverviewWorkspaceSchema,
  peopleProfileWorkspaceSchema,
  type OperationalMember,
  type PeopleCostBreakdown,
  type PeopleEmploymentType,
  type PeoplePayment,
  type PeoplePerson,
} from "@/lib/contracts";
import { getOperationalMembersForOrganization } from "@/lib/data/operational-onboarding-data-source";

const defaultOrganizationId = "org_directscal";
const currentCompetence = "2026-06";

const employmentTypeLabels: Record<PeopleEmploymentType, string> = {
  afiliado: "Afiliado",
  clt: "CLT",
  freelancer: "Freelancer",
  outro: "Outro",
  pj: "PJ",
  socio: "Sócio",
  temporario: "Temporário",
};

function moneyParts({
  benefitsCost,
  bonusProvision,
  chargesEstimate,
  discountsAmount = 0,
  fixedAmount,
  reimbursementsAmount = 0,
  variableAmount,
}: {
  benefitsCost: number;
  bonusProvision: number;
  chargesEstimate: number;
  discountsAmount?: number;
  fixedAmount: number;
  reimbursementsAmount?: number;
  variableAmount: number;
}) {
  const netAmount =
    fixedAmount +
    variableAmount +
    bonusProvision +
    benefitsCost +
    reimbursementsAmount -
    discountsAmount;
  const totalCost = netAmount + chargesEstimate;

  return { netAmount, totalCost };
}

type CreatePaymentInput = Omit<
  PeoplePayment,
  | "competence"
  | "discountsAmount"
  | "netAmount"
  | "pendingReasons"
  | "reimbursementsAmount"
  | "totalCost"
> &
  Partial<
    Pick<
      PeoplePayment,
      "discountsAmount" | "pendingReasons" | "reimbursementsAmount"
    >
  >;

function createPayment({
  benefitsAmount,
  chargesAmount,
  discountsAmount = 0,
  dueDate,
  fixedAmount,
  id,
  pendingReasons = [],
  personId,
  personName,
  reimbursementsAmount = 0,
  status,
  variableAmount,
}: CreatePaymentInput): PeoplePayment {
  const netAmount =
    fixedAmount +
    variableAmount +
    benefitsAmount +
    reimbursementsAmount -
    discountsAmount;

  return {
    benefitsAmount,
    chargesAmount,
    competence: currentCompetence,
    discountsAmount,
    dueDate,
    fixedAmount,
    id,
    netAmount,
    pendingReasons,
    personId,
    personName,
    reimbursementsAmount,
    status,
    totalCost: netAmount + chargesAmount,
    variableAmount,
  };
}

const people: PeoplePerson[] = [
  {
    id: "pessoa_marina_torres",
    organizationId: defaultOrganizationId,
    name: "Marina Torres",
    email: "marina@directscal.com.br",
    status: "ativo",
    employmentType: "socio",
    area: "Direção",
    operationalRole: "Sócia operadora",
    formalRole: "Sócia administradora",
    manager: null,
    costCenter: "Direção executiva",
    startedAt: "2024-08-01",
    companyName: null,
    paymentMethod: "Transferência",
    paymentKey: null,
    remuneration: {
      fixedAmount: 28000,
      variableForecast: 8000,
      bonusProvision: 6000,
      benefitsCost: 0,
      chargesEstimate: 0,
      currency: "BRL",
      totalMonthlyCost: moneyParts({
        benefitsCost: 0,
        bonusProvision: 6000,
        chargesEstimate: 0,
        fixedAmount: 28000,
        variableAmount: 8000,
      }).totalCost,
    },
    benefits: [],
    documents: [
      {
        id: "doc_marina_contrato_social",
        title: "Contrato social atualizado",
        type: "Documento societário",
        status: "valido",
        dueDate: null,
      },
    ],
    responsibilities: [
      "Define prioridades de estruturação",
      "Aprova fechamento mensal",
      "Mantém alçadas de decisão",
    ],
    competencies: ["Alocação de capital", "Gestão de operação", "Estratégia"],
    paymentHistory: [
      createPayment({
        benefitsAmount: 0,
        chargesAmount: 0,
        dueDate: "2026-06-28",
        fixedAmount: 28000,
        id: "pay_marina_2026_06",
        personId: "pessoa_marina_torres",
        personName: "Marina Torres",
        status: "aprovado",
        variableAmount: 14000,
      }),
    ],
    updatedAt: "2026-06-21T12:30:00.000-03:00",
  },
  {
    id: "pessoa_bruno_almeida",
    organizationId: defaultOrganizationId,
    name: "Bruno Almeida",
    email: "bruno@parceirodelivery.com.br",
    status: "ativo",
    employmentType: "pj",
    area: "Operação",
    operationalRole: "Líder de entrega",
    formalRole: null,
    manager: "Marina Torres",
    costCenter: "Entrega",
    startedAt: "2025-02-10",
    companyName: "Almeida Ops LTDA",
    paymentMethod: "Pix",
    paymentKey: "financeiro@almeidaops.com.br",
    remuneration: {
      fixedAmount: 18000,
      variableForecast: 2500,
      bonusProvision: 1800,
      benefitsCost: 600,
      chargesEstimate: 0,
      currency: "BRL",
      totalMonthlyCost: moneyParts({
        benefitsCost: 600,
        bonusProvision: 1800,
        chargesEstimate: 0,
        fixedAmount: 18000,
        variableAmount: 2500,
      }).totalCost,
    },
    benefits: [
      {
        id: "beneficio_bruno_ajuda_custo",
        name: "Ajuda de custo operacional",
        companyCost: 600,
        personDiscount: 0,
        recurrence: "Mensal",
        status: "ativo",
      },
    ],
    documents: [
      {
        id: "doc_bruno_contrato",
        title: "Contrato de prestação de serviços",
        type: "Contrato",
        status: "valido",
        dueDate: "2026-12-31",
      },
      {
        id: "doc_bruno_nf",
        title: "Nota fiscal da competência",
        type: "Nota fiscal",
        status: "pendente",
        dueDate: "2026-06-25",
      },
    ],
    responsibilities: [
      "Conduz rotina semanal de entrega",
      "Remove bloqueios operacionais",
      "Coordena handoff entre diagnóstico e execução",
    ],
    competencies: ["Gestão de projetos", "Ritual operacional", "Comunicação"],
    paymentHistory: [
      createPayment({
        benefitsAmount: 600,
        chargesAmount: 0,
        dueDate: "2026-06-28",
        fixedAmount: 18000,
        id: "pay_bruno_2026_06",
        pendingReasons: ["Nota fiscal pendente"],
        personId: "pessoa_bruno_almeida",
        personName: "Bruno Almeida",
        status: "com_pendencia",
        variableAmount: 4300,
      }),
    ],
    updatedAt: "2026-06-21T10:10:00.000-03:00",
  },
  {
    id: "pessoa_renata_lima",
    organizationId: defaultOrganizationId,
    name: "Renata Lima",
    email: "renata@processospro.com.br",
    status: "pendente",
    employmentType: "pj",
    area: "Processos",
    operationalRole: "Especialista de processos",
    formalRole: null,
    manager: "Bruno Almeida",
    costCenter: "Operação",
    startedAt: "2025-09-15",
    companyName: "Processos Pro Consultoria LTDA",
    paymentMethod: "Transferência",
    paymentKey: null,
    remuneration: {
      fixedAmount: 12000,
      variableForecast: 0,
      bonusProvision: 1200,
      benefitsCost: 0,
      chargesEstimate: 0,
      currency: "BRL",
      totalMonthlyCost: 13200,
    },
    benefits: [],
    documents: [
      {
        id: "doc_renata_contrato",
        title: "Contrato com escopo atualizado",
        type: "Contrato",
        status: "vence_em_breve",
        dueDate: "2026-07-10",
      },
      {
        id: "doc_renata_politica",
        title: "Política de confidencialidade assinada",
        type: "Termo",
        status: "pendente",
        dueDate: null,
      },
    ],
    responsibilities: [
      "Documenta SOPs críticos",
      "Define critérios de pronto",
      "Apoia matriz de papéis",
    ],
    competencies: ["Documentação operacional", "Processos", "Governança"],
    paymentHistory: [
      createPayment({
        benefitsAmount: 0,
        chargesAmount: 0,
        dueDate: "2026-06-28",
        fixedAmount: 12000,
        id: "pay_renata_2026_06",
        pendingReasons: ["Termo de confidencialidade pendente"],
        personId: "pessoa_renata_lima",
        personName: "Renata Lima",
        status: "calculado",
        variableAmount: 1200,
      }),
    ],
    updatedAt: "2026-06-20T17:45:00.000-03:00",
  },
  {
    id: "pessoa_caio_martins",
    organizationId: defaultOrganizationId,
    name: "Caio Martins",
    email: "caio@indicadoreslab.com.br",
    status: "em_revisao",
    employmentType: "pj",
    area: "Performance",
    operationalRole: "Analista de performance",
    formalRole: null,
    manager: "Marina Torres",
    costCenter: "Dados e indicadores",
    startedAt: "2025-11-03",
    companyName: "Indicadores Lab LTDA",
    paymentMethod: "Pix",
    paymentKey: "caio@indicadoreslab.com.br",
    remuneration: {
      fixedAmount: 9500,
      variableForecast: 2000,
      bonusProvision: 1000,
      benefitsCost: 0,
      chargesEstimate: 0,
      currency: "BRL",
      totalMonthlyCost: 12500,
    },
    benefits: [],
    documents: [
      {
        id: "doc_caio_contrato",
        title: "Contrato de prestação de serviços",
        type: "Contrato",
        status: "valido",
        dueDate: "2027-01-31",
      },
    ],
    responsibilities: [
      "Mantém leitura de indicadores",
      "Apoia análise de maturidade por dimensão",
      "Sinaliza gargalos quantitativos",
    ],
    competencies: ["Dados", "Análise executiva", "Visualização"],
    paymentHistory: [
      createPayment({
        benefitsAmount: 0,
        chargesAmount: 0,
        dueDate: "2026-06-28",
        fixedAmount: 9500,
        id: "pay_caio_2026_06",
        pendingReasons: ["Bônus manual em revisão"],
        personId: "pessoa_caio_martins",
        personName: "Caio Martins",
        status: "em_revisao",
        variableAmount: 3000,
      }),
    ],
    updatedAt: "2026-06-19T09:15:00.000-03:00",
  },
  {
    id: "pessoa_luiza_prado",
    organizationId: defaultOrganizationId,
    name: "Luiza Prado",
    email: "luiza@directscal.com.br",
    status: "ativo",
    employmentType: "clt",
    area: "Suporte",
    operationalRole: "Atendimento e suporte",
    formalRole: "Analista de relacionamento",
    manager: "Bruno Almeida",
    costCenter: "Suporte ao cliente",
    startedAt: "2024-12-02",
    companyName: null,
    paymentMethod: "Folha",
    paymentKey: null,
    remuneration: {
      fixedAmount: 7800,
      variableForecast: 0,
      bonusProvision: 700,
      benefitsCost: 1200,
      chargesEstimate: 2700,
      currency: "BRL",
      totalMonthlyCost: 12400,
    },
    benefits: [
      {
        id: "beneficio_luiza_saude",
        name: "Plano de saúde",
        companyCost: 900,
        personDiscount: 120,
        recurrence: "Mensal",
        status: "ativo",
      },
      {
        id: "beneficio_luiza_alimentacao",
        name: "Vale alimentação",
        companyCost: 300,
        personDiscount: 0,
        recurrence: "Mensal",
        status: "ativo",
      },
    ],
    documents: [
      {
        id: "doc_luiza_registro",
        title: "Registro admissional",
        type: "Documento pessoal",
        status: "valido",
        dueDate: null,
      },
    ],
    responsibilities: [
      "Triagem de dúvidas recorrentes",
      "Acompanhamento de handoffs",
      "Registro de bloqueios de atendimento",
    ],
    competencies: ["Relacionamento", "Organização", "Suporte consultivo"],
    paymentHistory: [
      createPayment({
        benefitsAmount: 1200,
        chargesAmount: 2700,
        dueDate: "2026-06-30",
        fixedAmount: 7800,
        id: "pay_luiza_2026_06",
        personId: "pessoa_luiza_prado",
        personName: "Luiza Prado",
        status: "aprovado",
        variableAmount: 700,
      }),
    ],
    updatedAt: "2026-06-18T14:20:00.000-03:00",
  },
  {
    id: "pessoa_tiago_nunes",
    organizationId: defaultOrganizationId,
    name: "Tiago Nunes",
    email: "tiago@comercialscale.com.br",
    status: "ativo",
    employmentType: "afiliado",
    area: "Comercial",
    operationalRole: "Consultor comercial",
    formalRole: null,
    manager: "Marina Torres",
    costCenter: "Aquisição",
    startedAt: "2026-01-12",
    companyName: "Comercial Scale LTDA",
    paymentMethod: "Pix",
    paymentKey: "financeiro@comercialscale.com.br",
    remuneration: {
      fixedAmount: 4000,
      variableForecast: 7800,
      bonusProvision: 0,
      benefitsCost: 0,
      chargesEstimate: 0,
      currency: "BRL",
      totalMonthlyCost: 11800,
    },
    benefits: [],
    documents: [
      {
        id: "doc_tiago_regra_comissao",
        title: "Regra de comissão vigente",
        type: "Política",
        status: "valido",
        dueDate: "2026-12-31",
      },
      {
        id: "doc_tiago_validacao_venda",
        title: "Validação de vendas da competência",
        type: "Comprovante",
        status: "pendente",
        dueDate: "2026-06-24",
      },
    ],
    responsibilities: [
      "Diagnóstico comercial inicial",
      "Passagem de contexto para entrega",
      "Acompanhamento de comissões por origem",
    ],
    competencies: ["Comercial", "Diagnóstico", "Negociação"],
    paymentHistory: [
      createPayment({
        benefitsAmount: 0,
        chargesAmount: 0,
        dueDate: "2026-06-28",
        fixedAmount: 4000,
        id: "pay_tiago_2026_06",
        pendingReasons: ["Validação de vendas pendente"],
        personId: "pessoa_tiago_nunes",
        personName: "Tiago Nunes",
        status: "com_pendencia",
        variableAmount: 7800,
      }),
    ],
    updatedAt: "2026-06-21T11:00:00.000-03:00",
  },
];

export function getPeopleOrganizationId(company?: string | null) {
  const slug =
    company
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "directscal";

  return `org_${slug}`;
}

function matchesOrganization(person: PeoplePerson, organizationId: string) {
  return (
    person.organizationId === organizationId ||
    organizationId === defaultOrganizationId
  );
}

function normalizePersonEmail(email: string) {
  return email.trim().toLowerCase();
}

function splitResponsibilities(value: string) {
  const responsibilities = value
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  return responsibilities.length > 0 ? responsibilities : [value.trim()];
}

function operationalMemberStatusToPeopleStatus(
  status: OperationalMember["status"],
): PeoplePerson["status"] {
  if (status === "aprovado") return "ativo";
  if (status === "pendente_aprovacao") return "pendente";

  return "inativo";
}

function operationalMemberToPerson(member: OperationalMember): PeoplePerson {
  return {
    id: `pessoa_operational_${member.id}`,
    organizationId: member.organizationId,
    name: member.name,
    email: normalizePersonEmail(member.email),
    status: operationalMemberStatusToPeopleStatus(member.status),
    employmentType: "outro",
    area: member.area,
    operationalRole: member.operationalRole,
    formalRole: null,
    manager: null,
    costCenter: member.area,
    startedAt: member.submittedAt.slice(0, 10),
    companyName: null,
    paymentMethod: "Não configurado",
    paymentKey: null,
    remuneration: {
      fixedAmount: 0,
      variableForecast: 0,
      bonusProvision: 0,
      benefitsCost: 0,
      chargesEstimate: 0,
      currency: "BRL",
      totalMonthlyCost: 0,
    },
    benefits: [],
    documents: [],
    responsibilities: splitResponsibilities(member.perceivedResponsibilities),
    competencies: member.participatesInAreaDecisions
      ? ["Participa das decisões da área"]
      : ["Cadastro operacional"],
    paymentHistory: [],
    updatedAt: member.submittedAt,
  };
}

async function listPeople(organizationId: string) {
  const seedPeople = people.filter((person) =>
    matchesOrganization(person, organizationId),
  );
  const seedEmails = new Set(
    seedPeople.map((person) => normalizePersonEmail(person.email)),
  );
  const operationalPeople = (
    await getOperationalMembersForOrganization(organizationId)
  )
    .map(operationalMemberToPerson)
    .filter((person) => !seedEmails.has(normalizePersonEmail(person.email)));

  return [...seedPeople, ...operationalPeople];
}

function currentPayment(person: PeoplePerson) {
  return person.paymentHistory.find(
    (payment) => payment.competence === currentCompetence,
  );
}

function currentPaymentsFor(peopleList: PeoplePerson[]) {
  return peopleList
    .map(currentPayment)
    .filter((payment): payment is PeoplePayment => Boolean(payment));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function buildCostBreakdown({
  total,
  values,
}: {
  total: number;
  values: Map<string, number>;
}): PeopleCostBreakdown[] {
  return [...values.entries()]
    .map(([id, value]) => ({
      id,
      label: employmentTypeLabels[id as PeopleEmploymentType] ?? id,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

function buildAreaBreakdown({
  peopleList,
  total,
}: {
  peopleList: PeoplePerson[];
  total: number;
}) {
  const values = new Map<string, number>();

  peopleList.forEach((person) => {
    values.set(
      person.area,
      (values.get(person.area) ?? 0) + person.remuneration.totalMonthlyCost,
    );
  });

  return [...values.entries()]
    .map(([area, value]) => ({
      id: area.toLowerCase().replace(/\s+/g, "_"),
      label: area,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

export const getPeopleOverviewWorkspace = cache(
  async function getPeopleOverviewWorkspace(organizationId = defaultOrganizationId) {
    const peopleList = await listPeople(organizationId);
    const payments = currentPaymentsFor(peopleList);
    const totalPeopleCost = sum(
      peopleList.map((person) => person.remuneration.totalMonthlyCost),
    );
    const employmentValues = new Map<string, number>();
    const hasSeedPeople = peopleList.some(
      (person) => person.organizationId === defaultOrganizationId,
    );

    peopleList.forEach((person) => {
      employmentValues.set(
        person.employmentType,
        (employmentValues.get(person.employmentType) ?? 0) +
          person.remuneration.totalMonthlyCost,
      );
    });

    return peopleOverviewWorkspaceSchema.parse({
      activePeople: peopleList.filter((person) => person.status === "ativo").length,
      alerts: hasSeedPeople
        ? [
            {
              id: "alert_nf_pj",
              title: "PJ com nota fiscal pendente",
              description:
                "Bruno e Tiago ainda possuem documentos que bloqueiam o fechamento da competência.",
              severity: "alta",
            },
            {
              id: "alert_bonus_review",
              title: "Bônus manual em revisão",
              description:
                "O pagamento de Caio depende de aprovação antes da exportação financeira.",
              severity: "media",
            },
            {
              id: "alert_clt_rules",
              title: "CLT sem regra legal completa",
              description:
                "Luiza está no MVP como cadastro e simulação de custo, sem motor oficial de folha.",
              severity: "baixa",
            },
          ]
        : [
            {
              id: "alert_people_profiles",
              title: "Perfis financeiros pendentes",
              description:
                "Pessoas vindas do cadastro público ainda precisam de vínculo, remuneração e documentos para entrar no fechamento.",
              severity: "media",
            },
          ],
      approvedAmount: sum(
        payments
          .filter((payment) => ["aprovado", "exportado", "pago"].includes(payment.status))
          .map((payment) => payment.netAmount),
      ),
      cltCost: sum(
        peopleList
          .filter((person) => person.employmentType === "clt")
          .map((person) => person.remuneration.totalMonthlyCost),
      ),
      competence: currentCompetence,
      costByArea: buildAreaBreakdown({ peopleList, total: totalPeopleCost }),
      costByEmploymentType: buildCostBreakdown({
        total: totalPeopleCost,
        values: employmentValues,
      }),
      incompleteProfiles: peopleList.filter((person) =>
        ["pendente", "em_revisao", "rascunho"].includes(person.status),
      ).length,
      organizationId,
      payments,
      pendingAmount: sum(
        payments
          .filter((payment) =>
            ["calculado", "com_pendencia", "em_revisao", "reaberto"].includes(
              payment.status,
            ),
          )
          .map((payment) => payment.netAmount),
      ),
      pendingDocuments: peopleList.reduce(
        (total, person) =>
          total +
          person.documents.filter((document) => document.status !== "valido")
            .length,
        0,
      ),
      pendingPayments: payments.filter((payment) =>
        ["com_pendencia", "em_revisao"].includes(payment.status),
      ).length,
      pjCost: sum(
        peopleList
          .filter((person) => person.employmentType === "pj")
          .map((person) => person.remuneration.totalMonthlyCost),
      ),
      recurringCost: sum(
        peopleList.map(
          (person) =>
            person.remuneration.fixedAmount +
            person.remuneration.benefitsCost +
            person.remuneration.chargesEstimate,
        ),
      ),
      totalPeopleCost,
      variableCost: sum(
        peopleList.map(
          (person) =>
            person.remuneration.variableForecast +
            person.remuneration.bonusProvision,
        ),
      ),
    });
  },
);

export const getPeopleDirectoryWorkspace = cache(
  async function getPeopleDirectoryWorkspace(organizationId = defaultOrganizationId) {
    return peopleDirectoryWorkspaceSchema.parse({
      organizationId,
      people: await listPeople(organizationId),
    });
  },
);

export const getPeopleProfileWorkspace = cache(
  async function getPeopleProfileWorkspace({
    organizationId = defaultOrganizationId,
    personId,
  }: {
    organizationId?: string;
    personId: string;
  }) {
    const person =
      (await listPeople(organizationId)).find((item) => item.id === personId) ??
      null;

    if (!person) return null;

    return peopleProfileWorkspaceSchema.parse({ person });
  },
);

export const getPeopleMonthlyClosingWorkspace = cache(
  async function getPeopleMonthlyClosingWorkspace(
    organizationId = defaultOrganizationId,
  ) {
    const payments = currentPaymentsFor(await listPeople(organizationId));

    return peopleMonthlyClosingWorkspaceSchema.parse({
      approvedAmount: sum(
        payments
          .filter((payment) => ["aprovado", "exportado", "pago"].includes(payment.status))
          .map((payment) => payment.netAmount),
      ),
      approvedAt: null,
      competence: currentCompetence,
      exportedAt: null,
      openedAt: "2026-06-20T09:00:00.000-03:00",
      organizationId,
      payments,
      pendingAmount: sum(
        payments
          .filter((payment) =>
            ["calculado", "com_pendencia", "em_revisao", "reaberto"].includes(
              payment.status,
            ),
          )
          .map((payment) => payment.netAmount),
      ),
      status: "em_revisao",
      steps: [
        {
          id: "closing_open",
          title: "Competência aberta",
          description: "Ciclo de junho iniciado com pessoas ativas importadas.",
          status: "concluido",
        },
        {
          id: "closing_fixed",
          title: "Fixos calculados",
          description: "Contratos, salários e benefícios recorrentes já entraram no ciclo.",
          status: "concluido",
        },
        {
          id: "closing_pending",
          title: "Pendências em revisão",
          description: "Notas, validações de venda e bônus manual ainda bloqueiam exportação.",
          status: "em_andamento",
        },
        {
          id: "closing_approval",
          title: "Aprovação final",
          description: "Fechamento ainda não foi aprovado pela liderança financeira.",
          status: "pendente",
        },
      ],
      totalCost: sum(payments.map((payment) => payment.totalCost)),
      totalToPay: sum(payments.map((payment) => payment.netAmount)),
    });
  },
);

export const getPeopleConfigurationWorkspace = cache(
  async function getPeopleConfigurationWorkspace(
    organizationId = defaultOrganizationId,
  ) {
    return peopleConfigurationWorkspaceSchema.parse({
      costCenters: [
        "Direção executiva",
        "Entrega",
        "Operação",
        "Dados e indicadores",
        "Suporte ao cliente",
        "Aquisição",
      ],
      documentTypes: [
        "Contrato",
        "Nota fiscal",
        "Termo",
        "Política",
        "Comprovante",
        "Documento pessoal",
      ],
      employmentTypes: [
        {
          id: "pj",
          label: "PJ",
          description: "Prestadores com CNPJ, contrato, nota e pagamento por competência.",
        },
        {
          id: "clt",
          label: "CLT",
          description: "Cadastro e simulação de custo sem motor oficial de folha nesta fase.",
        },
        {
          id: "socio",
          label: "Sócio",
          description: "Pró-labore, retirada, distribuição ou combinação de remuneração.",
        },
        {
          id: "afiliado",
          label: "Afiliado",
          description: "Comissão por origem, venda, indicação ou regra de performance.",
        },
        {
          id: "freelancer",
          label: "Freelancer",
          description: "Entrega pontual com aprovação e pagamento por escopo.",
        },
      ],
      organizationId,
      paymentStatuses: [
        { id: "calculado", label: "Calculado" },
        { id: "com_pendencia", label: "Com pendência" },
        { id: "em_revisao", label: "Em revisão" },
        { id: "aprovado", label: "Aprovado" },
        { id: "exportado", label: "Exportado" },
        { id: "pago", label: "Pago" },
      ],
    });
  },
);
