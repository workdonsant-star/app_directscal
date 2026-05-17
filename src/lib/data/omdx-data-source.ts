import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { getCurrentAuthSession } from "@/lib/auth/session";
import {
  dashboardSummarySchema,
  diagnosticActionPlanSchema,
  diagnosticResponseWorkspaceSchema,
  diagnosticReportSchema,
  diagnosticShareLinkSchema,
  diagnosticShareWorkspaceSchema,
  dimensionQuestionResultSchema,
  diagnosticSchema,
  diagnosticTemplateSchema,
  dimensionInsightSummarySchema,
  dimensionSchema,
  profileSettingsDataSchema,
  type DashboardSummary,
  type Diagnostic,
  type DiagnosticActionPlan,
  type DiagnosticActionPoint,
  type DiagnosticActionPointOwner,
  type DiagnosticActionPointPriority,
  type DiagnosticReport,
  type DiagnosticReportDimension,
  type DiagnosticReportMisalignment,
  type DiagnosticReportQuestion,
  type DiagnosticShareLink,
  type DiagnosticShareWorkspace,
  type DiagnosticResponseWorkspace,
  type DiagnosticTemplate,
  type Dimension,
  type DimensionId,
  type DimensionInsightSummary,
  type DimensionQuestionResult,
  type ProfileSettingsData,
  type RespondentGroup,
  type ResponsesByGroup,
} from "@/lib/contracts";
import {
  canGenerateDiagnosticActionPlan,
  canGenerateDiagnosticReport,
  classifyScore,
  getRespondentGroups,
  isDimensionId,
  omdxTemplateSlug,
  suggestedMessages,
} from "@/lib/data/omdx-domain";
import {
  buildOmdxOverviewAnalyticsFromReports,
  type OverviewAnalytics,
} from "@/lib/data/omdx-overview-analytics";
import { hasFounderAnalysisBase } from "@/lib/data/omdx-production-rules";
import { getPublicAppUrl } from "@/lib/env";
import { mockUserProfile } from "@/lib/mock-data";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export {
  canGenerateDiagnosticActionPlan,
  canGenerateDiagnosticReport,
  classifyScore,
  getRespondentGroups,
  isDimensionId,
};

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type DiagnosticRow = Database["public"]["Tables"]["diagnostics"]["Row"];
type DiagnosticTemplateRow =
  Database["public"]["Tables"]["diagnostic_templates"]["Row"];
type DimensionRow = Database["public"]["Tables"]["dimensions"]["Row"];
type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
type LikertScalePointRow =
  Database["public"]["Tables"]["likert_scale_points"]["Row"];
type DiagnosticShareLinkRow =
  Database["public"]["Tables"]["diagnostic_share_links"]["Row"];
type ResponseSessionRow = Omit<
  Database["public"]["Tables"]["response_sessions"]["Row"],
  "respondent_id"
>;
type LikertAnswerRow = Database["public"]["Tables"]["likert_answers"]["Row"];

type OmdxModel = {
  dimensions: Dimension[];
  dimensionsByDbId: Map<string, Dimension>;
  questions: QuestionRow[];
  template: DiagnosticTemplate;
  templateRow: DiagnosticTemplateRow;
};

type QuestionAccumulator = {
  byGroup: Record<RespondentGroup, number[]>;
  values: number[];
};

type DiagnosticComputation = {
  generalScore: number | null;
  reportDimensions: DiagnosticReportDimension[] | null;
  responses: ResponsesByGroup;
};

const reportThreshold = 3;
const highGapThreshold = 1;
const mediumScoreThreshold = 3.5;
const varianceThreshold = 0.6;

function getSupabase() {
  return createSupabaseAdminClient();
}

function getEmptyResponses(): ResponsesByGroup {
  return {
    total: 0,
    fundador: 0,
    lideranca: 0,
    operacao: 0,
  };
}

function roundReportScore(value: number) {
  return Number(value.toFixed(1));
}

function roundReportNumber(value: number) {
  return Number(value.toFixed(2));
}

