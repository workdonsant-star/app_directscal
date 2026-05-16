import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type {
  DiagnosticReport,
  DiagnosticReportDimension,
  DiagnosticReportQuestion,
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

const questionRowsPerPage = 7;

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

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function chunkQuestions(questions: DiagnosticReportQuestion[]) {
  const chunks: DiagnosticReportQuestion[][] = [];

  for (let i = 0; i < questions.length; i += questionRowsPerPage) {
    chunks.push(questions.slice(i, i + questionRowsPerPage));
  }

  return chunks;
}

function reportFileSource(report: DiagnosticReport) {
  return `${report.diagnostic.name} / ${report.diagnostic.company}`;
}

function getScoreColor(score: number) {
  return score < 3 ? colors.negative : colors.brand;
}

function ReportFooter({ report }: { report: DiagnosticReport }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>Fonte: {reportFileSource(report)}</Text>
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
  report,
  section,
}: {
  report: DiagnosticReport;
  section: string;
}) {
  return (
    <View style={styles.header} fixed>
      <View>
        <Text style={styles.headerKicker}>OMDx</Text>
        <Text style={styles.headerTitle}>{section}</Text>
      </View>
      <View style={styles.headerMeta}>
        <Text>{report.diagnostic.company}</Text>
        <Text>Gerado em {formatDate(report.generatedAt)}</Text>
      </View>
    </View>
  );
}

function ScoreBubble({
  score,
  size = 42,
}: {
  score: number;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.scoreBubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getScoreColor(score),
        },
      ]}
    >
      <Text style={styles.scoreBubbleText}>{formatScore(score)}</Text>
    </View>
  );
}

function Metric({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricCaption}>{caption}</Text>
    </View>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
          {
            width: (score / 5) * 120,
            backgroundColor: getScoreColor(score),
          },
        ]}
      />
    </View>
  );
}

function LayerScoreRows({
  scores,
}: {
  scores: Record<RespondentGroup, number>;
}) {
  return (
    <View style={styles.layerRows}>
      {(["fundador", "lideranca", "operacao"] as RespondentGroup[]).map(
        (group) => (
          <View key={group} style={styles.layerRow}>
            <Text style={styles.layerName}>{groupLabels[group]}</Text>
            <ScoreBar score={scores[group]} />
            <Text style={styles.layerScore}>{formatScore(scores[group])}</Text>
          </View>
        ),
      )}
    </View>
  );
}

function ExecutiveReading({ report }: { report: DiagnosticReport }) {
  return (
    <View style={styles.readingBox}>
      <Text style={styles.readingLabel}>Leitura executiva</Text>
      <Text style={styles.readingText}>
        {report.diagnostic.company} apresenta score geral de{" "}
        {formatScore(report.generalScore)}, classificado como{" "}
        {report.classification}. O principal gargalo está em{" "}
        {report.weakestDimension.shortName}, enquanto o maior desalinhamento de
        percepção aparece em {report.highestMisalignment.dimensionName}.
      </Text>
      <Text style={styles.readingText}>
        A recomendação inicial é priorizar a dimensão mais frágil antes de
        ampliar cadência, cobrança ou alavancas de escala.
      </Text>
    </View>
  );
}

function CoverPage({ report }: { report: DiagnosticReport }) {
  return (
    <Page size="A4" orientation="landscape" style={styles.coverPage}>
      <View style={styles.coverTop}>
        <Text style={styles.brand}>Directscal</Text>
        <Text style={styles.coverDate}>Gerado em {formatDate(report.generatedAt)}</Text>
      </View>

      <View style={styles.coverMain}>
        <Text style={styles.coverKicker}>Relatório de diagnóstico</Text>
        <Text style={styles.coverTitle}>OMDx</Text>
        <Text style={styles.coverSubtitle}>
          Diagnóstico de Maturidade Operacional
        </Text>
        <Text style={styles.coverCompany}>{report.diagnostic.company}</Text>
      </View>
      <ExecutiveReading report={report} />

      <View style={styles.coverGrid}>
        <View style={styles.coverScore}>
          <Text style={styles.metricLabel}>Score geral</Text>
          <Text style={styles.coverScoreValue}>{formatScore(report.generalScore)}</Text>
          <Text style={styles.metricCaption}>{report.classification}</Text>
        </View>
        <Metric
          label="Respostas"
          value={report.responses.total.toLocaleString("pt-BR")}
          caption="Base consolidada"
        />
        <Metric
          label="Maior gargalo"
          value={formatScore(report.weakestDimension.score)}
          caption={report.weakestDimension.shortName}
        />
        <Metric
          label="Maior desalinhamento"
          value={formatScore(report.highestMisalignment.value)}
          caption={report.highestMisalignment.dimensionName}
        />
      </View>

      <ReportFooter report={report} />
    </Page>
  );
}

