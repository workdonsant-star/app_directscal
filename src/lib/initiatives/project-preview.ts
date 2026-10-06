export const taskStatuses = {
  todo: "A fazer",
  in_progress: "Em andamento",
  review: "Em revisão",
  paused: "Suspensa",
  done: "Concluída",
} as const;

export type ProjectUpdate = {
  id: string;
  author: string;
  text: string;
  at: string;
  source: "Slack" | "Projeto";
  kind?:
    | "progress"
    | "check_in"
    | "blocker"
    | "decision"
    | "card_comment"
    | "notification";
  action?: string;
  delivery?: "simulated";
};

export type ProjectTask = {
  id: string;
  title: string;
  assignee: string;
  assigneeAvatarUrl?: string;
  dueAt: string;
  originalDueAt: string;
  status: keyof typeof taskStatuses;
  attention: "decision" | "blocker" | null;
  followUp: "confirmed" | "awaiting" | "none" | "resolved";
  description: string;
  criteria: string[];
  updates: ProjectUpdate[];
};

export function createProjectPreview(id: string): ProjectTask[] {
  if (id !== "novo-website") return [];
  const base = { originalDueAt: "", criteria: [], updates: [] };
  return [
    {
      ...base,
      id: "identidade",
      title: "Aprovar identidade visual",
      assignee: "Marina Lopes",
      assigneeAvatarUrl: "/initiatives/avatars/marina.jpg",
      dueAt: "2026-10-05T14:00",
      originalDueAt: "2026-10-05T14:00",
      status: "review",
      attention: "decision",
      followUp: "none",
      description: "Material pronto para aprovação.",
      criteria: [
        "Consistência com a identidade da marca",
        "Legibilidade em desktop e celular",
        "Aprovação das aplicações principais",
      ],
      updates: [
        {
          id: "identidade-0",
          author: "Marina Lopes",
          action: "atualizou o progresso",
          text: "Aplicações da marca finalizadas para desktop e celular.",
          at: "2026-10-03T09:10",
          source: "Projeto",
          kind: "progress",
        },
        {
          id: "identidade-1",
          author: "Marina Lopes",
          text: "Identidade visual enviada para revisão. Aguardando aprovação para seguir com as páginas.",
          at: "2026-10-03T09:40",
          source: "Projeto",
          kind: "decision",
          action: "solicitou aprovação",
        },
      ],
    },
    {
      ...base,
      id: "formulario",
      title: "Integrar formulário de contato",
      assignee: "Rafael Costa",
      assigneeAvatarUrl: "/initiatives/avatars/rafael.jpg",
      dueAt: "2026-10-06T12:00",
      originalDueAt: "2026-10-06T12:00",
      status: "in_progress",
      attention: "blocker",
      followUp: "none",
      description:
        "Executor informou que precisa do acesso à ferramenta de formulários.",
      criteria: [
        "Envio validado",
        "Contato recebido pelo responsável comercial",
      ],
      updates: [
        {
          id: "formulario-0",
          author: "Agente",
          action: "acompanhou a tarefa",
          text: "Como está a integração? Existe alguma dependência que possa afetar a entrega?",
          at: "2026-10-03T10:00",
          source: "Slack",
          kind: "check_in",
        },
        {
          id: "formulario-1",
          author: "Rafael Costa",
          text: "Preciso do acesso à ferramenta de formulários para finalizar a integração.",
          at: "2026-10-03T10:20",
          source: "Slack",
          kind: "blocker",
          action: "informou um impedimento",
        },
        {
          id: "formulario-2",
          author: "Agente",
          action: "solicitou uma decisão",
          text: "A integração depende do acesso à ferramenta de formulários. O líder precisa liberar o acesso ou orientar o próximo passo antes da entrega.",
          at: "2026-10-03T10:25",
          source: "Projeto",
          kind: "decision",
        },
      ],
    },
    {
      ...base,
      id: "oferta",
      title: "Revisar página de oferta",
      assignee: "Lucas Ferreira",
      assigneeAvatarUrl: "/initiatives/avatars/lucas.jpg",
      dueAt: "2026-10-05T18:00",
      originalDueAt: "2026-10-05T18:00",
      status: "in_progress",
      attention: null,
      followUp: "confirmed",
      description:
        "Revisar a proposta comercial e os pontos de conversão da página.",
      updates: [
        {
          id: "oferta-1",
          author: "Lucas Ferreira",
          text: "Estou finalizando a revisão. Confirmo a entrega para 05/10 às 18h.",
          at: "2026-10-03T10:35",
          source: "Slack",
        },
      ],
    },
    {
      ...base,
      id: "textos",
      title: "Revisar textos institucionais",
      assignee: "Ana Souza",
      assigneeAvatarUrl: "/initiatives/avatars/ana.jpg",
      dueAt: "2026-10-06T17:00",
      originalDueAt: "2026-10-06T17:00",
      status: "todo",
      attention: null,
      followUp: "awaiting",
      description:
        "Revisar clareza, ortografia e consistência dos textos institucionais.",
      updates: [
        {
          id: "textos-1",
          author: "Agente",
          text: "Como está a revisão dos textos? A entrega está prevista para 06/10 às 17h. Consegue confirmar esse horário?",
          at: "2026-10-03T11:00",
          source: "Slack",
        },
      ],
    },
    {
      ...base,
      id: "homologacao",
      title: "Publicar ambiente de homologação",
      assignee: "Rafael Costa",
      assigneeAvatarUrl: "/initiatives/avatars/rafael.jpg",
      dueAt: "2026-10-07T10:00",
      originalDueAt: "2026-10-07T10:00",
      status: "todo",
      attention: null,
      followUp: "none",
      description: "Disponibilizar o site para validação antes da publicação.",
    },
  ];
}

export function formatTaskDeadline(value: string) {
  if (!value) return "A definir";
  const [date, time] = value.split("T");
  const [, month, day] = date.split("-");
  const [hour, minute] = (time ?? "00:00").split(":");
  return `${day}/${month} às ${hour}h${minute === "00" ? "" : minute}`;
}

export function localTimestamp() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