function average(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function averageOrNull(values: Array<number | null>) {
  const numericValues = values.filter((value): value is number => value !== null);

  return numericValues.length > 0 ? average(numericValues) : null;
}

function variance(values: number[]) {
  const valueAverage = average(values);

  return average(values.map((value) => (value - valueAverage) ** 2));
}

function calculateMisalignment(
  scores: Record<RespondentGroup, number | null>,
): DiagnosticReportMisalignment | null {
  const entries = (Object.entries(scores) as [
    RespondentGroup,
    number | null,
  ][])
    .filter((entry): entry is [RespondentGroup, number] => entry[1] !== null)
    .sort(([, a], [, b]) => b - a);

  if (entries.length < 2) return null;

  const highest = entries[0];
  const lowest = entries[entries.length - 1];

  return {
    highestGroup: highest[0],
    lowestGroup: lowest[0],
    value: roundReportScore(highest[1] - lowest[1]),
  };
}

function calculateLayerGap(scores: Record<RespondentGroup, number | null>) {
  const values = Object.values(scores).filter(
    (value): value is number => value !== null,
  );

  if (values.length < 2) return null;

  return Math.max(...values) - Math.min(...values);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function calculatePriorityIndex(score: number, gap: number | null) {
  return clamp(Math.round((((5 - score) + (gap ?? 0)) / 5) * 100), 0, 100);
}

function toDimension(row: DimensionRow): Dimension {
  if (!isDimensionId(row.slug)) {
    throw new Error(`Dimensão OMDx inválida no banco: ${row.slug}`);
  }

  return dimensionSchema.parse({
    id: row.slug,
    number: row.number,
    name: row.name,
    shortName: row.short_name,
    question: row.question,
    description: row.description,
  });
}

function toLikertScalePoint(row: LikertScalePointRow) {
  return {
    value: row.value,
    label: row.label,
  };
}

async function loadOmdxModel(): Promise<OmdxModel> {
  const supabase = getSupabase();
  const { data: templateRow, error: templateError } = await supabase
    .from("diagnostic_templates")
    .select("id,slug,version,name,description,is_locked,created_at")
    .eq("slug", omdxTemplateSlug)
    .eq("is_locked", true)
    .single<DiagnosticTemplateRow>();

  if (templateError) throw templateError;

  const [dimensionsResult, scaleResult, questionsResult] = await Promise.all([
    supabase
      .from("dimensions")
      .select("id,slug,number,name,short_name,question,description")
      .order("number", { ascending: true })
      .returns<DimensionRow[]>(),
    supabase
      .from("likert_scale_points")
      .select("id,template_id,value,label")
      .eq("template_id", templateRow.id)
      .order("value", { ascending: true })
      .returns<LikertScalePointRow[]>(),
    supabase
      .from("questions")
      .select("id,template_id,dimension_id,order_index,text,is_locked")
      .eq("template_id", templateRow.id)
      .order("order_index", { ascending: true })
      .returns<QuestionRow[]>(),
  ]);

  if (dimensionsResult.error) throw dimensionsResult.error;
  if (scaleResult.error) throw scaleResult.error;
  if (questionsResult.error) throw questionsResult.error;

  const dimensions = dimensionsResult.data.map(toDimension);
  const dimensionsByDbId = new Map(
    dimensionsResult.data.map((row, index) => [row.id, dimensions[index]]),
  );
  const template = diagnosticTemplateSchema.parse({
    id: templateRow.slug,
    name: templateRow.name,
    description: templateRow.description,
    dimensions: dimensions.map((dimension) => dimension.id),
    scale: scaleResult.data.map(toLikertScalePoint),
  });
  const questions = [...questionsResult.data].sort((a, b) => {
    const dimensionA = dimensionsByDbId.get(a.dimension_id);
    const dimensionB = dimensionsByDbId.get(b.dimension_id);

    if ((dimensionA?.number ?? 0) !== (dimensionB?.number ?? 0)) {
      return (dimensionA?.number ?? 0) - (dimensionB?.number ?? 0);
    }

    return a.order_index - b.order_index;
  });

  return {
    dimensions,
    dimensionsByDbId,
    questions,
    template,
    templateRow,
  };
}

async function loadAuthorizedOrganizations() {
  const session = await getCurrentAuthSession();

  if (!session) {
    return {
      organizationRows: [] as OrganizationRow[],
      session: null,
    };
  }

  const access = await getAccessibleOrganizationIdsForUser(session.user.id);

  if (access.organizationIds.length === 0) {
    return {
      organizationRows: [] as OrganizationRow[],
      session,
    };
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("organizations")
    .select("id,name,employee_count,domain,created_at,updated_at")
    .in("id", access.organizationIds)
    .order("name", { ascending: true })
    .returns<OrganizationRow[]>();

  if (error) throw error;

  return {
    organizationRows: data,
    session,
  };
}

async function loadAuthorizedDiagnostics(id?: string) {
  const { organizationRows, session } = await loadAuthorizedOrganizations();

  if (!session || organizationRows.length === 0) {
    return {
      diagnosticRows: [] as DiagnosticRow[],
      organizationRows,
    };
  }

  const organizationIds = organizationRows.map((organization) => organization.id);
  const supabase = getSupabase();
  let query = supabase
    .from("diagnostics")
    .select(
      "id,organization_id,template_id,name,description,status,created_at,updated_at,activated_at,closed_at,deadline,general_score",
    )
    .in("organization_id", organizationIds)
    .order("updated_at", { ascending: false });

  if (id) query = query.eq("id", id);

  const { data, error } = await query.returns<DiagnosticRow[]>();

  if (error) throw error;

  return {
    diagnosticRows: data,
    organizationRows,
  };
}

function createResponseMap(diagnostics: DiagnosticRow[]) {
  return new Map(
    diagnostics.map((diagnostic) => [diagnostic.id, getEmptyResponses()]),
  );
}

function createQuestionAccumulator(): QuestionAccumulator {
  return {
    values: [],
    byGroup: {
      fundador: [],
      lideranca: [],
      operacao: [],
    },
  };
}

function buildQuestionSummary({
  accumulator,
  diagnosticId,
  dimensionId,
  question,
}: {
  accumulator: QuestionAccumulator | undefined;
  diagnosticId: string;
  dimensionId: DimensionId;
  question: QuestionRow;
}): DiagnosticReportQuestion | null {
  if (!accumulator || accumulator.values.length === 0) return null;

  const layerScores = getRespondentGroups().reduce(
    (acc, group) => {
      const values = accumulator.byGroup[group.id];

      acc[group.id] =
        values.length > 0 ? roundReportScore(average(values)) : null;

      return acc;
    },
    {} as Record<RespondentGroup, number | null>,
  );

  const score = roundReportScore(average(accumulator.values));

  return {
    id: question.id,
    diagnosticId,
    dimensionId,
    text: question.text,
    score,
    variance: roundReportNumber(variance(accumulator.values)),
    responses: accumulator.values.length,
    layerScores: {
      fundador: layerScores.fundador,
      lideranca: layerScores.lideranca,
      operacao: layerScores.operacao,
    },
  };
}

function buildReportDimensions({
  diagnosticId,
  dimensions,
  dimensionsByDbId,
  questionAccumulatorByKey,
  questions,
  responses,
}: {
  diagnosticId: string;
  dimensions: Dimension[];
  dimensionsByDbId: Map<string, Dimension>;
  questionAccumulatorByKey: Map<string, QuestionAccumulator>;
  questions: QuestionRow[];
  responses: ResponsesByGroup;
}) {
  if (!hasFounderAnalysisBase(responses)) return null;

  const reportDimensions = dimensions
    .map((dimension) => {
      const dimensionQuestions = questions.filter((question) => {
        const questionDimension = dimensionsByDbId.get(question.dimension_id);

        return questionDimension?.id === dimension.id;
      });
      const questionSummaries = dimensionQuestions
        .map((question) =>
          buildQuestionSummary({
            accumulator: questionAccumulatorByKey.get(
              `${diagnosticId}:${question.id}`,
            ),
            diagnosticId,
            dimensionId: dimension.id,
            question,
          }),
        )
        .filter(
          (question): question is DiagnosticReportQuestion =>
            question !== null,
        );

      if (
        dimensionQuestions.length === 0 ||
        questionSummaries.length !== dimensionQuestions.length
      ) {
        return null;
      }

      const score = roundReportScore(
        average(questionSummaries.map((question) => question.score)),
      );
      const layerScores = getRespondentGroups().reduce(
        (acc, group) => {
          const score = averageOrNull(
            questionSummaries.map((question) => question.layerScores[group.id]),
          );

          acc[group.id] = score === null ? null : roundReportScore(score);

          return acc;
        },
        {} as Record<RespondentGroup, number | null>,
      );

      return {
        ...dimension,
        score,
        classification: classifyScore(score),
        variance: roundReportNumber(
          average(questionSummaries.map((question) => question.variance)),
        ),
        responses: responses.total,
        layerScores,
        misalignment: calculateMisalignment(layerScores),
        questions: questionSummaries,
      };
    })
    .filter(
      (dimension): dimension is DiagnosticReportDimension => dimension !== null,
    );

  return reportDimensions.length === dimensions.length
    ? reportDimensions
    : null;
}

async function loadDiagnosticComputations(
  diagnostics: DiagnosticRow[],
  model: OmdxModel,
) {
  const responsesByDiagnosticId = createResponseMap(diagnostics);
  const computations = new Map<string, DiagnosticComputation>();
  const diagnosticIds = diagnostics.map((diagnostic) => diagnostic.id);

  if (diagnosticIds.length === 0) return computations;

  const supabase = getSupabase();
  const { data: sessions, error: sessionsError } = await supabase
    .from("response_sessions")
    .select(
      "id,diagnostic_id,share_link_id,group_id,status,started_at,submitted_at",
    )
    .in("diagnostic_id", diagnosticIds)
    .eq("status", "concluido")
    .returns<ResponseSessionRow[]>();

  if (sessionsError) throw sessionsError;

  sessions.forEach((session) => {
    const responses =
      responsesByDiagnosticId.get(session.diagnostic_id) ?? getEmptyResponses();

    responses.total += 1;
    responses[session.group_id] += 1;
    responsesByDiagnosticId.set(session.diagnostic_id, responses);
  });

  const sessionIds = sessions.map((session) => session.id);
  const questionAccumulatorByKey = new Map<string, QuestionAccumulator>();

  if (sessionIds.length > 0) {
    const { data: answers, error: answersError } = await supabase
      .from("likert_answers")
      .select("id,response_session_id,question_id,value,created_at")
      .in("response_session_id", sessionIds)
      .returns<LikertAnswerRow[]>();

    if (answersError) throw answersError;

    const sessionById = new Map(sessions.map((session) => [session.id, session]));
    const questionById = new Map(
      model.questions.map((question) => [question.id, question]),
    );

    answers.forEach((answer) => {
      const session = sessionById.get(answer.response_session_id);
      const question = questionById.get(answer.question_id);

      if (!session || !question) return;

      const key = `${session.diagnostic_id}:${question.id}`;
      const accumulator =
        questionAccumulatorByKey.get(key) ?? createQuestionAccumulator();

      accumulator.values.push(answer.value);
      accumulator.byGroup[session.group_id].push(answer.value);
      questionAccumulatorByKey.set(key, accumulator);
    });
  }

  diagnostics.forEach((diagnostic) => {
    const responses =
      responsesByDiagnosticId.get(diagnostic.id) ?? getEmptyResponses();
    const reportDimensions = buildReportDimensions({
      diagnosticId: diagnostic.id,
      dimensions: model.dimensions,
      dimensionsByDbId: model.dimensionsByDbId,
      questionAccumulatorByKey,
      questions: model.questions,
      responses,
    });
    const generalScore = reportDimensions
      ? roundReportScore(
          average(reportDimensions.map((dimension) => dimension.score)),
        )
      : null;

    computations.set(diagnostic.id, {
      generalScore,
      reportDimensions,
      responses,
    });
  });

  return computations;
}

function mapDiagnostic({
  computation,
  diagnostic,
  organization,
  template,
}: {
  computation: DiagnosticComputation | undefined;
  diagnostic: DiagnosticRow;
  organization: OrganizationRow;
  template: DiagnosticTemplateRow;
}): Diagnostic {
  return diagnosticSchema.parse({
    id: diagnostic.id,
    organizationId: diagnostic.organization_id,
    organizationName: organization.name,
    company: organization.name,
    name: diagnostic.name,
    description: diagnostic.description,
    templateId: template.slug,
    status: diagnostic.status,
    createdAt: diagnostic.created_at,
    updatedAt: diagnostic.updated_at,
    activatedAt: diagnostic.activated_at,
    closedAt: diagnostic.closed_at,
    deadline: diagnostic.deadline,
    responses: computation?.responses ?? getEmptyResponses(),
    generalScore: computation?.generalScore ?? null,
  });
}

function getGroupLabel(group: RespondentGroup) {
  return getRespondentGroups().find((item) => item.id === group)?.label ?? group;
}

function getLayerMainConcern(dimension: DiagnosticReportDimension) {
  const lowest = (Object.entries(dimension.layerScores) as [
    RespondentGroup,
    number | null,
  ][])
    .filter((entry): entry is [RespondentGroup, number] => entry[1] !== null)
    .sort(([, a], [, b]) => a - b)[0];

  return lowest?.[0] ?? "fundador";
}

function getActionPriority(
  dimension: DiagnosticReportDimension,
): DiagnosticActionPointPriority {
  if (
    dimension.score < reportThreshold ||
    (dimension.misalignment?.value ?? 0) >= highGapThreshold
  ) {
    return "Alta";
  }

  if (
    dimension.score <= mediumScoreThreshold ||
    dimension.questions.some((question) => question.variance >= varianceThreshold)
  ) {
    return "Média";
  }

  return "Baixa";
}

function getActionOwner(dimensionId: DimensionId): DiagnosticActionPointOwner {
  return dimensionId === "cultura" || dimensionId === "visao"
    ? "Fundador"
    : "Liderança";
}

function getSuggestedDeadline(priority: DiagnosticActionPointPriority) {
  if (priority === "Alta") return "30 dias";
  if (priority === "Média") return "60 dias";
  return "90 dias";
}

function getDimensionActionText(dimension: DiagnosticReportDimension) {
  const lowestGroup = getGroupLabel(getLayerMainConcern(dimension));

  const copy: Record<
    DimensionId,
    {
      problem: string;
      action: string;
      impact: string;
      indicator: string;
    }
  > = {
    cultura: {
      problem: `A dimensão Cultura mostra baixa segurança para levantar problemas e aprender com falhas, com maior sensibilidade em ${lowestGroup}.`,
      action:
        "Implantar um ritual quinzenal de identificação de bloqueios, decisões travadas e aprendizados operacionais, com registro simples de encaminhamentos.",
      impact:
        "Reduzir custo político de apontar problemas e acelerar correções antes que virem urgência.",
      indicator:
        "Percentual de bloqueios registrados com responsável e encaminhamento definido no mesmo ciclo.",
    },
    visao: {
      problem: `A dimensão Visão indica perda de clareza entre direção e execução, com maior sensibilidade em ${lowestGroup}.`,
      action:
        "Traduzir prioridades estratégicas em três objetivos operacionais do ciclo, conectando cada área a decisões e tradeoffs explícitos.",
      impact:
        "Aumentar autonomia decisória e reduzir realinhamentos causados por prioridade ambígua.",
      indicator:
        "Percentual de áreas com objetivos do ciclo, dono definido e decisão de prioridade registrada.",
    },
    comunicacao: {
      problem: `A dimensão Comunicação indica fricção no fluxo de informação e nos rituais de gestão, com maior sensibilidade em ${lowestGroup}.`,
      action:
        "Padronizar reuniões críticas com pauta, decisões, donos e próximos passos em um registro único de acompanhamento.",
      impact:
        "Diminuir retrabalho e aumentar previsibilidade entre decisão, comunicação e execução.",
      indicator:
        "Percentual de reuniões críticas com decisão registrada e próximo passo acompanhado.",
    },
    processos: {
      problem: `A dimensão Processos mostra dependência de improviso e pessoas-chave, com maior sensibilidade em ${lowestGroup}.`,
      action:
        "Mapear os cinco processos críticos da operação, definir padrão mínimo de execução e criar checklist de qualidade por entrega.",
      impact:
        "Aumentar repetibilidade operacional e reduzir variação de entrega entre pessoas e áreas.",
      indicator:
        "Percentual de processos críticos com dono, padrão documentado e checklist em uso.",
    },
    lideranca: {
      problem: `A dimensão Liderança indica oportunidade de melhorar delegação, autonomia e accountability, com maior sensibilidade em ${lowestGroup}.`,
      action:
        "Definir matriz simples de responsabilidades por frente crítica, com decisões delegadas, limites de autonomia e cadência de acompanhamento.",
      impact:
        "Reduzir concentração de decisão e dar mais clareza para execução sem microgestão.",
      indicator:
        "Percentual de frentes críticas com responsável, autonomia definida e cadência ativa.",
    },
    performance: {
      problem: `A dimensão Performance indica necessidade de proteger foco e cadência de resultado, com maior sensibilidade em ${lowestGroup}.`,
      action:
        "Revisar indicadores do ciclo e reduzir a gestão a poucos sinais operacionais com dono, frequência e decisão esperada.",
      impact:
        "Melhorar foco operacional e transformar indicador em decisão de gestão, não apenas acompanhamento.",
      indicator:
        "Percentual de indicadores críticos revisados dentro da cadência e vinculados a decisões.",
    },
  };

  return copy[dimension.id];
}

function getCriticalQuestions(dimension: DiagnosticReportDimension) {
  return [...dimension.questions]
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return b.variance - a.variance;
    })
    .slice(0, 3);
}

function buildActionPoint(
  dimension: DiagnosticReportDimension,
): DiagnosticActionPoint {
  const priority = getActionPriority(dimension);
  const owner = getActionOwner(dimension.id);
  const lowestGroup = getLayerMainConcern(dimension);
  const text = getDimensionActionText(dimension);
  const involved = Array.from(
    new Set([owner, "Liderança", getGroupLabel(lowestGroup)]),
  );

  return {
    id: `action_${dimension.id}`,
    dimensionId: dimension.id,
    dimensionName: dimension.name,
    problem: text.problem,
    recommendedAction: text.action,
    owner,
    involved,
    suggestedDeadline: getSuggestedDeadline(priority),
    expectedImpact: text.impact,
    successIndicator: text.indicator,
    priority,
    score: dimension.score,
    gap: dimension.misalignment?.value ?? null,
  };
}

function buildReportFromDimensions({
  diagnostic,
  generatedAt,
  reportDimensions,
}: {
  diagnostic: Diagnostic;
  generatedAt: string;
  reportDimensions: DiagnosticReportDimension[];
}) {
  const respondentGroupOptions = getRespondentGroups();
  const layerAverages = respondentGroupOptions.reduce(
    (acc, group) => {
      const score = averageOrNull(
        reportDimensions.map((dimension) => dimension.layerScores[group.id]),
      );

      acc[group.id] = score === null ? null : roundReportScore(score);
      return acc;
    },
    {} as Record<RespondentGroup, number | null>,
  );
  const weakestDimension = [...reportDimensions].sort(
    (a, b) => a.score - b.score,
  )[0];
  const highestMisalignmentDimension = [...reportDimensions]
    .filter((dimension) => dimension.misalignment !== null)
    .sort(
      (a, b) =>
        (b.misalignment?.value ?? 0) - (a.misalignment?.value ?? 0),
    )[0];

  if (diagnostic.generalScore === null) return undefined;

  return diagnosticReportSchema.parse({
    diagnostic,
    generatedAt,
    threshold: reportThreshold,
    generalScore: diagnostic.generalScore,
    classification: classifyScore(diagnostic.generalScore),
    responses: diagnostic.responses,
    layerAverages,
    weakestDimension: {
      id: weakestDimension.id,
      name: weakestDimension.name,
      shortName: weakestDimension.shortName,
      score: weakestDimension.score,
      classification: weakestDimension.classification,
    },
    highestMisalignment: highestMisalignmentDimension?.misalignment
      ? {
          dimensionId: highestMisalignmentDimension.id,
          dimensionName: highestMisalignmentDimension.name,
          ...highestMisalignmentDimension.misalignment,
        }
      : null,
    dimensions: reportDimensions,
  });
}

function buildShareLink(row: DiagnosticShareLinkRow): DiagnosticShareLink {
  return diagnosticShareLinkSchema.parse({
    diagnosticId: row.diagnostic_id,
    group: row.group_id,
    token: row.token,
    publicUrl: `${getPublicAppUrl()}/r/${row.token}`,
    previewPath: `/r/${row.token}`,
    suggestedMessage: suggestedMessages[row.group_id],
  });
}

async function loadShareLinks(diagnosticIds: string[]) {
  if (diagnosticIds.length === 0) {
    return {} as Record<string, DiagnosticShareLink[]>;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("diagnostic_share_links")
    .select("id,diagnostic_id,group_id,token,created_at,expires_at")
    .in("diagnostic_id", diagnosticIds)
    .returns<DiagnosticShareLinkRow[]>();

  if (error) throw error;

  return data.reduce(
    (acc, row) => {
      acc[row.diagnostic_id] = [
        ...(acc[row.diagnostic_id] ?? []),
        buildShareLink(row),
      ].sort((a, b) => {
        const order = ["fundador", "lideranca", "operacao"];

        return order.indexOf(a.group) - order.indexOf(b.group);
      });

      return acc;
    },
    {} as Record<string, DiagnosticShareLink[]>,
  );
}

export function getProfileSettingsData(): ProfileSettingsData {
  return profileSettingsDataSchema.parse(mockUserProfile);
}

export async function getDimensions(): Promise<Dimension[]> {
  const model = await loadOmdxModel();

  return model.dimensions;
}

export async function getDimensionById(id: DimensionId): Promise<Dimension> {
  const dimensions = await getDimensions();
  const dimension = dimensions.find((item) => item.id === id);

  if (!dimension) throw new Error(`Dimension not found: ${id}`);

  return dimensionSchema.parse(dimension);
}

export async function getDefaultDiagnosticTemplate(): Promise<DiagnosticTemplate> {
  const model = await loadOmdxModel();

  return model.template;
}

export async function getDiagnosticTemplates(): Promise<DiagnosticTemplate[]> {
  return [await getDefaultDiagnosticTemplate()];
}

export async function getDiagnostics(): Promise<Diagnostic[]> {
  const [{ diagnosticRows, organizationRows }, model] = await Promise.all([
    loadAuthorizedDiagnostics(),
    loadOmdxModel(),
  ]);
  const organizationsById = new Map(
    organizationRows.map((organization) => [organization.id, organization]),
  );
  const computations = await loadDiagnosticComputations(diagnosticRows, model);

  return diagnosticRows
    .map((diagnostic) => {
      const organization = organizationsById.get(diagnostic.organization_id);

      if (!organization) return null;

      return mapDiagnostic({
        computation: computations.get(diagnostic.id),
        diagnostic,
        organization,
        template: model.templateRow,
      });
    })
    .filter((diagnostic): diagnostic is Diagnostic => diagnostic !== null);
}

export async function getDiagnosticById(
  id: string,
): Promise<Diagnostic | undefined> {
  const [{ diagnosticRows, organizationRows }, model] = await Promise.all([
    loadAuthorizedDiagnostics(id),
    loadOmdxModel(),
  ]);
  const diagnostic = diagnosticRows[0];

  if (!diagnostic) return undefined;

  const organization = organizationRows.find(
    (item) => item.id === diagnostic.organization_id,
  );

  if (!organization) return undefined;

  const computations = await loadDiagnosticComputations([diagnostic], model);

  return mapDiagnostic({
    computation: computations.get(diagnostic.id),
    diagnostic,
    organization,
    template: model.templateRow,
  });
}

export async function getDiagnosticShareLinksByDiagnosticIds(
  diagnosticIds: string[],
): Promise<Record<string, DiagnosticShareLink[]>> {
  return loadShareLinks(diagnosticIds);
}

export async function getDiagnosticShareWorkspace(
  diagnosticId: string,
): Promise<DiagnosticShareWorkspace | undefined> {
  const diagnostic = await getDiagnosticById(diagnosticId);

  if (!diagnostic) return undefined;

  const linksByDiagnosticId = await loadShareLinks([diagnostic.id]);
  const links = linksByDiagnosticId[diagnostic.id] ?? [];

  if (links.length !== 3) return undefined;

  return diagnosticShareWorkspaceSchema.parse({
    diagnostic,
    links,
    responses: diagnostic.responses,
  });
}

export async function getDiagnosticByResponseToken(
  token: string,
): Promise<DiagnosticResponseWorkspace | undefined> {
  const supabase = getSupabase();
  const { data: shareLink, error: shareLinkError } = await supabase
    .from("diagnostic_share_links")
    .select("id,diagnostic_id,group_id,token,created_at,expires_at")
    .eq("token", token)
    .maybeSingle<DiagnosticShareLinkRow>();

  if (shareLinkError) throw shareLinkError;
  if (!shareLink) return undefined;

  const [{ data: diagnosticRow, error: diagnosticError }, model] =
    await Promise.all([
      supabase
        .from("diagnostics")
        .select(
          "id,organization_id,template_id,name,description,status,created_at,updated_at,activated_at,closed_at,deadline,general_score",
        )
        .eq("id", shareLink.diagnostic_id)
        .maybeSingle<DiagnosticRow>(),
      loadOmdxModel(),
    ]);

  if (diagnosticError) throw diagnosticError;
  if (!diagnosticRow) return undefined;

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id,name,employee_count,domain,created_at,updated_at")
    .eq("id", diagnosticRow.organization_id)
    .single<OrganizationRow>();

  if (organizationError) throw organizationError;

  const computations = await loadDiagnosticComputations([diagnosticRow], model);
  const group = getRespondentGroups().find(
    (option) => option.id === shareLink.group_id,
  );

  if (!group) return undefined;

  const diagnostic = mapDiagnostic({
    computation: computations.get(diagnosticRow.id),
    diagnostic: diagnosticRow,
    organization,
    template: model.templateRow,
  });

  return diagnosticResponseWorkspaceSchema.parse({
    token: shareLink.token,
    diagnostic,
    expiresAt: shareLink.expires_at,
    group,
    template: model.template,
    dimensions: model.dimensions.map((dimension) => ({
      ...dimension,
      questions: model.questions
        .filter((question) => {
          const questionDimension = model.dimensionsByDbId.get(
            question.dimension_id,
          );

          return questionDimension?.id === dimension.id;
        })
        .map((question) => ({
          id: question.id,
          dimensionId: dimension.id,
          orderIndex: question.order_index,
          text: question.text,
        })),
    })),
  });
}

export async function getDiagnosticReport(
  diagnosticId: string,
  generatedAt = new Date().toISOString(),
): Promise<DiagnosticReport | undefined> {
  const [{ diagnosticRows, organizationRows }, model] = await Promise.all([
    loadAuthorizedDiagnostics(diagnosticId),
    loadOmdxModel(),
  ]);
  const diagnosticRow = diagnosticRows[0];

  if (!diagnosticRow) return undefined;

  const organization = organizationRows.find(
    (item) => item.id === diagnosticRow.organization_id,
  );

  if (!organization) return undefined;

  const computations = await loadDiagnosticComputations([diagnosticRow], model);
  const computation = computations.get(diagnosticRow.id);

  if (!computation?.reportDimensions) return undefined;

  const diagnostic = mapDiagnostic({
    computation,
    diagnostic: diagnosticRow,
    organization,
    template: model.templateRow,
  });

  return buildReportFromDimensions({
    diagnostic,
    generatedAt,
    reportDimensions: computation.reportDimensions,
  });
}

export async function getDiagnosticActionPlan(
  diagnosticId: string,
  generatedAt = new Date().toISOString(),
): Promise<DiagnosticActionPlan | undefined> {
  const report = await getDiagnosticReport(diagnosticId, generatedAt);

  if (!report) {
    return undefined;
  }

  const actionDimensions = report.dimensions.map((dimension) => ({
    id: dimension.id,
    name: dimension.name,
    shortName: dimension.shortName,
    score: dimension.score,
    classification: dimension.classification,
    gap: dimension.misalignment?.value ?? null,
    layerScores: dimension.layerScores,
    criticalQuestions: getCriticalQuestions(dimension),
  }));
  const actionPoints = report.dimensions
    .map(buildActionPoint)
    .sort((a, b) => {
      const priorityWeight: Record<DiagnosticActionPointPriority, number> = {
        Alta: 3,
        Média: 2,
        Baixa: 1,
      };

      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }

      if (a.score !== b.score) return a.score - b.score;
      return (b.gap ?? 0) - (a.gap ?? 0);
    });

  return diagnosticActionPlanSchema.parse({
    diagnostic: report.diagnostic,
    generatedAt: report.generatedAt,
    generalScore: report.generalScore,
    classification: report.classification,
    responses: report.responses,
    weakestDimension: report.weakestDimension,
    highestMisalignment: report.highestMisalignment,
    layerAverages: report.layerAverages,
    dimensions: actionDimensions,
    actionPoints,
  });
}

export async function getLatestReportableDiagnostic(): Promise<
  Diagnostic | undefined
> {
  return (await getDiagnostics())
    .filter(canGenerateDiagnosticReport)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];
}

