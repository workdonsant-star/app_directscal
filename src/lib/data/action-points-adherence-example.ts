// Dados de demonstração (frontend-only) da visão de aderência dos action points.
// Determinístico, em pt-BR, sem Math.random e sem leitura de dados reais.
// Hierarquia de duas camadas: Categoria (ativo de gestão) → Action points.
// O backend desse modelo (vínculo ativo↔action point, aderência vinda do agente,
// frequências do catálogo) ainda não existe; ver seção 18 de
// docs/experiencia-agentica-projetos-e-action-points.md.

export type AdherenceHealth =
  | "consistente"
  | "atencao"
  | "risco"
  | "aguardando"
  | "parado";

export type AdherenceTrend = "subindo" | "estavel" | "caindo";

// Tema de cor da categoria (resolvido por token nos dois temas em globals.css).
export type AdherenceCategoryKey =
  | "comunicacao"
  | "pessoas"
  | "processos"
  | "governanca";

export type AdherenceFrequencyMode = "periodica" | "evento";

export type AdherenceLeader = {
  id?: string;
  avatarUrl?: string | null;
  name: string;
  sector: string;
};

export type AdherenceCheckIn = {
  author: string;
  // true quando é relato do líder; false quando é registro do agente.
  fromLeader: boolean;
  when: string;
  message: string;
  source?: "slack";
  context?: string;
};

export type AdherenceActionPoint = {
  id: string;
  name: string;
  frequency: string;
  mode: AdherenceFrequencyMode;
  health: AdherenceHealth;
  trend: AdherenceTrend;
  // Evidência periódica: feito/total no ciclo. Ausente em action points por evento.
  cycleDone?: number;
  cycleTotal?: number;
  // Evidência por evento: rótulo livre ("3 tratados", "sem ocorrências").
  eventLabel?: string;
  lastCheckIn: string;
  lastCheckInAt?: string;
  actualCounts?: { eligible: number; reported: number; validated: number };
  why?: string;
  description?: string;
  implementation?: { stage: string; dueOn: string | null; progress: number | null; suggestedDeadline: string };
  checkIns: AdherenceCheckIn[];
};

// Categoria = um ativo de gestão. Reúne os action points que o mantêm vivo.
export type AdherenceCategory = {
  id: string;
  name: string;
  colorKey: AdherenceCategoryKey;
  version: string;
  leader: AdherenceLeader | null;
  actionPoints: AdherenceActionPoint[];
};

export type AdherenceBoard = {
  source?: { diagnosticId: string; name: string };
  company: string;
  categories: AdherenceCategory[];
};

export const adherenceHealthLabels: Record<AdherenceHealth, string> = {
  consistente: "Consistente",
  atencao: "Atenção",
  risco: "Em risco",
  aguardando: "Aguardando",
  parado: "Parado",
};

export type AdherenceHealthTone = "positive" | "attention" | "negative" | "muted";

export const adherenceHealthTones: Record<AdherenceHealth, AdherenceHealthTone> = {
  consistente: "positive",
  atencao: "attention",
  risco: "negative",
  aguardando: "muted",
  parado: "muted",
};

// Distribuição agregada usada nos cards do topo e nos pontinhos dos grupos.
export type AdherenceDistribution = {
  consistente: number;
  atencao: number;
  risco: number;
  parado: number;
  aguardando: number;
};

export function emptyDistribution(): AdherenceDistribution {
  return { consistente: 0, atencao: 0, risco: 0, parado: 0, aguardando: 0 };
}

export function countActionPoints(
  actionPoints: AdherenceActionPoint[],
): AdherenceDistribution {
  const acc = emptyDistribution();
  for (const ap of actionPoints) {
    if (ap.health === "consistente") acc.consistente += 1;
    else if (ap.health === "atencao") acc.atencao += 1;
    else if (ap.health === "risco") acc.risco += 1;
    else if (ap.health === "parado") acc.parado += 1;
    else acc.aguardando += 1;
  }
  return acc;
}