function OverviewPage({ report }: { report: DiagnosticReport }) {
  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <ReportHeader report={report} section="Visão por dimensão" />
      <View style={styles.pageContent}>
        <View style={styles.tableHeader}>
          <Text style={[styles.colDimension, styles.tableHeaderText]}>
            Dimensão
          </Text>
          <Text style={[styles.colScore, styles.tableHeaderText]}>Score</Text>
          <Text style={[styles.colClass, styles.tableHeaderText]}>
            Classificação
          </Text>
          <Text style={[styles.colSmall, styles.tableHeaderText]}>
            Variância
          </Text>
          <Text style={[styles.colSmall, styles.tableHeaderText]}>
            Respostas
          </Text>
          <Text style={[styles.colGap, styles.tableHeaderText]}>
            Maior gap
          </Text>
        </View>

        {report.dimensions.map((dimension) => (
          <View key={dimension.id} style={styles.tableRow}>
            <View style={styles.colDimension}>
              <Text style={styles.dimensionName}>
                {dimension.number}. {dimension.name}
              </Text>
              <Text style={styles.dimensionDescription}>
                {dimension.description}
              </Text>
            </View>
            <View style={styles.colScore}>
              <ScoreBubble score={dimension.score} />
            </View>
            <Text style={[styles.colClass, styles.cellText]}>
              {dimension.classification}
            </Text>
            <Text style={[styles.colSmall, styles.cellText]}>
              {formatNumber(dimension.variance)}
            </Text>
            <Text style={[styles.colSmall, styles.cellText]}>
              {dimension.responses.toLocaleString("pt-BR")}
            </Text>
            <Text style={[styles.colGap, styles.cellText]}>
              {formatScore(dimension.misalignment.value)} entre{" "}
              {groupLabels[dimension.misalignment.highestGroup]} e{" "}
              {groupLabels[dimension.misalignment.lowestGroup]}
            </Text>
          </View>
        ))}
      </View>
      <ReportFooter report={report} />
    </Page>
  );
}

function MatrixPage({ report }: { report: DiagnosticReport }) {
  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <ReportHeader report={report} section="Percepção por camada" />
      <View style={styles.pageContent}>
        <View style={styles.matrixIntro}>
          <View>
            <Text style={styles.sectionTitle}>Matriz de alinhamento</Text>
            <Text style={styles.sectionDescription}>
              Comparação entre fundador, liderança e operação em cada dimensão.
            </Text>
          </View>
          <View style={styles.layerAverageBox}>
            <Text style={styles.metricLabel}>Média por camada</Text>
            <Text style={styles.layerAverageText}>
              Fundador {formatScore(report.layerAverages.fundador)} / Liderança{" "}
              {formatScore(report.layerAverages.lideranca)} / Operação{" "}
              {formatScore(report.layerAverages.operacao)}
            </Text>
          </View>
        </View>

        <View style={styles.matrixHeader}>
          <Text style={[styles.matrixDimensionCol, styles.tableHeaderText]}>
            Dimensão
          </Text>
          <Text style={[styles.matrixLayerCol, styles.tableHeaderText]}>
            Fundador
          </Text>
          <Text style={[styles.matrixLayerCol, styles.tableHeaderText]}>
            Liderança
          </Text>
          <Text style={[styles.matrixLayerCol, styles.tableHeaderText]}>
            Operação
          </Text>
          <Text style={[styles.matrixGapCol, styles.tableHeaderText]}>Gap</Text>
        </View>

        {report.dimensions.map((dimension) => (
          <View key={dimension.id} style={styles.matrixRow}>
            <Text style={styles.matrixDimensionCol}>
              {dimension.number}. {dimension.shortName}
            </Text>
            {(["fundador", "lideranca", "operacao"] as RespondentGroup[]).map(
              (group) => (
                <View key={group} style={styles.matrixLayerCol}>
                  <ScoreBar score={dimension.layerScores[group]} />
                  <Text style={styles.matrixScore}>
                    {formatScore(dimension.layerScores[group])}
                  </Text>
                </View>
              ),
            )}
            <Text style={styles.matrixGapCol}>
              {formatScore(dimension.misalignment.value)}
            </Text>
          </View>
        ))}
      </View>
      <ReportFooter report={report} />
    </Page>
  );
}

