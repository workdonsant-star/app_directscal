import type { ReactNode } from "react";
import { Document, G, Image as PdfImage, Line, Page, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";

import type { AdminDeliveryReportDraft } from "@/lib/contracts/admin-operations";
import { buildNativeReportCharts, type NativeReportBarDatum, type NativeReportMatrixRow, type NativeReportMatrixStatus } from "@/lib/data/omdx-native-report-charts";
import { buildReportFindings } from "@/lib/data/report-findings";
import type { DiagnosticReport } from "@/lib/types";
import { reportAsset, reportTypography } from "./report-typography";

const ink = "#0A1821";
const muted = "#4F5358";
const purple = "#B47AFF";
const layerColors = ["#0A5F4F", "#347A6D", "#71A299"];
const score = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const matrixStyles: Record<NativeReportMatrixStatus, { color: string; label: string }> = {
  critical: { color: "#4B217E", label: "Crít." },
  inconsistent: { color: "#7E45AD", label: "Incons." },
  attention: { color: "#C3A3E6", label: "Atenção" },
  consistent: { color: "#EEE4F8", label: "Consist." },
  low: { color: "#E2EEDD", label: "Baixa" },
  medium: { color: "#B9D69E", label: "Média" },
  high: { color: "#648A3D", label: "Alta" },
};

const styles = StyleSheet.create({
  page: { paddingTop: 58, paddingBottom: 70, paddingLeft: 150, paddingRight: 97, fontFamily: "ReportBody", fontSize: 10, lineHeight: 1.6, color: muted, backgroundColor: "#FFFFFF" },
  cover: { height: 841.89, fontFamily: "ReportBody", color: ink, backgroundColor: "#FFFFFF" },
  coverArt: { position: "absolute", top: 0, left: 0, width: 595.28, height: 841.89, opacity: 0.22, objectFit: "cover" },
  logo: { position: "absolute", top: 53, left: 97, width: 109, height: 15.3 },
  coverCopy: { position: "absolute", top: 530, left: 97, right: 97 },
  coverTitle: { ...reportTypography.title, marginBottom: 20, color: ink },
  coverDescription: { fontSize: 12, lineHeight: 1.5, color: muted, marginBottom: 24 },
  company: { fontSize: 14, fontWeight: 700, marginBottom: 6 },
  diagnosticName: { fontSize: 10, lineHeight: 1.5, color: muted },
  h2: { ...reportTypography.h2, color: ink, marginBottom: 14 },
  h3: { ...reportTypography.h3, color: ink, marginTop: 18, marginBottom: 10 },
  paragraph: { marginBottom: 12 },
  header: { position: "absolute", top: 30, left: 150, right: 97, fontSize: 7, color: "#6D7379" },
  footer: { position: "absolute", top: 790, left: 150, right: 97, paddingTop: 7, borderTopWidth: 0.5, borderTopColor: "#C6C6C6", flexDirection: "row", justifyContent: "space-between", fontSize: 6.5, color: "#6D7379" },
  figure: { marginTop: 10, marginBottom: 18 },
  figureNumber: { fontSize: 7, color: "#6D7379", marginBottom: 4 },
  figureTitle: { fontFamily: "ReportHeading", fontWeight: 700, fontSize: 9.75, lineHeight: 1.4, color: ink, marginBottom: 12 },
  source: { fontSize: 6.5, lineHeight: 1.5, color: "#6D7379", marginTop: 8 },
  matrixRow: { flexDirection: "row", marginBottom: 3, alignItems: "center" },
  matrixLabel: { width: 78, fontSize: 7.2, paddingRight: 6 },
  matrixCell: { flex: 1, minHeight: 24, marginRight: 3, justifyContent: "center", alignItems: "center", padding: 2 },
  matrixText: { fontSize: 6.3, lineHeight: 1.2 },
  tableHeading: { flex: 1, fontSize: 6.5, textAlign: "center", marginRight: 3 },
  note: { fontSize: 8, lineHeight: 1.5, color: "#6D7379", marginBottom: 12 },
});

function Paragraphs({ text }: { text: string }) {
  return <>{text.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <Text key={index} style={styles.paragraph} orphans={3} widows={3}>{paragraph}</Text>)}</>;
}