// Aderência da categoria a partir dos filhos visíveis: risco quando há qualquer
// risco/parado; atenção quando há atenção ou mistura com aguardando; aguardando
// quando todos aguardam; consistente caso contrário.
export function rollupHealth(
  actionPoints: AdherenceActionPoint[],
): AdherenceHealth {
  if (actionPoints.length === 0) return "aguardando";
  const d = countActionPoints(actionPoints);
  if (d.risco > 0) return "risco";
  if (d.parado > 0) return "parado";
  if (d.atencao > 0) return "atencao";
  if (d.aguardando === actionPoints.length) return "aguardando";
  if (d.aguardando > 0) return "atencao";
  return "consistente";
}

export function flattenActionPoints(
  board: AdherenceBoard,
): AdherenceActionPoint[] {
  return board.categories.flatMap((category) => category.actionPoints);
}

// Meta de aderência usada na régua visual e nas faixas (consistente a partir dela).
export const ADHERENCE_TARGET = 80;

// Idade aproximada, em horas, de um rótulo relativo de check-in ("há 4 h", "ontem",
// "há 3 dias"). Rótulos sem relato devolvem null. Serve só para escolher o relato
// mais recente nos dados de demonstração; o backend real trará datas.
export function checkInAgeHours(label: string): number | null {
  const normalized = label.trim().toLowerCase();
  if (normalized === "ontem") return 24;
  const hours = normalized.match(/^há (\d+) h$/);
  if (hours) return Number(hours[1]);
  const days = normalized.match(/^há (\d+) dias?$/);
  if (days) return Number(days[1]) * 24;
  return null;
}

// Aderência de um action point periódico no ciclo (0 a 1); null quando não mede.
export function cycleRatio(ap: AdherenceActionPoint): number | null {
  if (ap.actualCounts) return ap.actualCounts.eligible ? ap.actualCounts.reported / ap.actualCounts.eligible : null;
  if (ap.health === "aguardando" || ap.health === "parado") return null;
  if (ap.mode !== "periodica" || !ap.cycleTotal) return null;
  return Math.min(1, Math.max(0, (ap.cycleDone ?? 0) / ap.cycleTotal));
}

// Média simples, em %, dos action points que medem; null quando nenhum mede.
export function averageAdherence(actionPoints: AdherenceActionPoint[]): number | null {
  if (actionPoints.some(point => point.actualCounts)) {
    const counts = actionPoints.reduce((sum, point) => ({ eligible: sum.eligible + (point.actualCounts?.eligible ?? 0), reported: sum.reported + (point.actualCounts?.reported ?? 0) }), { eligible: 0, reported: 0 });
    return counts.eligible ? Math.round(100 * counts.reported / counts.eligible) : null;
  }
  const ratios = actionPoints.map(cycleRatio).filter((value): value is number => value !== null);
  if (ratios.length === 0) return null;
  return Math.round((ratios.reduce((sum, value) => sum + value, 0) / ratios.length) * 100);
}

export const adherenceLeaderPhotos: Record<string, string> = {
  "Marina Alves": "/initiatives/avatars/marina.jpg",
  "Rafael Nunes": "/initiatives/avatars/rafael.jpg",
  "Camila Rocha": "/initiatives/avatars/ana.jpg",
  "Diego Martins": "/initiatives/avatars/lucas.jpg",
};

const leaders = {
  marina: { name: "Marina Alves", sector: "Operação" },
  rafael: { name: "Rafael Nunes", sector: "Tecnologia" },
  camila: { name: "Camila Rocha", sector: "Qualidade" },
  diego: { name: "Diego Martins", sector: "Comercial" },
} satisfies Record<string, AdherenceLeader>;

