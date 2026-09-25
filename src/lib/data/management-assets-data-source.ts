import {
  managementAssetSchema,
  managementSopDocumentSchema,
  type ManagementAsset,
  type ManagementSopDocument,
  type ManagementAssetType,
} from "@/lib/contracts";

const demoOrganizationId = "org_directscal";

const managementAssets = [
  {
    id: "sop-geracao-papeis-atribuicoes",
    organizationId: demoOrganizationId,
    type: "sop",
    title: "Geração de papéis e atribuições",
    summary:
      "Define o fluxo para transformar o entendimento do líder em um documento validado de papel e atribuições por nível.",
    category: "Estruturação",
    author: { name: "DirectScal", role: "Método e operação" },
    publishedAt: "2026-09-25T14:00:00.000Z",
    updatedAt: "2026-09-25T14:00:00.000Z",
  },
  {
    id: "sop-onboarding-clientes",
    organizationId: demoOrganizationId,
    type: "sop",
    title: "Onboarding de novos clientes",
    summary:
      "Padroniza a entrada do cliente, a coleta de acessos e a reunião inicial da operação.",
    category: "Atendimento",
    author: { name: "Mariana Costa", role: "Especialista Directscal" },
    publishedAt: "2026-08-12T14:00:00.000Z",
    updatedAt: "2026-09-18T14:30:00.000Z",
  },
  {
    id: "sop-aprovacao-campanhas",
    organizationId: demoOrganizationId,
    type: "sop",
    title: "Aprovação de campanhas",
    summary:
      "Define entradas, responsáveis e critérios de pronto antes da ativação de uma campanha.",
    category: "Marketing",
    author: { name: "Rafael Nunes", role: "Especialista Directscal" },
    publishedAt: "2026-08-22T14:00:00.000Z",
    updatedAt: "2026-09-16T11:20:00.000Z",
  },
  {
    id: "sop-fechamento-financeiro",
    organizationId: demoOrganizationId,
    type: "sop",
    title: "Fechamento financeiro mensal",
    summary:
      "Organiza conciliação, validações e prazos para o fechamento financeiro da empresa.",
    category: "Financeiro",
    author: { name: "Mariana Costa", role: "Especialista Directscal" },
    publishedAt: "2026-09-02T14:00:00.000Z",
    updatedAt: "2026-09-20T09:10:00.000Z",
  },
  {
    id: "playbook-qualificacao-comercial",
    organizationId: demoOrganizationId,
    type: "playbook",
    title: "Qualificação de oportunidades",
    summary:
      "Orienta a leitura de contexto, os critérios de qualificação e a passagem para proposta.",
    category: "Comercial",
    author: { name: "Rafael Nunes", role: "Especialista Directscal" },
    publishedAt: "2026-08-28T14:00:00.000Z",
    updatedAt: "2026-09-19T15:40:00.000Z",
  },
  {
    id: "playbook-gestao-de-crise",
    organizationId: demoOrganizationId,
    type: "playbook",
    title: "Gestão de crise operacional",
    summary:
      "Reúne sinais de alerta, papéis e decisões para responder a incidentes críticos.",
    category: "Operações",
    author: { name: "Mariana Costa", role: "Especialista Directscal" },
    publishedAt: "2026-09-04T14:00:00.000Z",
    updatedAt: "2026-09-21T12:15:00.000Z",
  },
  {
    id: "playbook-feedback-lideranca",
    organizationId: demoOrganizationId,
    type: "playbook",
    title: "Conversas de feedback",
    summary:
      "Estrutura a preparação, condução e documentação de conversas de desenvolvimento.",
    category: "Liderança",
    author: { name: "Beatriz Lima", role: "Especialista Directscal" },
    publishedAt: "2026-09-07T14:00:00.000Z",
    updatedAt: "2026-09-22T10:00:00.000Z",
  },
  {
    id: "governanca-reuniao-semanal",
    organizationId: demoOrganizationId,
    type: "governanca",
    title: "Ritual semanal de gestão",
    summary:
      "Define pauta, participantes, indicadores e registro de decisões da reunião semanal.",
    category: "Rituais de gestão",
    author: { name: "Beatriz Lima", role: "Especialista Directscal" },
    publishedAt: "2026-08-19T14:00:00.000Z",
    updatedAt: "2026-09-17T16:30:00.000Z",
  },
  {
    id: "governanca-alcadas-aprovacao",
    organizationId: demoOrganizationId,
    type: "governanca",
    title: "Alçadas de aprovação",
    summary:
      "Estabelece limites de decisão e escalonamento para despesas e compromissos da operação.",
    category: "Tomada de decisão",
    author: { name: "Mariana Costa", role: "Especialista Directscal" },
    publishedAt: "2026-08-30T14:00:00.000Z",
    updatedAt: "2026-09-23T09:45:00.000Z",
  },
  {
    id: "governanca-revisao-indicadores",
    organizationId: demoOrganizationId,
    type: "governanca",
    title: "Revisão mensal de indicadores",
    summary:
      "Organiza o fechamento dos indicadores, a leitura dos desvios e as decisões do período.",
    category: "Performance",
    author: { name: "Rafael Nunes", role: "Especialista Directscal" },
    publishedAt: "2026-09-08T14:00:00.000Z",
    updatedAt: "2026-09-24T13:25:00.000Z",
  },
  {
    id: "raci-lancamento-campanha",
    organizationId: demoOrganizationId,
    type: "raci",
    title: "Lançamento de campanha",
    summary:
      "Distribui responsabilidade, aprovação, consulta e comunicação ao longo do lançamento.",
    category: null,
    author: { name: "Rafael Nunes", role: "Especialista Directscal" },
    publishedAt: "2026-08-26T14:00:00.000Z",
    updatedAt: "2026-09-15T17:00:00.000Z",
  },
  {
    id: "raci-fechamento-mensal",
    organizationId: demoOrganizationId,
    type: "raci",
    title: "Fechamento mensal da operação",
    summary:
      "Clarifica os papéis envolvidos na consolidação dos resultados e na revisão executiva.",
    category: null,
    author: { name: "Mariana Costa", role: "Especialista Directscal" },
    publishedAt: "2026-09-05T14:00:00.000Z",
    updatedAt: "2026-09-20T14:10:00.000Z",
  },
] satisfies ManagementAsset[];

