import { adherenceCycleSchema, type AdherenceCycle, type AdherenceFact } from "@/lib/contracts/asset-adherence";

export type AdherenceCounts = {
  expected: number; eligible: number; excluded: number; upcoming: number;
  read: number; reported: number; validated: number; results: number;
  missingReport: number; awaitingValidation: number;
  reportedPercent: number | null; validatedPercent: number | null;
};

function emptyCounts(): AdherenceCounts {
  return { expected: 0, eligible: 0, excluded: 0, upcoming: 0, read: 0, reported: 0, validated: 0, results: 0, missingReport: 0, awaitingValidation: 0, reportedPercent: null, validatedPercent: null };
}

function last(facts: AdherenceFact[], kind: AdherenceFact["payload"]["kind"]) {
  return facts.findLast(fact => fact.payload.kind === kind);
}

export function getAdherenceCycleState(cycle: AdherenceCycle, at: Date) {
  const facts = cycle.facts.filter(fact => Date.parse(fact.recordedAt) <= at.getTime()).sort((a, b) => a.sequence - b.sequence);
  const execution = last(facts, "execucao_relatada");
  const validation = last(facts, "evidencia_revisada");
  const exceptionRequest = last(facts, "excecao_solicitada");
  const exceptionReview = last(facts, "excecao_revisada");
  const reported = execution?.payload.kind === "execucao_relatada" && execution.payload.performed;
  const validated = Boolean(reported && execution?.payload.kind === "execucao_relatada" && execution.payload.evidence.length > 0 && validation?.payload.kind === "evidencia_revisada" && validation.payload.executionId === execution.id && validation.sequence > execution.sequence && validation.payload.accepted);
  const excluded = Boolean(exceptionRequest && exceptionReview?.payload.kind === "excecao_revisada" && exceptionReview.payload.requestId === exceptionRequest.id && exceptionReview.sequence > exceptionRequest.sequence && exceptionReview.payload.accepted);
  return {
    read: facts.some(fact => fact.payload.kind === "leitura_confirmada"),
    reported: Boolean(reported), validated, excluded,
    hasResult: facts.some(fact => fact.payload.kind === "resultado_registrado"),
  };
}

function add(counts: AdherenceCounts, cycle: AdherenceCycle, at: Date) {
  if (Date.parse(cycle.dueAt) > at.getTime()) { counts.upcoming++; return; }
  counts.expected++;
  const state = getAdherenceCycleState(cycle, at);
  if (state.excluded) { counts.excluded++; return; }
  counts.eligible++;
  if (state.read) counts.read++;
  if (state.reported) counts.reported++; else counts.missingReport++;
  if (state.validated) counts.validated++;
  if (state.reported && !state.validated) counts.awaitingValidation++;
  if (state.hasResult) counts.results++;
  counts.reportedPercent = 100 * counts.reported / counts.eligible;
  counts.validatedPercent = 100 * counts.validated / counts.eligible;
}

/** Janela de prazos [from, to). Um ciclo real por oportunidade; nenhum calendário inferido. */
export function aggregateAssetAdherence(cycles: AdherenceCycle[], { organizationId, from, to, at }: { organizationId: string; from: Date; to: Date; at: Date }) {
  if (![from, to, at].every(date => Number.isFinite(date.getTime())) || from >= to) throw new Error("Período de aderência inválido.");
  const total = emptyCounts();
  const people = new Map<string, AdherenceCounts>();
  const assets = new Map<string, AdherenceCounts>();
  const sectors = new Map<string, AdherenceCounts>();
  const seen = new Map<string, string>();
  for (const rawCycle of cycles) {
    const cycle = adherenceCycleSchema.parse(rawCycle);
    if (cycle.rule.organizationId !== organizationId) continue;
    const due = Date.parse(cycle.dueAt);
    if (due < from.getTime() || due >= to.getTime()) continue;
    const serialized = JSON.stringify(cycle);
    const opportunity = JSON.stringify([cycle.rule.routineId, cycle.opportunityKey]);
    if (seen.has(opportunity)) {
      if (seen.get(opportunity) !== serialized) throw new Error("Ciclo duplicado com dados divergentes.");
      continue;
    }
    seen.set(opportunity, serialized);
    add(total, cycle, at);
    for (const [group, key] of [[people, JSON.stringify([cycle.rule.assignee.teamId, cycle.rule.assignee.userId])], [assets, cycle.rule.assetId], [sectors, cycle.rule.sectorId]] as const) {
      const counts = group.get(key) ?? emptyCounts();
      add(counts, cycle, at); group.set(key, counts);
    }
  }
  return { total, people: Object.fromEntries(people), assets: Object.fromEntries(assets), sectors: Object.fromEntries(sectors) };
}
