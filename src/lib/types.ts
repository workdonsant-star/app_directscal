export type DiagnosticStatus = "rascunho" | "ativo" | "encerrado";

export type RespondentGroup = "fundador" | "lideranca" | "operacao";

export type DimensionId =
  | "cultura"
  | "visao"
  | "comunicacao"
  | "processos"
  | "lideranca"
  | "performance";

export type Dimension = {
  id: DimensionId;
  number: number;
  name: string;
  shortName: string;
  question: string;
  description: string;
};

export type Diagnostic = {
  id: string;
  name: string;
  company: string;
  status: DiagnosticStatus;
  createdAt: string;
  deadline: string | null;
  responses: {
    total: number;
    fundador: number;
    lideranca: number;
    operacao: number;
  };
  generalScore: number | null;
};

export type Classification =
  | "Crítico"
  | "Em desenvolvimento"
  | "Em estruturação"
  | "Maduro"
  | "Referência";