function QuestionTable({ questions }: { questions: DiagnosticReportQuestion[] }) {
  return (
    <View style={styles.questionTable}>
      <View style={styles.questionHeader}>
        <Text style={[styles.questionTextCol, styles.tableHeaderText]}>
          Pergunta
        </Text>
        <Text style={[styles.questionNumberCol, styles.tableHeaderText]}>
          Fund.
        </Text>
        <Text style={[styles.questionNumberCol, styles.tableHeaderText]}>
          Lider.
        </Text>
        <Text style={[styles.questionNumberCol, styles.tableHeaderText]}>
          Oper.
        </Text>
        <Text style={[styles.questionNumberCol, styles.tableHeaderText]}>
          Média
        </Text>
        <Text style={[styles.questionNumberCol, styles.tableHeaderText]}>
          Var.
        </Text>
      </View>

      {questions.map((question) => (
        <View key={question.id} style={styles.questionRow}>
          <Text style={styles.questionTextCol}>{question.text}</Text>
          <Text style={styles.questionNumberCol}>
            {formatScore(question.layerScores.fundador)}
          </Text>
          <Text style={styles.questionNumberCol}>
            {formatScore(question.layerScores.lideranca)}
          </Text>
          <Text style={styles.questionNumberCol}>
            {formatScore(question.layerScores.operacao)}
          </Text>
          <Text style={styles.questionNumberCol}>
            {formatScore(question.score)}
          </Text>
          <Text style={styles.questionNumberCol}>
            {formatNumber(question.variance)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DimensionPage({
  chunkIndex,
  dimension,
  questions,
  report,
  totalChunks,
}: {
  chunkIndex: number;
  dimension: DiagnosticReportDimension;
  questions: DiagnosticReportQuestion[];
  report: DiagnosticReport;
  totalChunks: number;
}) {
  const section =
    totalChunks > 1
      ? `${dimension.shortName} (${chunkIndex + 1}/${totalChunks})`
      : dimension.shortName;

  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <ReportHeader report={report} section={section} />
      <View style={styles.pageContent}>
        <View style={styles.dimensionHero}>
          <View style={styles.dimensionHeroText}>
            <Text style={styles.sectionTitle}>{dimension.name}</Text>
            <Text style={styles.dimensionQuestion}>{dimension.question}</Text>
            <Text style={styles.sectionDescription}>{dimension.description}</Text>
          </View>
          <View style={styles.dimensionScorePanel}>
            <ScoreBubble score={dimension.score} size={54} />
            <Text style={styles.metricCaption}>{dimension.classification}</Text>
          </View>
        </View>

        <View style={styles.dimensionBody}>
          <View style={styles.dimensionLeft}>
            <Text style={styles.subsectionTitle}>Percepção por camada</Text>
            <LayerScoreRows scores={dimension.layerScores} />
            <View style={styles.gapBox}>
              <Text style={styles.metricLabel}>Maior desalinhamento</Text>
              <Text style={styles.gapText}>
                {formatScore(dimension.misalignment.value)} entre{" "}
                {groupLabels[dimension.misalignment.highestGroup]} e{" "}
                {groupLabels[dimension.misalignment.lowestGroup]}
              </Text>
            </View>
          </View>

          <View style={styles.dimensionRight}>
            <Text style={styles.subsectionTitle}>Médias por pergunta</Text>
            <QuestionTable questions={questions} />
          </View>
        </View>
      </View>
      <ReportFooter report={report} />
    </Page>
  );
}

export function OmdxReportDocument({ report }: { report: DiagnosticReport }) {
  return (
    <Document
      title={`Relatório OMDx — ${report.diagnostic.company}`}
      author="Directscal"
      subject="Diagnóstico de Maturidade Operacional"
    >
      <CoverPage report={report} />
      <OverviewPage report={report} />
      <MatrixPage report={report} />
      {report.dimensions.flatMap((dimension) => {
        const questionChunks = chunkQuestions(dimension.questions);

        return questionChunks.map((questions, index) => (
          <DimensionPage
            key={`${dimension.id}-${index}`}
            chunkIndex={index}
            dimension={dimension}
            questions={questions}
            report={report}
            totalChunks={questionChunks.length}
          />
        ));
      })}
    </Document>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    color: colors.foreground,
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingBottom: 44,
    paddingHorizontal: 34,
    paddingTop: 34,
  },
  coverPage: {
    backgroundColor: colors.background,
    color: colors.foreground,
    fontFamily: "Helvetica",
    paddingBottom: 44,
    paddingHorizontal: 42,
    paddingTop: 38,
  },
  coverTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brand: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0,
  },
  coverDate: {
    color: colors.muted,
    fontSize: 9,
  },
  coverMain: {
    marginTop: 92,
    width: 500,
  },
  coverKicker: {
    color: colors.brand,
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  coverTitle: {
    fontSize: 58,
    fontWeight: 700,
    letterSpacing: 0,
    lineHeight: 1,
  },
  coverSubtitle: {
    color: colors.muted,
    fontSize: 17,
    marginTop: 10,
  },
  coverCompany: {
    fontSize: 21,
    fontWeight: 700,
    marginTop: 34,
  },
  coverGrid: {
    bottom: 72,
    flexDirection: "row",
    left: 42,
    position: "absolute",
    right: 42,
  },
  coverScore: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
    padding: 14,
    width: 180,
  },
  coverScoreValue: {
    color: colors.brand,
    fontSize: 34,
    fontWeight: 700,
    marginTop: 12,
  },
  header: {
    alignItems: "flex-start",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 34,
    paddingBottom: 10,
    position: "absolute",
    right: 34,
    top: 24,
  },
  headerKicker: {
    color: colors.brand,
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 700,
  },
  headerMeta: {
    color: colors.muted,
    fontSize: 8,
    lineHeight: 1.4,
    textAlign: "right",
  },
  pageContent: {
    marginTop: 54,
  },
  footer: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 34,
    paddingTop: 8,
    position: "absolute",
    right: 34,
  },
  footerText: {
    color: colors.muted,
    fontSize: 8,
  },
  footerPage: {
    color: colors.muted,
    fontSize: 8,
  },
  metric: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
    padding: 14,
    width: 180,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 21,
    fontWeight: 700,
    marginTop: 12,
  },
  metricCaption: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 1.35,
    marginTop: 6,
  },
  readingBox: {
    borderLeftColor: colors.brand,
    borderLeftWidth: 2,
    marginTop: 18,
    paddingLeft: 12,
    width: 520,
  },
  readingLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  readingText: {
    color: colors.foreground,
    fontSize: 10,
    lineHeight: 1.45,
    marginBottom: 6,
  },
  tableHeader: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingBottom: 8,
  },
  tableHeaderText: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  tableRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 58,
    paddingVertical: 9,
  },
  colDimension: {
    paddingRight: 12,
    width: 260,
  },
  colScore: {
    alignItems: "center",
    width: 72,
  },
  colClass: {
    width: 110,
  },
  colSmall: {
    textAlign: "center",
    width: 70,
  },
  colGap: {
    width: 170,
  },
  dimensionName: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 4,
  },
  dimensionDescription: {
    color: colors.muted,
    fontSize: 8,
    lineHeight: 1.35,
  },
  cellText: {
    color: colors.foreground,
    fontSize: 9,
    lineHeight: 1.35,
  },
  scoreBubble: {
    alignItems: "center",
    justifyContent: "center",
  },
  scoreBubbleText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: 700,
  },
  barTrack: {
    backgroundColor: colors.soft,
    borderRadius: 4,
    height: 6,
    overflow: "hidden",
    width: 120,
  },
  barFill: {
    borderRadius: 4,
    height: 6,
  },
  layerRows: {
    marginTop: 10,
  },
  layerRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 10,
  },
  layerName: {
    fontSize: 9,
    fontWeight: 700,
    width: 72,
  },
  layerScore: {
    fontSize: 9,
    fontWeight: 700,
    marginLeft: 8,
    textAlign: "right",
    width: 28,
  },
  matrixIntro: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 8,
  },
  sectionDescription: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 1.45,
  },
  layerAverageBox: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    width: 260,
  },
  layerAverageText: {
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1.35,
    marginTop: 8,
  },
  matrixHeader: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingBottom: 8,
  },
  matrixRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingVertical: 12,
  },
  matrixDimensionCol: {
    fontSize: 10,
    fontWeight: 700,
    paddingRight: 10,
    width: 190,
  },
  matrixLayerCol: {
    alignItems: "center",
    flexDirection: "row",
    width: 160,
  },
  matrixGapCol: {
    fontSize: 10,
    fontWeight: 700,
    textAlign: "right",
    width: 60,
  },
  matrixScore: {
    fontSize: 9,
    fontWeight: 700,
    marginLeft: 8,
    width: 28,
  },
  dimensionHero: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  dimensionHeroText: {
    width: 560,
  },
  dimensionQuestion: {
    color: colors.foreground,
    fontSize: 11,
    lineHeight: 1.4,
    marginBottom: 6,
  },
  dimensionScorePanel: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    width: 130,
  },
  dimensionBody: {
    flexDirection: "row",
  },
  dimensionLeft: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 18,
    padding: 14,
    width: 250,
  },
  dimensionRight: {
    flex: 1,
  },
  subsectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
  },
  gapBox: {
    backgroundColor: colors.soft,
    borderRadius: 8,
    marginTop: 14,
    padding: 10,
  },
  gapText: {
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1.35,
    marginTop: 8,
  },
  questionTable: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  questionHeader: {
    backgroundColor: colors.soft,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  questionRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  questionTextCol: {
    fontSize: 8.5,
    lineHeight: 1.35,
    paddingRight: 10,
    width: 300,
  },
  questionNumberCol: {
    fontSize: 8.5,
    fontWeight: 700,
    textAlign: "center",
    width: 48,
  },
});
