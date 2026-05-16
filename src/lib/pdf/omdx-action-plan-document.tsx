import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type {
  DiagnosticActionPlan,
  DiagnosticActionPlanDimension,
  DiagnosticActionPoint,
  RespondentGroup,
} from "@/lib/types";

Font.registerHyphenationCallback((word) => [word]);

const colors = {
  background: "#FFFFFF",
  foreground: "#111114",
  muted: "#4A4A52",
  border: "#E2E2E5",
  soft: "#F5F5F6",
  brand: "#185EFF",
  brandDark: "#0B2E78",
  negative: "#B42318",
};

const groupLabels: Record<RespondentGroup, string> = {
  fundador: "Fundador",
  lideranca: "Liderança",
  operacao: "Operação",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

function formatScore(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function getScoreColor(score: number) {
  return score < 3 ? colors.negative : colors.brand;
}

function reportFileSource(plan: DiagnosticActionPlan) {
  return `${plan.diagnostic.name} / ${plan.diagnostic.company}`;
}

function ReportFooter({ plan }: { plan: DiagnosticActionPlan }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>Fonte: {reportFileSource(plan)}</Text>
      <Text
        style={styles.footerPage}
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
      <Text style={styles.footerText}>Directscal</Text>
    </View>
  );
}

function ReportHeader({
  plan,
  section,
}: {
  plan: DiagnosticActionPlan;
  section: string;
}) {
  return (
    <View style={styles.header} fixed>
      <View>
        <Text style={styles.headerKicker}>OMDx</Text>
        <Text style={styles.headerTitle}>{section}</Text>
      </View>
      <View style={styles.headerMeta}>
        <Text>{plan.diagnostic.company}</Text>
        <Text>Gerado em {formatDate(plan.generatedAt)}</Text>
      </View>
    </View>
  );
}

function Metric({
  caption,
  label,
  value,
}: {
  caption: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricCaption}>{caption}</Text>
    </View>
  );
}

function PriorityPill({ priority }: { priority: DiagnosticActionPoint["priority"] }) {
  const isHigh = priority === "Alta";
  return (
    <View
      style={[
        styles.priorityPill,
        isHigh ? styles.priorityHigh : styles.priorityDefault,
      ]}
    >
      <Text style={isHigh ? styles.priorityHighText : styles.priorityText}>
        {priority}
      </Text>
    </View>
  );
}

function CoverPage({ plan }: { plan: DiagnosticActionPlan }) {
  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverTop}>
        <Text style={styles.brand}>Directscal</Text>
        <Text style={styles.coverDate}>Gerado em {formatDate(plan.generatedAt)}</Text>
      </View>

      <View style={styles.coverMain}>
        <Text style={styles.coverKicker}>Plano de ação</Text>
        <Text style={styles.coverTitle}>OMDx Action Points</Text>
        <Text style={styles.coverSubtitle}>
          Resultados, leitura da pesquisa e plano RACI
        </Text>
        <Text style={styles.coverCompany}>{plan.diagnostic.company}</Text>
      </View>

      <View style={styles.readingBox}>
        <Text style={styles.readingLabel}>Síntese executiva</Text>
        <Text style={styles.readingText}>
          {plan.diagnostic.company} apresenta score geral de{" "}
          {formatScore(plan.generalScore)}, classificado como{" "}
          {plan.classification}. O principal gargalo está em{" "}
          {plan.weakestDimension.shortName} e o maior desalinhamento aparece em{" "}
          {plan.highestMisalignment.dimensionName}.
        </Text>
        <Text style={styles.readingText}>
          O plano abaixo prioriza ações que reduzem fricção operacional,
          clarificam responsabilidade e atacam gaps de percepção entre fundador,
          liderança e operação.
        </Text>
      </View>

      <View style={styles.coverGrid}>
        <Metric
          label="Score geral"
          value={formatScore(plan.generalScore)}
          caption={plan.classification}
        />
        <Metric
          label="Respostas"
          value={plan.responses.total.toLocaleString("pt-BR")}
          caption="Base consolidada"
        />
        <Metric
          label="Maior gargalo"
          value={formatScore(plan.weakestDimension.score)}
          caption={plan.weakestDimension.shortName}
        />
        <Metric
          label="Action points"
          value={plan.actionPoints.length.toString()}
          caption="Plano RACI"
        />
      </View>

      <ReportFooter plan={plan} />
    </Page>
  );
}

