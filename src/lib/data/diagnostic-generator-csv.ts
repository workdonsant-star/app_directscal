import type { RespondentGroup } from "@/lib/types";

const headers = ["resposta", "grupo", "enviado_em", "dimensao", "pergunta", "nota"] as const;
const groups = ["fundador", "lideranca", "operacao"] as const;

type ResponseRow = {
  responseId: string;
  group: RespondentGroup;
  submittedAt: string;
  dimension: string;
  question: string;
  score: number;
};

export type GeneratorScore = {
  score: number | null;
  responses: number;
};

export type GeneratorQuestion = {
  text: string;
  score: number;
  layers: Record<RespondentGroup, GeneratorScore>;
  gap: number | null;
};

export type GeneratorDimension = {
  name: string;
  score: number;
  layers: Record<RespondentGroup, GeneratorScore>;
  gap: number | null;
  variance: number;
  questions: GeneratorQuestion[];
};

export type GeneratorAnalysis = {
  totalResponses: number;
  period: { first: string; last: string };
  score: number;
  layers: Record<RespondentGroup, GeneratorScore>;
  dimensions: GeneratorDimension[];
  warnings: string[];
};

function parseDelimited(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === ";" && !quoted) {
      row.push(cell.trim()); cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell.trim()); cell = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error("O CSV contém uma célula com aspas sem fechamento.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function mean(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function scoreByGroup(rows: ResponseRow[], scoreOf: (row: ResponseRow) => number): Record<RespondentGroup, GeneratorScore> {
  return Object.fromEntries(groups.map((group) => {
    const selected = rows.filter((row) => row.group === group);
    return [group, { score: selected.length ? mean(selected.map(scoreOf)) : null, responses: new Set(selected.map((row) => row.responseId)).size }];
  })) as Record<RespondentGroup, GeneratorScore>;
}

function gapOf(layers: Record<RespondentGroup, GeneratorScore>) {
  const values = groups.map((group) => layers[group].score).filter((value): value is number => value !== null);
  return values.length > 1 ? Math.max(...values) - Math.min(...values) : null;
}

export function analyzeMaturityResponsesCsv(source: string): GeneratorAnalysis {
  const [header, ...cells] = parseDelimited(source);
  if (!header || header.length !== headers.length || headers.some((value, index) => header[index] !== value)) {
    throw new Error(`O CSV precisa das colunas: ${headers.join(", ")}.`);
  }
  if (cells.length === 0) throw new Error("O CSV não contém respostas.");
  if (cells.length > 100_000) throw new Error("O CSV excede o limite de 100 mil notas.");

  const rows: ResponseRow[] = cells.map((values, index) => {
    const line = index + 2;
    if (values.length !== headers.length) throw new Error(`A linha ${line} tem ${values.length} colunas; eram esperadas ${headers.length}.`);
    const [responseId, group, submittedAt, dimension, question, rawScore] = values;
    if (!responseId || !dimension || !question || !Number.isFinite(Date.parse(submittedAt))) {
      throw new Error(`A linha ${line} tem resposta, data, dimensão ou pergunta inválida.`);
    }
    if (!groups.some((value) => value === group)) throw new Error(`A linha ${line} tem um grupo desconhecido.`);
    const score = Number(rawScore);
    if (!Number.isInteger(score) || score < 1 || score > 5) throw new Error(`A linha ${line} tem nota fora da escala de 1 a 5.`);
    return { responseId, group: group as RespondentGroup, submittedAt, dimension, question, score };
  });

  const questionDimensions = new Map<string, string>();
  const responseRows = new Map<string, ResponseRow[]>();
  for (const row of rows) {
    const previousDimension = questionDimensions.get(row.question);
    if (previousDimension && previousDimension !== row.dimension) throw new Error(`A pergunta “${row.question}” aparece em dimensões diferentes.`);
    questionDimensions.set(row.question, row.dimension);
    const response = responseRows.get(row.responseId) ?? [];
    response.push(row);
    responseRows.set(row.responseId, response);
  }

  const expectedQuestions = new Set(questionDimensions.keys());
  for (const [id, response] of responseRows) {
    const actual = new Set(response.map((row) => row.question));
    if (response.some((row) => row.group !== response[0].group || row.submittedAt !== response[0].submittedAt)) {
      throw new Error(`A resposta ${id} mistura grupos ou datas.`);
    }
    if (actual.size !== response.length || actual.size !== expectedQuestions.size || [...expectedQuestions].some((question) => !actual.has(question))) {
      throw new Error(`A resposta ${id} está incompleta ou contém pergunta duplicada.`);
    }
  }

  const responseScores = [...responseRows.values()].map((response) => ({ ...response[0], score: mean(response.map((row) => row.score)) }));
  const layers = scoreByGroup(responseScores, (row) => row.score);
  const dimensionNames = [...new Set(rows.map((row) => row.dimension))];
  const dimensions = dimensionNames.map((name): GeneratorDimension => {
    const dimensionRows = rows.filter((row) => row.dimension === name);
    const byResponse = [...responseRows.values()].map((response) => {
      const selected = response.filter((row) => row.dimension === name);
      return { ...response[0], score: mean(selected.map((row) => row.score)) };
    });
    const scores = byResponse.map((row) => row.score);
    const average = mean(scores);
    return {
      name,
      score: average,
      layers: scoreByGroup(byResponse, (row) => row.score),
      gap: gapOf(scoreByGroup(byResponse, (row) => row.score)),
      variance: mean(scores.map((score) => (score - average) ** 2)),
      questions: [...new Set(dimensionRows.map((row) => row.question))].map((text) => {
        const selected = dimensionRows.filter((row) => row.question === text);
        const questionLayers = scoreByGroup(selected, (row) => row.score);
        return { text, score: mean(selected.map((row) => row.score)), layers: questionLayers, gap: gapOf(questionLayers) };
      }),
    };
  });

  const counts = groups.map((group) => layers[group].responses);
  const warnings: string[] = [];
  if (layers.fundador.responses < 3) warnings.push(`Fundador: ${layers.fundador.responses} resposta(s). A comparação entre grupos é descritiva e não sustenta generalização.`);
  if (counts.some((count) => count === 0)) warnings.push("Há grupo sem respostas; comparações entre os três grupos ficam incompletas.");
  const dates = [...responseRows.values()].map((response) => response[0].submittedAt).sort();

  return {
    totalResponses: responseRows.size,
    period: { first: dates[0], last: dates.at(-1)! },
    score: mean(responseScores.map((row) => row.score)),
    layers,
    dimensions,
    warnings,
  };
}
