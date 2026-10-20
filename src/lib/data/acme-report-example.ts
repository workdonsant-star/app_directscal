import { diagnosticReportSchema } from "@/lib/contracts";
import type { AdminDeliveryReportDraft } from "@/lib/contracts/admin-operations";
import { buildAnalyticsExampleReports } from "@/lib/data/analytics-example";

const questions: Record<string, string[]> = {
  cultura: ["Os valores orientam as decisões do dia a dia.", "O time recebe feedback sobre comportamentos esperados.", "As práticas de gestão são coerentes com os valores declarados.", "As pessoas colaboram na resolução de problemas entre áreas."],
  visao: ["As prioridades estratégicas são claras para todos.", "As metas da área se conectam aos objetivos da empresa.", "O time entende os critérios de priorização.", "As mudanças de direção são comunicadas com contexto."],
  comunicacao: ["As decisões relevantes ficam registradas e acessíveis.", "Os canais de comunicação têm finalidade definida.", "As áreas compartilham informações necessárias às entregas.", "Os alinhamentos terminam com responsáveis e próximos passos."],
  processos: ["Os processos críticos possuem instruções atualizadas.", "As entregas seguem critérios claros de qualidade.", "As responsabilidades nas passagens entre áreas são definidas.", "As falhas recorrentes geram melhorias no processo."],
  lideranca: ["Os líderes esclarecem expectativas e prioridades.", "O time tem autonomia compatível com suas responsabilidades.", "Os líderes acompanham impedimentos com regularidade.", "As decisões são tomadas no nível adequado da estrutura."],
  performance: ["Os indicadores possuem responsáveis e frequência de atualização.", "As metas são acompanhadas em uma rotina de gestão.", "Os desvios geram ações com responsável e prazo.", "Os critérios de desempenho são conhecidos pelo time."],
};

export function buildAcmeReportExample() {
  const base = buildAnalyticsExampleReports()[1];
  return diagnosticReportSchema.parse({
    ...base,
    diagnostic: {
      ...base.diagnostic,
      id: "exemplo-acme",
      organizationId: "exemplo-acme",
      organizationName: "Acme",
      company: "Acme",
      name: "Relatório de maturidade — Acme",
      description: "Relatório de exemplo de uma empresa fictícia.",
    },
    dimensions: base.dimensions.map((dimension) => ({
      ...dimension,
      questions: dimension.questions.map((question, index) => ({
        ...question,
        id: `exemplo-acme-${dimension.id}-${index + 1}`,
        diagnosticId: "exemplo-acme",
        text: questions[dimension.id][index],
      })),
    })),
  });
}

export const acmeReportEditorial: AdminDeliveryReportDraft = {
  executiveSummary: "Neste cenário ilustrativo, a Acme é uma empresa de serviços digitais com 27 participantes: um fundador, cinco líderes e 21 pessoas da operação. A pesquisa contempla Cultura, Visão, Comunicação, Processos, Liderança e Performance, em escala de 1 a 5.",
  generalReading: "A Acme apresenta maturidade geral de 3,1 em 5. Cultura é a dimensão mais consistente, enquanto Comunicação e Processos ficam abaixo do mínimo recomendado de 3,0. O fundador percebe práticas mais consolidadas que a liderança e o time; a maior distância está em Visão, com 1,4 ponto entre fundador e operação.",
  vulnerabilities: "Comunicação fragmentada e processos informais reduzem a previsibilidade das entregas. Na Acme, prioridades chegam ao time com menos clareza do que a direção percebe. A dependência de alinhamentos individuais aumenta o risco de retrabalho e de concentração das decisões nos líderes.",
  structuralCauses: "A hipótese central deste exemplo é que o crescimento da Acme avançou mais rápido que seus mecanismos de coordenação. Papéis pouco claros, registros dispersos e ausência de uma cadência comum ajudam a explicar as diferenças entre a intenção estratégica e a experiência operacional. A pesquisa de percepção indica onde investigar; entrevistas e observação dos processos devem confirmar essas causas.",
  recommendations: "Nos primeiros 30 dias, estabelecer uma reunião semanal de prioridades e impedimentos, com responsáveis e decisões registrados. Entre 31 e 60 dias, definir responsabilidades nas passagens entre áreas e documentar os três processos mais críticos. Entre 61 e 90 dias, consolidar indicadores de prazo, retrabalho e qualidade, revisar os acordos de autonomia e repetir a leitura de alinhamento com as três camadas.",
  conclusion: "A prioridade da Acme é transformar direção em execução previsível. A base cultural favorece a mudança, mas comunicação, processos e acompanhamento precisam funcionar como um sistema comum. A evolução deve ser verificada pela redução de retrabalho, pela clareza das responsabilidades e pela aproximação das percepções entre fundador, liderança e time.",
};