function DimensionTable({ dimensions }: { dimensions: DiagnosticActionPlanDimension[] }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCell, styles.dimensionColumn]}>Dimensão</Text>
        <Text style={styles.smallCell}>Score</Text>
        <Text style={styles.mediumCell}>Classificação</Text>
        <Text style={styles.smallCell}>Gap</Text>
        <Text style={styles.smallCell}>Fundador</Text>
        <Text style={styles.smallCell}>Liderança</Text>
        <Text style={styles.smallCell}>Operação</Text>
      </View>
      {dimensions.map((dimension) => (
        <View key={dimension.id} style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.dimensionColumn]}>
            {dimension.shortName}
          </Text>
          <Text
            style={[
              styles.smallCell,
              { color: getScoreColor(dimension.score) },
            ]}
          >
            {formatScore(dimension.score)}
          </Text>
          <Text style={styles.mediumCell}>{dimension.classification}</Text>
          <Text style={styles.smallCell}>{formatScore(dimension.gap)}</Text>
          <Text style={styles.smallCell}>
            {formatScore(dimension.layerScores.fundador)}
          </Text>
          <Text style={styles.smallCell}>
            {formatScore(dimension.layerScores.lideranca)}
          </Text>
          <Text style={styles.smallCell}>
            {formatScore(dimension.layerScores.operacao)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function LayerAverages({ plan }: { plan: DiagnosticActionPlan }) {
  return (
    <View style={styles.layerGrid}>
      {(["fundador", "lideranca", "operacao"] as RespondentGroup[]).map(
        (group) => (
          <View key={group} style={styles.layerCard}>
            <Text style={styles.metricLabel}>{groupLabels[group]}</Text>
            <Text style={styles.metricValue}>
              {formatScore(plan.layerAverages[group])}
            </Text>
            <Text style={styles.metricCaption}>Média das dimensões</Text>
          </View>
        ),
      )}
    </View>
  );
}

function ResultsPage({ plan }: { plan: DiagnosticActionPlan }) {
  return (
    <Page size="A4" style={styles.page}>
      <ReportHeader plan={plan} section="Resultado da pesquisa" />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dimensões e percepção por camada</Text>
        <Text style={styles.sectionText}>
          A tabela consolida score, classificação, gap principal e percepção de
          fundador, liderança e operação para orientar a priorização do plano.
        </Text>
      </View>
      <DimensionTable dimensions={plan.dimensions} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Média por camada</Text>
        <LayerAverages plan={plan} />
      </View>

      <ReportFooter plan={plan} />
    </Page>
  );
}

function ActionPointCard({ actionPoint }: { actionPoint: DiagnosticActionPoint }) {
  return (
    <View style={styles.actionCard} wrap={false}>
      <View style={styles.actionHeader}>
        <View>
          <Text style={styles.actionDimension}>{actionPoint.dimensionName}</Text>
          <Text style={styles.actionMeta}>
            Score {formatScore(actionPoint.score)} / Gap{" "}
            {formatScore(actionPoint.gap)}
          </Text>
        </View>
        <PriorityPill priority={actionPoint.priority} />
      </View>

      <View style={styles.actionBlock}>
        <Text style={styles.actionLabel}>Problema</Text>
        <Text style={styles.actionText}>{actionPoint.problem}</Text>
      </View>
      <View style={styles.actionBlock}>
        <Text style={styles.actionLabel}>Ação recomendada</Text>
        <Text style={styles.actionText}>{actionPoint.recommendedAction}</Text>
      </View>

      <View style={styles.raciGrid}>
        <View style={styles.raciCell}>
          <Text style={styles.actionLabel}>Responsável</Text>
          <Text style={styles.actionText}>{actionPoint.owner}</Text>
        </View>
        <View style={styles.raciCell}>
          <Text style={styles.actionLabel}>Envolvidos</Text>
          <Text style={styles.actionText}>{actionPoint.involved.join(", ")}</Text>
        </View>
        <View style={styles.raciCell}>
          <Text style={styles.actionLabel}>Prazo</Text>
          <Text style={styles.actionText}>{actionPoint.suggestedDeadline}</Text>
        </View>
      </View>

      <View style={styles.actionBlock}>
        <Text style={styles.actionLabel}>Impacto esperado</Text>
        <Text style={styles.actionText}>{actionPoint.expectedImpact}</Text>
      </View>
      <View style={styles.actionBlock}>
        <Text style={styles.actionLabel}>Indicador de sucesso</Text>
        <Text style={styles.actionText}>{actionPoint.successIndicator}</Text>
      </View>
    </View>
  );
}

function ActionPointsPage({ plan }: { plan: DiagnosticActionPlan }) {
  return (
    <Page size="A4" style={styles.page}>
      <ReportHeader plan={plan} section="Plano de ação RACI" />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Action points priorizados</Text>
        <Text style={styles.sectionText}>
          As ações foram ordenadas por prioridade, score da dimensão e gap entre
          camadas.
        </Text>
      </View>
      {plan.actionPoints.map((actionPoint) => (
        <ActionPointCard key={actionPoint.id} actionPoint={actionPoint} />
      ))}
      <ReportFooter plan={plan} />
    </Page>
  );
}

function DimensionAnnex({
  dimension,
}: {
  dimension: DiagnosticActionPlanDimension;
}) {
  return (
    <View style={styles.annexBlock} wrap={false}>
      <View style={styles.annexHeader}>
        <Text style={styles.annexTitle}>{dimension.name}</Text>
        <Text style={[styles.annexScore, { color: getScoreColor(dimension.score) }]}>
          {formatScore(dimension.score)}
        </Text>
      </View>
      <Text style={styles.annexMeta}>
        {dimension.classification} / Gap {formatScore(dimension.gap)}
      </Text>
      <View style={styles.annexLayerRow}>
        {(["fundador", "lideranca", "operacao"] as RespondentGroup[]).map(
          (group) => (
            <Text key={group} style={styles.annexLayerText}>
              {groupLabels[group]} {formatScore(dimension.layerScores[group])}
            </Text>
          ),
        )}
      </View>
      <Text style={styles.actionLabel}>Perguntas críticas</Text>
      {dimension.criticalQuestions.map((question) => (
        <View key={question.id} style={styles.questionRow}>
          <Text style={styles.questionText}>{question.text}</Text>
          <Text style={styles.questionScore}>
            {formatScore(question.score)} / Var. {formatScore(question.variance)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function AnnexPage({ plan }: { plan: DiagnosticActionPlan }) {
  return (
    <Page size="A4" style={styles.page}>
      <ReportHeader plan={plan} section="Anexo por dimensão" />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Evidências usadas no plano</Text>
        <Text style={styles.sectionText}>
          Cada bloco mostra os scores por camada e as perguntas críticas que
          orientaram a geração dos action points.
        </Text>
      </View>
      {plan.dimensions.map((dimension) => (
        <DimensionAnnex key={dimension.id} dimension={dimension} />
      ))}
      <ReportFooter plan={plan} />
    </Page>
  );
}

export function OmdxActionPlanDocument({
  plan,
}: {
  plan: DiagnosticActionPlan;
}) {
  return (
    <Document
      author="Directscal"
      subject="Plano de ação OMDx"
      title={`Action points OMDx — ${plan.diagnostic.company}`}
    >
      <CoverPage plan={plan} />
      <ResultsPage plan={plan} />
      <ActionPointsPage plan={plan} />
      <AnnexPage plan={plan} />
    </Document>
  );
}

const styles = StyleSheet.create({
  coverPage: {
    padding: 34,
    paddingBottom: 42,
    backgroundColor: colors.background,
    color: colors.foreground,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  page: {
    padding: 34,
    paddingTop: 72,
    paddingBottom: 44,
    backgroundColor: colors.background,
    color: colors.foreground,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  coverTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 72,
  },
  brand: {
    fontSize: 13,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  coverDate: {
    color: colors.muted,
    fontSize: 9,
  },
  coverMain: {
    marginBottom: 28,
  },
  coverKicker: {
    color: colors.brand,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  coverTitle: {
    fontSize: 38,
    lineHeight: 1.05,
    marginBottom: 8,
  },
  coverSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 24,
  },
  coverCompany: {
    fontSize: 18,
  },
  readingBox: {
    borderLeftWidth: 2,
    borderLeftColor: colors.brand,
    paddingLeft: 12,
    marginBottom: 22,
  },
  readingLabel: {
    color: colors.muted,
    fontSize: 8,
    letterSpacing: 1.4,
    marginBottom: 7,
    textTransform: "uppercase",
  },
  readingText: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 1.45,
    marginBottom: 6,
  },
  coverGrid: {
    flexDirection: "row",
    gap: 10,
  },
  metric: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 8,
    letterSpacing: 1,
    marginBottom: 7,
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.foreground,
    fontSize: 20,
    marginBottom: 5,
  },
  metricCaption: {
    color: colors.muted,
    fontSize: 8,
  },
  header: {
    position: "absolute",
    top: 26,
    left: 34,
    right: 34,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    color: colors.muted,
    fontSize: 8,
  },
  headerKicker: {
    color: colors.brand,
    letterSpacing: 1.8,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: colors.foreground,
    fontSize: 12,
  },
  headerMeta: {
    alignItems: "flex-end",
    gap: 2,
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 34,
    right: 34,
    flexDirection: "row",
    justifyContent: "space-between",
    color: colors.muted,
    fontSize: 7,
  },
  footerText: {
    width: "35%",
  },
  footerPage: {
    width: "30%",
    textAlign: "center",
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 7,
  },
  sectionText: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 1.4,
    maxWidth: 440,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    marginBottom: 18,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.soft,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    padding: 7,
    fontSize: 8,
  },
  dimensionColumn: {
    width: 118,
  },
  smallCell: {
    width: 52,
    padding: 7,
    fontSize: 8,
    textAlign: "right",
  },
  mediumCell: {
    width: 108,
    padding: 7,
    fontSize: 8,
  },
  layerGrid: {
    flexDirection: "row",
    gap: 10,
  },
  layerCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
  },
  actionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    padding: 12,
    marginBottom: 10,
  },
  actionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  actionDimension: {
    fontSize: 12,
    marginBottom: 3,
  },
  actionMeta: {
    color: colors.muted,
    fontSize: 8,
  },
  priorityPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    height: 20,
  },
  priorityHigh: {
    backgroundColor: colors.negative,
  },
  priorityDefault: {
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityHighText: {
    color: "#FFFFFF",
    fontSize: 8,
  },
  priorityText: {
    color: colors.foreground,
    fontSize: 8,
  },
  actionBlock: {
    marginBottom: 8,
  },
  actionLabel: {
    color: colors.muted,
    fontSize: 7,
    letterSpacing: 0.8,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  actionText: {
    color: colors.foreground,
    fontSize: 8.5,
    lineHeight: 1.35,
  },
  raciGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  raciCell: {
    flex: 1,
    backgroundColor: colors.soft,
    borderRadius: 4,
    padding: 8,
  },
  annexBlock: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 10,
    marginBottom: 9,
  },
  annexHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  annexTitle: {
    fontSize: 11,
  },
  annexScore: {
    fontSize: 12,
  },
  annexMeta: {
    color: colors.muted,
    fontSize: 8,
    marginBottom: 6,
  },
  annexLayerRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 7,
  },
  annexLayerText: {
    flex: 1,
    color: colors.muted,
    fontSize: 8,
  },
  questionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 5,
    marginTop: 5,
  },
  questionText: {
    flex: 1,
    color: colors.foreground,
    fontSize: 8,
    lineHeight: 1.3,
  },
  questionScore: {
    width: 76,
    color: colors.muted,
    fontSize: 8,
    textAlign: "right",
  },
});