async function getReportsForFilter(filter: "todos" | string = "todos") {
  const diagnostics =
    filter === "todos"
      ? (await getDiagnostics()).filter(canGenerateDiagnosticReport)
      : [await getDiagnosticById(filter)].filter(
          (diagnostic): diagnostic is Diagnostic =>
            diagnostic !== undefined && canGenerateDiagnosticReport(diagnostic),
        );
  const reports = await Promise.all(
    diagnostics.map((diagnostic) => getDiagnosticReport(diagnostic.id)),
  );

  return reports.filter((report): report is DiagnosticReport => Boolean(report));
}

export async function getDimensionInsightDiagnosticOptions(): Promise<
  Diagnostic[]
> {
  return (await getDiagnostics()).filter(canGenerateDiagnosticReport);
}

export async function getDimensionInsightSummary(
  dimensionId: DimensionId,
  filter: "todos" | string = "todos",
): Promise<DimensionInsightSummary> {
  const reports = await getReportsForFilter(filter);
  const trend = reports
    .map((report) => {
      const dimension = report.dimensions.find((item) => item.id === dimensionId);

      if (!dimension) return null;

      return {
        diagnosticId: report.diagnostic.id,
        diagnosticName: report.diagnostic.name,
        company: report.diagnostic.company,
        responses: report.responses.total,
        score: dimension.score,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const scores = trend.map((item) => item.score);
  const totalResponses = trend.reduce((acc, item) => acc + item.responses, 0);
  const averageScore =
    scores.length > 0
      ? roundReportScore(scores.reduce((acc, score) => acc + score, 0) / scores.length)
      : null;
  const layerScores = getRespondentGroups().reduce(
    (acc, group) => {
      const values = reports
        .map((report) =>
          report.dimensions.find((dimension) => dimension.id === dimensionId),
        )
        .filter(
          (dimension): dimension is DiagnosticReportDimension =>
            dimension !== undefined,
        )
        .map((dimension) => dimension.layerScores[group.id])
        .filter((value): value is number => value !== null);

      acc[group.id] =
        values.length > 0
          ? roundReportScore(values.reduce((sum, value) => sum + value, 0) / values.length)
          : null;

      return acc;
    },
    { fundador: null, lideranca: null, operacao: null } as Record<
      RespondentGroup,
      number | null
    >,
  );

  return dimensionInsightSummarySchema.parse({
    dimensionId,
    filter,
    totalResponses,
    averageScore,
    diagnosticsWithData: trend.length,
    variation: scores.length > 1 ? Math.max(...scores) - Math.min(...scores) : null,
    layerScores,
    trend,
  });
}

export async function getDimensionQuestionResults(
  dimensionId: DimensionId,
  filter: "todos" | string = "todos",
): Promise<DimensionQuestionResult[]> {
  const reports = await getReportsForFilter(filter);
  const questions = reports.flatMap((report) =>
    report.dimensions.flatMap((dimension) =>
      dimension.id === dimensionId ? dimension.questions : [],
    ),
  );
  const groupedQuestions = questions.reduce((acc, question) => {
    const key = `${question.dimensionId}:${question.text}`;
    const group = acc.get(key) ?? [];

    group.push(question);
    acc.set(key, group);

    return acc;
  }, new Map<string, DiagnosticReportQuestion[]>());

  return Array.from(groupedQuestions.entries())
    .map(([key, group]) => {
      const firstQuestion = group[0];
      const score = roundReportScore(
        average(group.map((question) => question.score)),
      );
      const layerScores = getRespondentGroups().reduce(
        (acc, respondentGroup) => {
          const score = averageOrNull(
            group.map((question) => question.layerScores[respondentGroup.id]),
          );

          acc[respondentGroup.id] = score === null ? null : roundReportScore(score);

          return acc;
        },
        {} as Record<RespondentGroup, number | null>,
      );
      const rawGap = calculateLayerGap(layerScores);
      const gap = rawGap === null ? null : roundReportScore(rawGap);

      return dimensionQuestionResultSchema.parse({
        id: key,
        dimensionId,
        text: firstQuestion.text,
        score,
        gap,
        responses: group.reduce(
          (total, question) => total + question.responses,
          0,
        ),
        classification: classifyScore(score),
        priorityIndex: calculatePriorityIndex(score, gap),
      });
    })
    .sort((a, b) => {
      if (a.priorityIndex !== b.priorityIndex) {
        return b.priorityIndex - a.priorityIndex;
      }

      return a.score - b.score;
    });
}

export async function getOmdxOverviewDiagnosticOptions(): Promise<Diagnostic[]> {
  return (await getDiagnostics()).filter(canGenerateDiagnosticReport);
}

export async function getOmdxOverviewAnalytics(
  selectedDiagnostic = "todos",
): Promise<OverviewAnalytics> {
  const reports = await getReportsForFilter(selectedDiagnostic);

  return buildOmdxOverviewAnalyticsFromReports(reports);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const diagnostics = await getDiagnostics();
  const withScore = diagnostics.filter((diagnostic) => diagnostic.generalScore !== null);
  const averageScore =
    withScore.length > 0
      ? average(withScore.map((diagnostic) => diagnostic.generalScore ?? 0))
      : null;
  const latestReportable = await getLatestReportableDiagnostic();
  const latestReport = latestReportable
    ? await getDiagnosticReport(latestReportable.id)
    : undefined;
  const weakestDimension = latestReport?.weakestDimension;

  return dashboardSummarySchema.parse({
    activeDiagnostics: diagnostics.filter((diagnostic) => diagnostic.status === "ativo").length,
    totalResponses: diagnostics.reduce(
      (acc, diagnostic) => acc + diagnostic.responses.total,
      0,
    ),
    averageScore,
    topGap: {
      name: weakestDimension?.shortName ?? "",
      score: weakestDimension?.score ?? 1,
    },
  });
}