const sopDocumentDetails: Record<
  string,
  ManagementSopDocument["document"]
> = {
  "sop-geracao-papeis-atribuicoes": {
    version: "1.0",
    operationalOwner: "DirectScal",
    reviewCycle: "Semestral",
    sections: [
      {
        id: "objetivo",
        title: "Objetivo",
        blocks: [
          {
            type: "paragraph",
            text: "Este SOP define o fluxo para transformar o entendimento do líder de uma área em um documento de papel e atribuições aplicável aos níveis Júnior, Pleno e Sênior. O processo cria um registro único para responsabilidades, entregas, autonomia, limites e critérios de diferenciação entre níveis, reduzindo interpretações divergentes e retrabalho durante a implantação.",
          },
          {
            type: "paragraph",
            text: "A gravação da call é a evidência de origem do documento. O agente gerador de papéis organiza esse material em uma primeira versão, que deve ser documentada na estrutura do cliente, validada explicitamente pelo líder da área e apresentada à equipe somente após a aprovação.",
          },
          {
            type: "paragraph",
            text: "Este SOP define critérios de entrega, qualidade, registro e passagem de etapa. Ele não estabelece jornada, horário de trabalho, exclusividade, controle de presença ou modo pessoal de execução. A organização da rotina, dos meios utilizados e da alocação de tempo permanece sob responsabilidade do prestador ou da frente responsável pela entrega, observados os prazos, marcos de revisão e critérios de qualidade definidos para o projeto.",
          },
        ],
      },
      {
        id: "papeis-envolvidos",
        title: "Papéis envolvidos",
        blocks: [
          {
            type: "table",
            columns: ["Papel", "Responsabilidade principal"],
            rows: [
              [
                "DirectScal",
                "Conduzir o levantamento, operar o agente gerador de papéis, revisar a aderência do conteúdo e coordenar a passagem entre as etapas.",
              ],
              [
                "Líder da área",
                "Explicar as diferenças práticas entre os níveis, revisar o documento e registrar a aprovação ou os ajustes necessários.",
              ],
              [
                "DirectScal",
                "Publicar e manter o papel na estrutura definida pelo cliente, preservando a fonte, a versão e o status do documento.",
              ],
              [
                "Equipe da área",
                "Receber a versão aprovada, esclarecer dúvidas de aplicação e registrar decisões ou pendências surgidas na apresentação.",
              ],
            ],
          },
        ],
      },
      {
        id: "visao-rapida-do-fluxo",
        title: "Visão rápida do fluxo",
        blocks: [
          {
            type: "paragraph",
            text: "A frente responsável agenda e realiza uma call com o líder da área para entender como os níveis Júnior, Pleno e Sênior se diferenciam na prática. A conversa deve produzir uma gravação e um registro com o contexto mínimo do papel, da área e do cliente.",
          },
          {
            type: "paragraph",
            text: "Depois, o agente gerador de papéis da DirectScal utiliza a gravação e os demais insumos confirmados para produzir a primeira versão. A frente responsável revisa o material, corrige inconsistências evidentes e publica o documento na estrutura do cliente, em ClickUp ou Notion, conforme o ambiente definido para a entrega.",
          },
          {
            type: "paragraph",
            text: "O líder recebe o link da versão documentada e precisa registrar uma aprovação explícita ou solicitar ajustes. Enquanto houver ajustes pendentes ou aprovação ambígua, o documento permanece em validação. Após a aprovação, o papel é apresentado à equipe e as dúvidas ou decisões relevantes são registradas no documento ou no registro operacional relacionado.",
          },
        ],
      },
      {
        id: "preparacao-do-levantamento",
        title: "Preparação do levantamento",
        blocks: [
          {
            type: "paragraph",
            text: "A frente responsável deve definir o papel, a área, os níveis que serão descritos e o ambiente em que o documento será entregue. Antes da call, o registro operacional deve conter o objetivo do levantamento, o nome do líder consultado, os participantes previstos e o link do card, tarefa ou página que concentrará as evidências.",
          },
          {
            type: "list",
            ordered: false,
            items: [
              "Escopo de atuação e principais entregas.",
              "Grau de autonomia técnica e operacional.",
              "Decisões que podem ser tomadas em cada nível.",
              "Limites de atuação e situações de escalonamento.",
              "Interfaces com outros papéis.",
              "Critérios usados pelo líder para reconhecer evolução entre Júnior, Pleno e Sênior.",
              "Evidências que demonstram que uma atribuição foi executada com qualidade.",
            ],
          },
          {
            type: "paragraph",
            text: "A etapa está pronta para avançar quando o contexto do papel e o registro da call estiverem definidos. O risco a evitar é iniciar a geração sem uma fonte contextual suficiente, levando o agente a completar lacunas com suposições.",
          },
        ],
      },
      {
        id: "call-com-o-lider-da-area",
        title: "Call com o líder da área",
        blocks: [
          {
            type: "paragraph",
            text: "A frente responsável conduz a call com o líder da área e registra a conversa por gravação, observando as regras de consentimento e armazenamento aplicáveis ao cliente. A gravação, o link e a data da conversa devem ser vinculados ao registro operacional principal.",
          },
          {
            type: "paragraph",
            text: "Durante a conversa, o líder deve explicar as nuances da área e diferenciar o que se espera de cada nível. A frente responsável pode fazer perguntas de esclarecimento, mas não deve substituir a percepção do líder por uma descrição genérica de mercado. Pontos de dúvida, exemplos usados na conversa e decisões relevantes devem ser registrados no card ou na página do projeto.",
          },
          {
            type: "paragraph",
            text: "A etapa está pronta para avançar quando a gravação estiver disponível, o vínculo com o registro operacional estiver feito e não houver dúvida essencial sobre o papel ou sobre a distinção entre os níveis. O risco a evitar é tratar uma conversa informal não registrada como fonte oficial do documento.",
          },
          {
            type: "paragraph",
            text: "Informação: a gravação é fonte de contexto e evidência do levantamento. Ela não substitui o documento final nem a aprovação explícita do líder.",
          },
        ],
      },
      {
        id: "geracao-da-primeira-versao",
        title: "Geração da primeira versão",
        blocks: [
          {
            type: "paragraph",
            text: "A frente responsável deve fornecer ao agente gerador de papéis da DirectScal a gravação ou sua transcrição, o contexto confirmado do cliente, o nome da área, o papel a ser descrito e as orientações específicas registradas na call.",
          },
          {
            type: "paragraph",
            text: "O agente deve produzir uma primeira versão que diferencie Júnior, Pleno e Sênior por responsabilidades, entregas, autonomia, decisões, limites e evidências observáveis. A redação deve permanecer vinculada ao contexto trazido pelo líder. Informações não confirmadas devem ser marcadas como pendência ou encaminhadas para validação, nunca apresentadas como fato.",
          },
          {
            type: "list",
            ordered: false,
            items: [
              "Aderência ao que foi dito na call.",
              "Separação clara entre os níveis.",
              "Ausência de responsabilidades inventadas.",
              "Coerência entre atribuições, entregas, autonomia e limites.",
              "Linguagem compatível com prestação de serviço e responsabilidade pela entrega.",
              "Identificação de pendências que dependem do líder.",
            ],
          },
          {
            type: "paragraph",
            text: "A etapa está pronta para avançar quando existir uma versão revisada, com a gravação e os insumos de origem vinculados. O risco a evitar é publicar diretamente o texto gerado sem revisão de aderência.",
          },
        ],
      },
      {
        id: "documentacao-na-estrutura-do-cliente",
        title: "Documentação na estrutura do cliente",
        blocks: [
          {
            type: "paragraph",
            text: "A frente responsável pela documentação deve publicar o papel na estrutura definida para o cliente, em ClickUp ou Notion. O documento publicado deve conter, no mínimo, o nome do papel, a área, os níveis descritos, as responsabilidades, as entregas esperadas, os limites de atuação, os critérios de diferenciação e o status Em validação.",
          },
          {
            type: "paragraph",
            text: "O registro deve preservar o link da gravação ou da transcrição usada como fonte, a data da versão, o responsável pela documentação e o link do card, tarefa ou página que concentra o histórico. Se o cliente utilizar versões, a nova versão deve substituir ou suceder a anterior conforme a convenção definida no próprio ambiente.",
          },
          {
            type: "paragraph",
            text: "A etapa está pronta para avançar quando o documento estiver acessível no local combinado, com conteúdo completo, fonte vinculada e status de validação visível. O risco a evitar é manter a versão principal em arquivo privado, mensagem ou ferramenta diferente daquela usada pelo cliente para consultar o ativo.",
          },
        ],
      },
      {
        id: "validacao-pelo-lider-da-area",
        title: "Validação pelo líder da área",
        blocks: [
          {
            type: "paragraph",
            text: "A frente responsável envia ao líder o link da versão documentada e solicita uma decisão explícita: Aprovado ou Ajustes solicitados. A decisão deve ser registrada no card, na tarefa ou na própria página do documento, com a data e, quando houver ajustes, a indicação objetiva do trecho ou critério que precisa ser revisado.",
          },
          {
            type: "paragraph",
            text: "Quando houver ajustes, a frente responsável deve atualizar o documento com base no retorno registrado e devolver a nova versão para validação. A gravação e a versão anterior devem ser preservadas quando forem necessárias para rastreabilidade. O documento não pode avançar para apresentação com aprovação implícita, silêncio ou comentário ambíguo.",
          },
          {
            type: "paragraph",
            text: "A etapa está pronta para avançar quando o líder registrar aprovação explícita e todas as pendências de conteúdo estiverem encerradas. O risco a evitar é apresentar à equipe uma definição de papel que ainda não foi confirmada pela frente que detém o contexto operacional da área.",
          },
          {
            type: "paragraph",
            text: "Crítico: sem aprovação explícita do líder da área, o papel permanece Em validação e não deve ser apresentado como definição vigente à equipe.",
          },
        ],
      },
      {
        id: "apresentacao-a-equipe-e-registro-de-encerramento",
        title: "Apresentação à equipe e registro de encerramento",
        blocks: [
          {
            type: "paragraph",
            text: "Depois da aprovação, a frente responsável apresenta o papel à equipe da área, destacando o escopo do papel, as atribuições por nível, os limites de atuação, os critérios de passagem entre níveis e as interfaces relevantes.",
          },
          {
            type: "paragraph",
            text: "A apresentação não deve alterar unilateralmente o conteúdo aprovado. Dúvidas que exigirem mudança de responsabilidade, escopo ou critério devem ser registradas como pendência e encaminhadas ao líder para decisão. Perguntas de entendimento que não alterarem o documento podem ser registradas como orientação de aplicação.",
          },
          {
            type: "paragraph",
            text: "Após a apresentação, o registro operacional deve conter o link do papel aprovado, a data da apresentação, os participantes, as dúvidas relevantes, as decisões tomadas e as pendências encaminhadas. A etapa está pronta para avançar quando a versão aprovada estiver disponível para consulta e o registro da apresentação estiver concluído. O risco a evitar é considerar o documento implantado sem que a equipe tenha acesso à versão aprovada e sem registrar os pontos que afetem sua aplicação.",
          },
        ],
      },
      {
        id: "criterio-de-conclusao",
        title: "Critério de conclusão",
        blocks: [
          {
            type: "paragraph",
            text: "O processo é considerado encerrado quando a call com o líder estiver gravada e vinculada ao registro operacional, a primeira versão tiver sido produzida pelo agente gerador de papéis e revisada quanto à aderência, e o documento estiver publicado na estrutura do cliente em ClickUp ou Notion. Também devem estar registradas a aprovação explícita do líder, a conclusão dos ajustes solicitados e a apresentação da versão aprovada à equipe, com suas dúvidas, decisões e pendências documentadas. O status final deve indicar Publicado ou o status equivalente adotado pelo cliente.",
          },
        ],
      },
      {
        id: "matriz-raci",
        title: "Matriz RACI",
        blocks: [
          {
            type: "list",
            ordered: false,
            items: [
              "R — Responsible: executa a atividade.",
              "A — Accountable: responde pelo resultado ou aprovação.",
              "C — Consulted: participa da consulta.",
              "I — Informed: deve ser informado.",
            ],
          },
          {
            type: "table",
            columns: ["Atividade", "DirectScal", "Líder da área", "DirectScal", "Equipe da área"],
            rows: [
              ["Preparar pauta, contexto e registro da call", "R", "C", "C", "I"],
              ["Realizar e registrar a call", "R", "A/C", "I", "I"],
              ["Fornecer insumos ao agente gerador", "R", "C", "I", "I"],
              ["Revisar a primeira versão", "R", "C", "C", "I"],
              ["Publicar o documento em ClickUp ou Notion", "A", "I", "R", "I"],
              ["Validar o conteúdo e solicitar ajustes", "C", "A/R", "I", "I"],
              ["Corrigir e reapresentar a versão ajustada", "R", "A", "C", "I"],
              ["Apresentar o papel aprovado à equipe", "R", "A/C", "C", "I"],
              ["Registrar dúvidas, decisões e encerramento", "R", "A/C", "R", "C"],
            ],
          },
        ],
      },
    ],
  },
  "sop-onboarding-clientes": {
    version: "1.3",
    operationalOwner: "Customer Success",
    reviewCycle: "Semestral",
    sections: [
      {
        id: "objetivo",
        title: "Objetivo",
        blocks: [
          {
            type: "paragraph",
            text: "Garantir que todo novo cliente inicie a operação com escopo, responsáveis, acessos e agenda de trabalho definidos antes da primeira entrega.",
          },
        ],
      },
      {
        id: "quando-aplicar",
        title: "Quando aplicar",
        blocks: [
          {
            type: "paragraph",
            text: "Execute este procedimento após a confirmação comercial e antes do kickoff operacional. O SOP também deve ser retomado quando houver mudança relevante de escopo ou de responsável principal no cliente.",
          },
        ],
      },
      {
        id: "responsabilidades",
        title: "Responsabilidades",
        blocks: [
          {
            type: "list",
            ordered: false,
            items: [
              "Customer Success coordena o onboarding e mantém o cliente informado.",
              "Comercial transfere escopo, expectativas, restrições e acordos registrados.",
              "Especialista responsável valida os insumos antes do kickoff.",
              "Cliente indica o ponto focal e disponibiliza os acessos necessários.",
            ],
          },
        ],
      },
      {
        id: "procedimento",
        title: "Procedimento",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Confirmar contrato, escopo aprovado e responsáveis de cada lado.",
              "Criar a estrutura da empresa nos sistemas oficiais e registrar o ponto focal.",
              "Enviar a lista de acessos e documentos necessários com prazo definido.",
              "Realizar a passagem comercial com riscos, promessas e contexto relevante.",
              "Validar o recebimento dos acessos antes de agendar o kickoff.",
              "Conduzir o kickoff com pauta, próximos passos, responsáveis e datas.",
              "Registrar as decisões e comunicar o plano inicial a todos os envolvidos.",
            ],
          },
        ],
      },
      {
        id: "criterio-de-pronto",
        title: "Critério de pronto",
        blocks: [
          {
            type: "paragraph",
            text: "O onboarding está concluído quando o escopo está confirmado, os responsáveis foram registrados, os acessos críticos estão válidos e o plano inicial possui próximos passos com responsáveis e prazos.",
          },
        ],
      },
      {
        id: "registros",
        title: "Registros obrigatórios",
        blocks: [
          {
            type: "list",
            ordered: false,
            items: [
              "Resumo da passagem comercial.",
              "Checklist de acessos atualizado.",
              "Ata do kickoff com decisões e pendências.",
              "Plano inicial da operação com responsáveis e prazos.",
            ],
          },
        ],
      },
    ],
  },
  "sop-aprovacao-campanhas": {
    version: "1.1",
    operationalOwner: "Marketing",
    reviewCycle: "Trimestral",
    sections: [
      {
        id: "objetivo",
        title: "Objetivo",
        blocks: [
          {
            type: "paragraph",
            text: "Assegurar que campanhas sejam ativadas somente após validação de oferta, peças, segmentação, orçamento, mensuração e responsáveis pela operação.",
          },
        ],
      },
      {
        id: "entradas",
        title: "Entradas necessárias",
        blocks: [
          {
            type: "list",
            ordered: false,
            items: [
              "Briefing e objetivo da campanha.",
              "Oferta, público e canais definidos.",
              "Peças finais e páginas de destino revisadas.",
              "Orçamento, período e indicadores de acompanhamento.",
            ],
          },
        ],
      },
      {
        id: "procedimento",
        title: "Procedimento",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Conferir se o briefing contém objetivo, público, oferta e meta mensurável.",
              "Validar a aderência das peças à oferta e ao canal de distribuição.",
              "Revisar links, eventos de conversão e parâmetros de rastreamento.",
              "Confirmar orçamento, data de início e responsável pelo monitoramento.",
              "Registrar a aprovação final e liberar a ativação da campanha.",
            ],
          },
        ],
      },
      {
        id: "bloqueios",
        title: "Bloqueios de publicação",
        blocks: [
          {
            type: "paragraph",
            text: "A campanha não deve ser publicada com peça pendente, página indisponível, conversão sem teste, orçamento sem aprovação ou ausência de responsável pelo acompanhamento inicial.",
          },
        ],
      },
      {
        id: "criterio-de-pronto",
        title: "Critério de pronto",
        blocks: [
          {
            type: "paragraph",
            text: "A campanha está pronta quando todos os itens do checklist foram validados e a aprovação final possui data, responsável e evidência registrada.",
          },
        ],
      },
    ],
  },
  "sop-fechamento-financeiro": {
    version: "2.0",
    operationalOwner: "Financeiro",
    reviewCycle: "Anual",
    sections: [
      {
        id: "objetivo",
        title: "Objetivo",
        blocks: [
          {
            type: "paragraph",
            text: "Consolidar o resultado financeiro mensal com informações conciliadas, desvios explicados e dados disponíveis para a revisão executiva.",
          },
        ],
      },
      {
        id: "calendario",
        title: "Calendário",
        blocks: [
          {
            type: "paragraph",
            text: "O fechamento começa no primeiro dia útil do mês seguinte e deve ser concluído até o quinto dia útil, salvo calendário aprovado pela liderança financeira.",
          },
        ],
      },
      {
        id: "procedimento",
        title: "Procedimento",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Encerrar lançamentos do período e cobrar documentos pendentes.",
              "Conciliar contas bancárias, recebíveis e meios de pagamento.",
              "Validar despesas, receitas, impostos e provisões do mês.",
              "Comparar realizado, orçamento e mês anterior.",
              "Registrar justificativas para desvios relevantes.",
              "Submeter o fechamento à revisão do responsável financeiro.",
              "Publicar o resumo executivo e arquivar as evidências.",
            ],
          },
        ],
      },
      {
        id: "validacoes",
        title: "Validações obrigatórias",
        blocks: [
          {
            type: "list",
            ordered: false,
            items: [
              "Saldos bancários conciliados com os extratos.",
              "Receitas reconhecidas no período correto.",
              "Despesas sem documento tratadas como pendência explícita.",
              "Desvios relevantes acompanhados de justificativa e responsável.",
            ],
          },
        ],
      },
      {
        id: "criterio-de-pronto",
        title: "Critério de pronto",
        blocks: [
          {
            type: "paragraph",
            text: "O fechamento está concluído após revisão do responsável financeiro, publicação do resumo executivo e arquivamento das conciliações e documentos que sustentam os números apresentados.",
          },
        ],
      },
    ],
  },
};

export async function getManagementAssetsByType(
  type: ManagementAssetType,
  organizationId = demoOrganizationId,
) {
  return managementAssets
    .filter(
      (asset) =>
        asset.type === type && asset.organizationId === organizationId,
    )
    .map((asset) => managementAssetSchema.parse(asset));
}

export async function getSopDocumentById(
  id: string,
  organizationId = demoOrganizationId,
) {
  const asset = managementAssets.find(
    (candidate) =>
      candidate.id === id &&
      candidate.type === "sop" &&
      candidate.organizationId === organizationId,
  );
  const document = sopDocumentDetails[id];

  if (!asset || !document) {
    return null;
  }

  return managementSopDocumentSchema.parse({ ...asset, document });
}