function ReportPage({ children, report, section }: { children: ReactNode; report: DiagnosticReport; section: string }) {
  return <Page size="A4" style={styles.page} wrap>
    <Text style={styles.header} fixed>{report.diagnostic.company} · {section}</Text>
    {children}
    <View style={styles.footer} fixed>
      <Text>Diagnóstico de maturidade · Directscal</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber - 1} / ${totalPages - 1}`} />
    </View>
  </Page>;
}

function Figure({ children, number, title, report }: { children: ReactNode; number: number; title: string; report: DiagnosticReport }) {
  return <View style={styles.figure} wrap={false}>
    <Text style={styles.figureNumber}>Gráfico {number}</Text>
    <Text style={styles.figureTitle}>{title}</Text>
    {children}
    <Text style={styles.source}>Fonte: {report.diagnostic.name} · {report.diagnostic.company}</Text>
  </View>;
}

function BarChart({ data, layers = false }: { data: NativeReportBarDatum[]; layers?: boolean }) {
  const plotWidth = 316;
  const step = plotWidth / data.length;
  const reference = data.find(datum => datum.referenceValue !== undefined)?.referenceValue;
  return <Svg width="348" height="185" viewBox="0 0 348 185">
    {[0, 1, 2, 3, 4, 5].map(value => <G key={value}>
      <Line x1={24} x2={340} y1={145 - value * 25} y2={145 - value * 25} stroke="#D9DADD" strokeWidth={0.5} />
      <Text x={13} y={148 - value * 25} style={{ fontFamily: "ReportBody", fontSize: 7, fill: muted }}>{value}</Text>
    </G>)}
    {data.map((datum, index) => {
      const x = 24 + step * index + step / 2;
      const height = datum.value === null ? 0 : datum.value * 25;
      return <G key={datum.label}>
        {datum.value !== null && <Rect x={x - Math.min(step * 0.27, 18)} y={145 - height} width={Math.min(step * 0.54, 36)} height={height} rx={2} fill={layers ? layerColors[index] : purple} />}
        <Text x={x} y={datum.value === null ? 135 : 139 - height} textAnchor="middle" style={{ fontFamily: "ReportBody", fontSize: 8, fill: ink }}>{datum.value === null ? "Sem base" : score(datum.value)}</Text>
        <Text x={x} y={159} textAnchor="middle" style={{ fontFamily: "ReportBody", fontSize: 6.8, fill: muted }}>{datum.label}</Text>
      </G>;
    })}
    {reference !== undefined && <Line x1={24} x2={340} y1={145 - reference * 25} y2={145 - reference * 25} stroke={ink} strokeWidth={0.8} strokeDasharray="3 3" />}
    <Text x={24} y={180} style={{ fontFamily: "ReportBody", fontSize: 6.5, fill: muted }}>{reference === undefined ? "Nota da pesquisa · escala de 1 a 5" : `Linha tracejada: mínimo recomendado ${score(reference)} / 5`}</Text>
  </Svg>;
}

function Matrix({ rows }: { rows: NativeReportMatrixRow[] }) {
  const columns = Array.from({ length: Math.max(0, ...rows.map(row => row.cells.length)) }, (_, index) => rows.find(row => row.cells[index])?.cells[index].label ?? "");
  return <View>
    <View style={styles.matrixRow}><Text style={styles.matrixLabel} />{columns.map(column => <Text key={column} style={styles.tableHeading}>{column}</Text>)}</View>
    {rows.map(row => <View key={row.label} style={styles.matrixRow}>
      <Text style={styles.matrixLabel}>{row.label}</Text>
      {columns.map((column, index) => {
        const cell = row.cells[index];
        const value = cell ? matrixStyles[cell.status] : null;
        return <View key={column} style={[styles.matrixCell, { backgroundColor: value?.color ?? "#F2F2F2" }]}>
          <Text style={[styles.matrixText, { color: cell && ["critical", "inconsistent", "high"].includes(cell.status) ? "#FFFFFF" : ink }]}>{value?.label ?? "—"}</Text>
        </View>;
      })}
    </View>)}
  </View>;
}

export function OmdxEditorialReportDocument({ report, editorial, example = false }: { report: DiagnosticReport; editorial: AdminDeliveryReportDraft; example?: boolean }) {
  const charts = buildNativeReportCharts(report);
  const findings = buildReportFindings(report);
  const company = report.diagnostic.company;
  return <Document title={`Relatório de diagnóstico · ${company}`} author="Directscal" subject={report.diagnostic.name} language="pt-BR">
    <Page size="A4" style={styles.cover} wrap={false}>
      <View style={{ height: 841.89 }} />
      <PdfImage src={reportAsset("report-cover.png")} style={styles.coverArt} />
      <PdfImage src={reportAsset("directscal-logo.png")} style={styles.logo} />
      <View style={styles.coverCopy}>
        <Text style={styles.coverTitle}>Diagnóstico de{"\n"}maturidade de gestão</Text>
        <Text style={styles.coverDescription}>Análise da estrutura de gestão, das principais vulnerabilidades da operação e dos mecanismos necessários para sustentar o crescimento da empresa.</Text>
        <Text style={styles.company}>{company}</Text>
        <Text style={styles.diagnosticName}>{report.diagnostic.name}</Text>
        {example && <Text style={styles.note}>Exemplo · Empresa fictícia</Text>}
      </View>
    </Page>
    <ReportPage report={report} section="Leitura da operação">
      <Text style={styles.h2} minPresenceAhead={45}>Antes de tudo, entenda como este diagnóstico foi feito</Text>
      <Paragraphs text={`A pesquisa reúne percepções de Fundador, Liderança e Operação sobre seis dimensões de gestão, em escala de 1 a 5. A leitura a seguir reúne os resultados da coleta e a análise editorial publicada para ${company}.`} />
      <Text style={styles.note}>{report.responses.fundador} fundador · {report.responses.lideranca} liderança · {report.responses.operacao} operação</Text>
      <Text style={styles.h3} minPresenceAhead={45}>O diagnóstico da sua operação</Text>
      <Paragraphs text={editorial.executiveSummary} />
      <Paragraphs text={editorial.generalReading} />
    </ReportPage>
    <ReportPage report={report} section="Pontuação de maturidade">
      <Text style={styles.h2} minPresenceAhead={45}>Pontuação de maturidade</Text>
      <Paragraphs text="A comparação entre camadas mostra como os participantes percebem a gestão. As dimensões permitem localizar as diferenças dentro da mesma coleta." />
      <Figure report={report} number={1} title="Maturidade percebida por camada da estrutura">
        <BarChart data={charts.layerScores} layers />
      </Figure>
      <Figure report={report} number={2} title="Pontuação nas seis dimensões pesquisadas">
        <BarChart data={charts.dimensionScores} />
      </Figure>
    </ReportPage>
    <ReportPage report={report} section="Pontuação geral e bloqueadores">
      <Text style={styles.h2} minPresenceAhead={45}>Pontuação geral e bloqueadores</Text>
      <Paragraphs text={findings.distribution} />
      <Figure report={report} number={3} title="Pontuação geral, mínimo recomendado e ideal do modelo">
        <BarChart data={charts.benchmarkScores} />
      </Figure>
      <Text style={styles.h3} minPresenceAhead={45}>Os pontos que exigem atenção</Text>
      <Paragraphs text={editorial.vulnerabilities} />
    </ReportPage>
    <ReportPage report={report} section="Anatomia dos desafios">
      <Text style={styles.h2} minPresenceAhead={45}>Anatomia dos desafios</Text>
      <Figure report={report} number={4} title="Pontuação por dimensão e distância até o mínimo recomendado">
        <BarChart data={charts.anatomyScores} />
      </Figure>
      <Text style={styles.h3} minPresenceAhead={45}>Núcleo dos principais desafios</Text>
      <Figure report={report} number={5} title="Distribuição das vulnerabilidades por pergunta">
        <Matrix rows={charts.vulnerabilityRows} />
        <Text style={styles.source}>P1, P2… seguem a ordem das perguntas em cada dimensão no documento de dados. Crít.: crítico · Incons.: inconsistente · Consist.: consistente.</Text>
      </Figure>
    </ReportPage>
    <ReportPage report={report} section="Causas e alavancas">
      <Text style={styles.h2} minPresenceAhead={45}>Causa raiz e alavancas de melhoria</Text>
      <Paragraphs text={editorial.structuralCauses} />
      <Figure report={report} number={6} title="Matriz de alavancas">
        <Matrix rows={charts.leverageRows} />
      </Figure>
      <Text style={styles.note}>A matriz organiza as prioridades do modelo. Relações causais e impacto dependem da análise do especialista e de evidências adicionais.</Text>
    </ReportPage>
    <ReportPage report={report} section="Implementações e conclusão">
      <Text style={styles.h2} minPresenceAhead={45}>Linha do tempo de implementações</Text>
      <Paragraphs text={editorial.recommendations} />
      <Text style={styles.note}>As ações e os prazos aprovados estão disponíveis em Action Points desta coleta.</Text>
      <Text style={styles.h3} minPresenceAhead={45}>A estrutura necessária para o próximo estágio</Text>
      <Paragraphs text={editorial.conclusion} />
      <Text style={styles.source}>Emitido em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(report.generatedAt))} · Directscal</Text>
    </ReportPage>
  </Document>;
}
