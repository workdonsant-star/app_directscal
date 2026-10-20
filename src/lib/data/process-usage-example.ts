import {
  buildProcessUsageAnalytics,
  type ProcessUsageAuditInput,
  type ProcessUsageFeedbackInput,
} from "@/lib/data/process-usage-analytics";

const DAY_MS = 86_400_000;
const processes = [
  { assetId: "example-ads", title: "SOP - Produção Ads", assetType: "sop" },
  { assetId: "example-flow", title: "SOP - Fluxo operacional", assetType: "sop" },
  { assetId: "example-onboarding", title: "Playbook - Onboarding de clientes", assetType: "playbook" },
  { assetId: "example-contingency", title: "SOP - Gestão de contingência", assetType: "sop" },
  { assetId: "example-leadership", title: "Governança - Rotina de liderança", assetType: "governanca" },
  { assetId: "example-support", title: "Playbook - Atendimento ao cliente", assetType: "playbook" },
] satisfies ProcessUsageAuditInput["citations"];

// Exclusive to the explicit screenshot view; never persisted as agent activity.
export function buildProcessUsageExample(now = new Date()) {
  const audits: ProcessUsageAuditInput[] = [];
  const feedback: ProcessUsageFeedbackInput[] = [];
  const weeklyCounts = [[12, 3], [7, 1], [15, 4], [10, 2], [17, 4], [8, 1], [19, 5], [12, 2]];
  let answeredIndex = 0;

  weeklyCounts.forEach(([answered, gaps], week) => {
    for (let index = 0; index < answered + gaps; index += 1) {
      const isAnswered = index < answered;
      const id = `usage-example-${week}-${index}`;
      const position = answeredIndex % 56;
      const processIndex = [16, 28, 38, 46, 52, 56].findIndex((end) => position < end);
      const citation = processes[processIndex];
      audits.push({
        id,
        createdAt: new Date(now.getTime() - ((8 - week) * 7 - 3) * DAY_MS).toISOString(),
        status: isAnswered ? "respondida" : "insuficiente",
        askerKey: `example-person-${index % 18}`,
        citations: isAnswered ? [citation] : [],
      });
      if (isAnswered) {
        feedback.push({ auditId: id, value: answeredIndex % 7 === 0 ? "nao_util" : "util" });
        answeredIndex += 1;
      }
    }
  });

  const analytics = buildProcessUsageAnalytics({ audits, feedback, teamSize: 24, now });
  // Illustrative documents are not real published assets and have no reader URL.
  return { ...analytics, processes: analytics.processes.map((process) => ({ ...process, href: null })) };
}