export function buildActionPointsAdherenceExample(): AdherenceBoard {
  return {
    company: "Vertex Logistics",
    categories: [
      {
        id: "ativo-rotina-comunicacao",
        name: "Rotina de Comunicação e Rituais de Gestão",
        colorKey: "comunicacao",
        version: "v3",
        leader: leaders.marina,
        actionPoints: [
          {
            id: "ap-001",
            name: "Realizar a daily da equipe conforme o ritual",
            frequency: "Diária",
            mode: "periodica",
            health: "consistente",
            trend: "estavel",
            cycleDone: 5,
            cycleTotal: 5,
            lastCheckIn: "há 4 h",
            why: "A daily alinha as prioridades da operação, identifica bloqueios e define os encaminhamentos do dia. Manter esse ritual ajuda a equipe a coordenar as entregas e agir antes que as dependências atrasem o trabalho.",
            checkIns: [
              {
                author: "Agente Directscal",
                fromLeader: false,
                when: "há 4 h",
                message: "Marina, a daily aconteceu hoje? Houve algum bloqueio ou encaminhamento?",
              },
              {
                author: "Marina Alves",
                fromLeader: true,
                when: "há 4 h",
                message:
                  "Fizemos a daily hoje, 9h05. Todo mundo presente, dois encaminhamentos em aberto.",
              },
              {
                author: "Agente Directscal",
                fromLeader: false,
                when: "ontem",
                message: "Como foi a daily de hoje?",
              },
              {
                author: "Marina Alves",
                fromLeader: true,
                when: "ontem",
                message: "Daily normal, sem bloqueios.",
              },
              {
                author: "Agente Directscal",
                fromLeader: false,
                when: "há 2 dias",
                message: "Marina, quais prioridades vocês alinharam na daily de hoje?",
              },
              {
                author: "Marina Alves",
                fromLeader: true,
                when: "há 2 dias",
                message: "Priorizamos as entregas da manhã e redistribuímos duas demandas. Cada pessoa saiu com o próximo passo definido.",
              },
              {
                author: "Agente Directscal",
                fromLeader: false,
                when: "há 3 dias",
                message: "A equipe conseguiu fazer a daily? Alguma dependência entre áreas ficou sem encaminhamento?",
              },
              {
                author: "Marina Alves",
                fromLeader: true,
                when: "há 3 dias",
                message: "Sim, começamos às 9h. Uma aprovação do Comercial estava pendente; falei com o Diego e combinamos o retorno até o meio-dia.",
              },
              {
                author: "Agente Directscal",
                fromLeader: false,
                when: "há 4 dias",
                message: "Como foi o ritual hoje? Os bloqueios identificados ontem foram resolvidos?",
              },
              {
                author: "Marina Alves",
                fromLeader: true,
                when: "há 4 dias",
                message: "Fizemos em 15 minutos. Os bloqueios de ontem foram resolvidos e registramos um novo ajuste de prazo com a equipe de Tecnologia.",
              },
              {
                author: "Agente Directscal",
                fromLeader: false,
                when: "há 5 dias",
                message: "Marina, todos conseguiram participar da daily e compartilhar as prioridades?",
              },
              {
                author: "Marina Alves",
                fromLeader: true,
                when: "há 5 dias",
                message: "Uma pessoa estava em atendimento e enviou a atualização antes. Compartilhei os encaminhamentos com ela depois da reunião.",
              },
              {
                author: "Agente Directscal",
                fromLeader: false,
                when: "há 6 dias",
                message: "A daily ajudou a organizar as entregas de hoje? Ficou algum ponto para acompanhar?",
              },
              {
                author: "Marina Alves",
                fromLeader: true,
                when: "há 6 dias",
                message: "Sim. Identificamos duas demandas concorrentes e alinhamos a ordem de execução. Vou acompanhar a liberação de um acesso à tarde.",
              },
            ],
          },
          {
            id: "ap-005",
            name: "Realizar a weekly de liderança conforme a pauta",
            frequency: "Semanal",
            mode: "periodica",
            health: "atencao",
            trend: "caindo",
            cycleDone: 3,
            cycleTotal: 4,
            lastCheckIn: "há 2 dias",
            why: "A weekly reúne a liderança para revisar resultados, definir prioridades e tomar decisões. A regularidade da reunião mantém as áreas alinhadas e evita que pendências se acumulem entre semanas.",
            checkIns: [
              {
                author: "Marina Alves",
                fromLeader: true,
                when: "há 2 dias",
                message:
                  "Essa semana a weekly não rolou, agenda cheia. Remarquei para segunda.",
              },
            ],
          },
          {
            id: "ap-006",
            name: "Registrar e compartilhar as decisões da weekly",
            frequency: "Semanal",
            mode: "periodica",
            health: "consistente",
            trend: "subindo",
            cycleDone: 4,
            cycleTotal: 4,
            lastCheckIn: "ontem",
            why: "Registra as decisões da weekly e as compartilha com as pessoas envolvidas. Isso dá clareza sobre o que foi acordado e permite que cada área execute os encaminhamentos sem depender de repasses informais.",
            checkIns: [],
          },
          {
            id: "ap-004",
            name: "Comunicar bloqueios e dependências entre áreas",
            frequency: "Conforme ocorrência",
            mode: "evento",
            health: "consistente",
            trend: "estavel",
            eventLabel: "3 tratados",
            lastCheckIn: "há 1 dia",
            why: "Torna visíveis os bloqueios e as dependências entre áreas assim que surgem. A comunicação permite que os envolvidos coordenem a solução e reduz o risco de atrasos nas entregas da empresa.",
            checkIns: [],
          },
        ],
      },
      {
        id: "ativo-gerenciador-weekly",
        name: "Gerenciador de Resultados de Weekly",
        colorKey: "comunicacao",
        version: "v2",
        leader: leaders.marina,
        actionPoints: [
          {
            id: "ap-053",
            name: "Registrar os resultados e encaminhamentos da weekly",
            frequency: "Semanal",
            mode: "periodica",
            health: "aguardando",
            trend: "estavel",
            lastCheckIn: "aguardando resposta",
            why: "Mantém os resultados e encaminhamentos da weekly registrados no gerenciador. Esse histórico permite acompanhar os acordos entre ciclos e evita que decisões se percam após a reunião.",
            checkIns: [
              {
                author: "Agente Directscal",
                fromLeader: false,
                when: "há 1 dia",
                message:
                  "Perguntei à Marina se os resultados da última weekly foram registrados. Ainda sem resposta.",
              },
            ],
          },
          {
            id: "ap-055",
            name: "Revisar bloqueios e decisões pendentes entre ciclos",
            frequency: "Semanal",
            mode: "periodica",
            health: "atencao",
            trend: "caindo",
            cycleDone: 2,
            cycleTotal: 4,
            lastCheckIn: "há 9 dias",
            why: "Retoma os bloqueios e as decisões que ficaram pendentes na weekly anterior. A revisão ajuda a liderança a destravar o trabalho e dar continuidade aos compromissos assumidos.",
            checkIns: [],
          },
        ],
      },
      {
        id: "ativo-plano-desenvolvimento",
        name: "Plano de Desenvolvimento de Prestador",
        colorKey: "pessoas",
        version: "v2",
        leader: leaders.rafael,
        actionPoints: [
          {
            id: "ap-031",
            name: "Realizar conversa de acompanhamento do plano",
            frequency: "Mensal",
            mode: "periodica",
            health: "risco",
            trend: "caindo",
            cycleDone: 0,
            cycleTotal: 1,
            lastCheckIn: "há 41 dias",
            why: "A conversa de acompanhamento revisa o desenvolvimento do prestador, suas dificuldades e os próximos compromissos. O encontro mantém o plano conectado ao trabalho real e orienta o apoio da liderança.",
            checkIns: [
              {
                author: "Agente Directscal",
                fromLeader: false,
                when: "há 6 dias",
                message:
                  "Rafael, você conseguiu realizar a conversa de acompanhamento deste mês?",
              },
              {
                author: "Rafael Nunes",
                fromLeader: true,
                when: "há 6 dias",
                message:
                  "Esse mês não consegui, equipe em entrega. Faço na próxima semana.",
              },
            ],
          },
          {
            id: "ap-032",
            name: "Verificar a evolução dos compromissos acordados",
            frequency: "Mensal",
            mode: "periodica",
            health: "risco",
            trend: "caindo",
            cycleDone: 0,
            cycleTotal: 1,
            lastCheckIn: "há 41 dias",
            why: "Verifica a evolução dos compromissos definidos no plano de desenvolvimento. O acompanhamento permite reconhecer avanços, ajustar o apoio e tratar dificuldades antes que comprometam o trabalho.",
            checkIns: [],
          },
        ],
      },
      {
        id: "ativo-modelo-conversa",
        name: "Modelo de Conversa de Desenvolvimento com Prestador",
        colorKey: "pessoas",
        version: "v1",
        leader: leaders.rafael,
        actionPoints: [
          {
            id: "ap-041",
            name: "Preparar as evidências para a conversa de desenvolvimento",
            frequency: "Antes da reunião",
            mode: "evento",
            health: "aguardando",
            trend: "estavel",
            eventLabel: "sem preparação registrada",
            lastCheckIn: "aguardando resposta",
            why: "Reúne exemplos e evidências do trabalho antes da conversa de desenvolvimento. A preparação torna o feedback mais concreto e ajuda a liderança a discutir melhorias com clareza.",
            checkIns: [],
          },
          {
            id: "ap-042",
            name: "Conduzir a conversa utilizando o roteiro estabelecido",
            frequency: "Por ciclo",
            mode: "evento",
            health: "risco",
            trend: "caindo",
            eventLabel: "0 no ciclo",
            lastCheckIn: "sem registro no ciclo",
            why: "Orienta a conversa de desenvolvimento pelo roteiro acordado, cobrindo resultados, dificuldades e próximos passos. A prática dá consistência ao acompanhamento dos prestadores pela liderança.",
            checkIns: [],
          },
        ],
      },
      {
        id: "ativo-mapa-capacidades",
        name: "Mapa de Capacidades Técnicas por Prestador",
        colorKey: "pessoas",
        version: "v1",
        leader: leaders.rafael,
        actionPoints: [
          {
            id: "ap-035",
            name: "Revisar as capacidades técnicas dos prestadores",
            frequency: "Trimestral",
            mode: "periodica",
            health: "consistente",
            trend: "estavel",
            cycleDone: 1,
            cycleTotal: 1,
            lastCheckIn: "há 18 dias",
            why: "Revisa as capacidades técnicas dos prestadores para orientar a distribuição das demandas. Manter o mapa atualizado ajuda a identificar necessidades de desenvolvimento e adequar as entregas à capacidade da equipe.",
            checkIns: [],
          },
        ],
      },
      {
        id: "ativo-sops",
        name: "SOPs dos Processos Principais",
        colorKey: "processos",
        version: "v4",
        leader: leaders.camila,
        actionPoints: [
          {
            id: "ap-018",
            name: "Verificar a utilização dos SOPs nos processos críticos",
            frequency: "Semanal",
            mode: "periodica",
            health: "consistente",
            trend: "subindo",
            cycleDone: 4,
            cycleTotal: 4,
            lastCheckIn: "ontem",
            why: "Verifica se os procedimentos operacionais estão sendo usados nos processos críticos. O acompanhamento reduz variações na execução e ajuda a manter o padrão de qualidade definido pela empresa.",
            checkIns: [],
          },
          {
            id: "ap-020",
            name: "Registrar divergências entre o SOP e a execução real",
            frequency: "Conforme identificação",
            mode: "evento",
            health: "consistente",
            trend: "estavel",
            eventLabel: "1 registrada",
            lastCheckIn: "há 3 dias",
            why: "Registra diferenças entre o procedimento documentado e a execução real. Essas evidências ajudam a distinguir desvios operacionais de ajustes necessários no SOP e orientam melhorias no processo.",
            checkIns: [],
          },
          {
            id: "ap-021",
            name: "Revisar a necessidade de atualização dos procedimentos",
            frequency: "Mensal",
            mode: "periodica",
            health: "atencao",
            trend: "caindo",
            cycleDone: 0,
            cycleTotal: 1,
            lastCheckIn: "há 26 dias",
            why: "Avalia se os procedimentos ainda refletem a operação e as necessidades da empresa. A revisão evita que a equipe dependa de instruções desatualizadas e mantém os SOPs úteis no dia a dia.",
            checkIns: [],
          },
        ],
      },
      {
        id: "ativo-checklists",
        name: "Checklists Operacionais",
        colorKey: "processos",
        version: "v2",
        leader: leaders.camila,
        actionPoints: [
          {
            id: "ap-027",
            name: "Garantir o uso do checklist antes da aprovação de entregas",
            frequency: "Por entrega",
            mode: "evento",
            health: "consistente",
            trend: "subindo",
            eventLabel: "12 de 12 entregas",
            lastCheckIn: "há 6 h",
            why: "Confirma o uso do checklist antes da aprovação de cada entrega. Essa verificação ajuda a identificar requisitos não atendidos a tempo e reduz retrabalho na operação.",
            checkIns: [],
          },
          {
            id: "ap-030",
            name: "Acompanhar a correção das não conformidades",
            frequency: "Conforme ocorrência",
            mode: "evento",
            health: "atencao",
            trend: "estavel",
            eventLabel: "2 em aberto",
            lastCheckIn: "há 5 dias",
            why: "Acompanha a correção das não conformidades identificadas nas entregas. O acompanhamento dá continuidade aos ajustes e ajuda a evitar que os mesmos problemas se repitam.",
            checkIns: [],
          },
        ],
      },
      {
        id: "ativo-playbooks",
        name: "Playbooks das Principais Frentes de Trabalho",
        colorKey: "processos",
        version: "v1",
        leader: leaders.diego,
        actionPoints: [
          {
            id: "ap-024",
            name: "Verificar a aderência das entregas às diretrizes do playbook",
            frequency: "Semanal",
            mode: "periodica",
            health: "aguardando",
            trend: "estavel",
            lastCheckIn: "aguardando resposta",
            why: "Compara as entregas com as diretrizes dos playbooks de cada frente de trabalho. A verificação mantém a execução alinhada às práticas definidas e sinaliza onde é necessário orientar a equipe.",
            checkIns: [],
          },
        ],
      },
      {
        id: "ativo-papeis",
        name: "Papéis e Responsabilidades",
        colorKey: "governanca",
        version: "v2",
        leader: leaders.marina,
        actionPoints: [
          {
            id: "ap-009",
            name: "Verificar se as entregas estão com os responsáveis corretos",
            frequency: "Semanal",
            mode: "periodica",
            health: "consistente",
            trend: "estavel",
            cycleDone: 4,
            cycleTotal: 4,
            lastCheckIn: "ontem",
            why: "Verifica se cada entrega está atribuída ao responsável definido para a atividade. Isso reduz lacunas e sobreposições de atuação e dá clareza sobre quem deve conduzir o trabalho.",
            checkIns: [],
          },
          {
            id: "ap-013",
            name: "Revisar a aderência entre responsabilidades documentadas e a prática",
            frequency: "Mensal",
            mode: "periodica",
            health: "atencao",
            trend: "estavel",
            cycleDone: 0,
            cycleTotal: 1,
            lastCheckIn: "há 22 dias",
            why: "Compara os papéis documentados com as responsabilidades exercidas na operação. A revisão ajuda a identificar acúmulos, lacunas e ajustes necessários na divisão do trabalho.",
            checkIns: [],
          },
        ],
      },
      {
        id: "ativo-matriz-slas",
        name: "Matriz de SLAs",
        colorKey: "governanca",
        version: "v1",
        leader: null,
        actionPoints: [
          {
            id: "ap-056",
            name: "Verificar demandas e aprovações que ultrapassaram os SLAs",
            frequency: "Diária",
            mode: "periodica",
            health: "parado",
            trend: "estavel",
            lastCheckIn: "sem responsável",
            why: "Identifica demandas e aprovações que ultrapassaram os prazos acordados entre áreas. Essa leitura permite localizar gargalos e orientar ações para recuperar a previsibilidade das entregas.",
            checkIns: [],
          },
          {
            id: "ap-057",
            name: "Sinalizar violações recorrentes dos prazos entre áreas",
            frequency: "Semanal",
            mode: "periodica",
            health: "parado",
            trend: "estavel",
            lastCheckIn: "sem responsável",
            why: "Sinaliza violações recorrentes dos prazos acordados entre áreas. Ao tornar os padrões de atraso visíveis, a liderança pode revisar as causas e ajustar os acordos de serviço.",
            checkIns: [],
          },
        ],
      },
    ],
  };
}
