export type GeneratorKind = "contratos" | "diagnosticos" | "documentos" | "propostas" | "sops";

export type GeneratorField = {
  id: string;
  label: string;
  hint?: string;
  multiline?: boolean;
  required?: boolean;
};

export type GeneratorSection = {
  title: string;
  fields: GeneratorField[];
};

export type GeneratorConfig = {
  title: string;
  description: string;
  source: string;
  sections: GeneratorSection[];
};

export const generatorConfigs: Record<GeneratorKind, GeneratorConfig> = {
  contratos: {
    title: "Gerador de contratos",
    description: "Organize partes, escopo e condições comerciais para a minuta contratual.",
    source: "Modelo de contrato DirectScal e variáveis de referência",
    sections: [
      { title: "Partes", fields: [
        { id: "titulo", label: "Nome do contrato", required: true },
        { id: "contratante", label: "Razão social da contratante", required: true },
        { id: "cnpj", label: "CNPJ da contratante" },
        { id: "endereco", label: "Endereço da contratante" },
        { id: "representante", label: "Representante, cargo e contato" },
        { id: "interlocutor", label: "Interlocutor principal do projeto" },
      ] },
      { title: "Projeto e escopo", fields: [
        { id: "objetivo", label: "Objetivo e foco operacional", multiline: true, required: true },
        { id: "frentes", label: "Frentes de trabalho e entregáveis", multiline: true, required: true },
        { id: "exclusoes", label: "Exclusões do escopo", multiline: true },
        { id: "duracao", label: "Duração e data prevista de início" },
        { id: "aceite", label: "Critérios e prazo de aceite", multiline: true },
      ] },
      { title: "Condições comerciais", fields: [
        { id: "valor", label: "Valor total", required: true },
        { id: "parcelas", label: "Parcelas e vencimentos", multiline: true },
        { id: "premissas", label: "Premissas, dependências e condições especiais", multiline: true },
      ] },
    ],
  },
  diagnosticos: {
    title: "Gerador de diagnósticos",
    description: "Estruture a leitura de uma empresa a partir de dados, evidências e limites conhecidos.",
    source: "Modelo editorial do diagnóstico OMDx e relatório comparativo",
    sections: [
      { title: "Identificação", fields: [
        { id: "titulo", label: "Título do diagnóstico", required: true },
        { id: "empresa", label: "Empresa ou área analisada", required: true },
        { id: "periodo", label: "Período de análise" },
        { id: "objetivo", label: "Pergunta central e objetivo", multiline: true, required: true },
      ] },
      { title: "Base de análise", fields: [
        { id: "fontes", label: "Dados, pesquisas e fontes", multiline: true, required: true },
        { id: "metodo", label: "Método e critérios de análise", multiline: true },
        { id: "limitacoes", label: "Lacunas e limitações", multiline: true },
      ] },
      { title: "Leitura e encaminhamento", fields: [
        { id: "achados", label: "Achados sustentados pelas evidências", multiline: true },
        { id: "riscos", label: "Riscos e vulnerabilidades", multiline: true },
        { id: "recomendacoes", label: "Recomendações e prioridades", multiline: true },
        { id: "responsavel", label: "Especialista responsável" },
      ] },
    ],
  },
  documentos: {
    title: "Gerador de documentos gerais",
    description: "Defina o conteúdo e a sequência editorial de um documento executivo.",
    source: "Briefing e modelo visual de documentos gerais DirectScal",
    sections: [
      { title: "Direção editorial", fields: [
        { id: "titulo", label: "Nome do documento", required: true },
        { id: "tipo", label: "Tipo de documento", hint: "Parecer, plano, manual, política ou estudo" },
        { id: "cliente", label: "Cliente, empresa ou área" },
        { id: "publico", label: "Público leitor" },
        { id: "objetivo", label: "Objetivo", multiline: true, required: true },
        { id: "mensagem", label: "Mensagem central", multiline: true },
      ] },
      { title: "Material e estrutura", fields: [
        { id: "contexto", label: "Contexto", multiline: true },
        { id: "conteudo", label: "Conteúdo obrigatório", multiline: true, required: true },
        { id: "fontes", label: "Dados, evidências e fontes", multiline: true },
        { id: "estrutura", label: "Estrutura desejada", multiline: true },
        { id: "restricoes", label: "Restrições e informações pendentes", multiline: true },
      ] },
      { title: "Identificação", fields: [
        { id: "responsavel", label: "Responsável pelo documento" },
        { id: "data", label: "Data ou período de referência" },
      ] },
    ],
  },
  propostas: {
    title: "Gerador de propostas",
    description: "Organize a análise, o escopo e a oferta comercial para revisão.",
    source: "Modelo de proposta DirectScal e variáveis de referência",
    sections: [
      { title: "Contexto", fields: [
        { id: "titulo", label: "Título da proposta", required: true },
        { id: "cliente", label: "Empresa cliente", required: true },
        { id: "desafio", label: "Leitura do desafio", multiline: true, required: true },
        { id: "objetivo", label: "Objetivo do projeto", multiline: true, required: true },
        { id: "resumo", label: "Resumo executivo", multiline: true },
      ] },
      { title: "Entrega", fields: [
        { id: "frentes", label: "Frentes de trabalho e janelas", multiline: true, required: true },
        { id: "entregaveis", label: "Entregáveis por frente", multiline: true },
        { id: "prazo", label: "Duração e cronograma" },
        { id: "premissas", label: "Premissas e dependências", multiline: true },
      ] },
      { title: "Oferta", fields: [
        { id: "investimento", label: "Investimento e forma de pagamento", multiline: true },
        { id: "validade", label: "Validade da proposta" },
        { id: "proximo_passo", label: "Próximo passo" },
      ] },
    ],
  },
  sops: {
    title: "Gerador de SOPs",
    description: "Descreva o processo, seus controles e critérios de conclusão.",
    source: "Briefing e instruções do agente de SOPs operacionais",
    sections: [
      { title: "Processo", fields: [
        { id: "titulo", label: "Nome do processo", required: true },
        { id: "solicitacao", label: "Tipo de solicitação", hint: "Criar ou reescrever um SOP" },
        { id: "contexto", label: "Contexto operacional", multiline: true, required: true },
        { id: "inicio", label: "Gatilho de início", multiline: true, required: true },
        { id: "fim", label: "Evento de conclusão", multiline: true, required: true },
        { id: "escopo", label: "Incluído e fora do escopo", multiline: true },
      ] },
      { title: "Execução", fields: [
        { id: "ferramentas", label: "Ferramentas, registros e status", multiline: true },
        { id: "papeis", label: "Papéis e responsabilidades", multiline: true },
        { id: "etapas", label: "Etapas em ordem cronológica", multiline: true, required: true },
        { id: "sla", label: "SLAs e marcos de revisão", multiline: true },
        { id: "qualidade", label: "Critérios de qualidade e aprovação", multiline: true },
        { id: "riscos", label: "Riscos operacionais conhecidos", multiline: true },
      ] },
      { title: "Referências", fields: [
        { id: "relacionados", label: "Documentos relacionados confirmados", multiline: true },
        { id: "existente", label: "SOP atual para reescrita", multiline: true },
      ] },
    ],
  },
};

export function isGeneratorKind(value: string): value is GeneratorKind {
  return Object.hasOwn(generatorConfigs, value);
}

export function buildGeneratorBriefing(config: GeneratorConfig, values: Record<string, string>) {
  const lines = [`# ${config.title} — briefing`, ""];
  for (const section of config.sections) {
    lines.push(`## ${section.title}`, "");
    for (const field of section.fields) {
      lines.push(`### ${field.label}`, "", values[field.id]?.trim() || `[PENDENTE: ${field.label}]`, "");
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}
