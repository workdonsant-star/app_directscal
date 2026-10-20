import { routineReplyOperationSchema, type ParsedRoutineReply } from "@/lib/contracts/routine-replies";
const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function evidenceLinks(text: string) {
  return [...new Set((text.match(/https:\/\/[^\s<>|]+/g) ?? []).map(raw => {
    let value = raw.replace(/[.,;]+$/, "");
    for (const [open, close] of [["(", ")"], ["[", "]"]]) {
      while (value.endsWith(close) && value.split(close).length > value.split(open).length) value = value.slice(0, -1);
    }
    return value;
  }))];
}
export function parseRoutineReply(raw: string): ParsedRoutineReply {
  const text = raw.trim();
  const decision = text.match(new RegExp(`^(confirmar|cancelar)\\s+(${uuid})$`, "i"));
  if (decision) return { kind: "decisao", decision: decision[1].toLowerCase() as "confirmar" | "cancelar", proposalId: decision[2].toLowerCase() };
  // Perguntas não autorizam alteração, mesmo quando citam palavras de execução.
  if (text.endsWith("?") || /^(como|quando|onde|quem|qual|quais|por que|posso|pode|o que)\b/i.test(normalized(text))) return { kind: "consulta" };
  const references = [...text.matchAll(new RegExp(`\\brotina\\s+(${uuid})`, "gi"))];
  if (references.length > 1) return { kind: "ambigua", message: "Envie um relato por rotina para confirmar cada ciclo separadamente." };
  const referenced = text.match(new RegExp(`^rotina\\s+(${uuid})\\s*[:,-]?\\s+`, "i"));
  const body = referenced ? text.slice(referenced[0].length).trim() : text;
  const plain = normalized(body);
  if (/^(sim|nao|ok|pronto|concluido)[.!\s]*$/.test(plain)) return { kind: "ambigua", message: "Informe o que foi executado, não executado ou bloqueado e a rotina a que se refere. Um sim ou não isolado não altera registros." };
  let operation: unknown;
  if (/^(li\b|leitura confirmada[.!\s]*$)/.test(plain)) operation = { kind: "leitura" };
  else if (/^(estou bloquead[oa]|bloqueado|bloqueada|bloqueio)\b/.test(plain)) {
    const reason = body.replace(/^(estou bloquead[oa]|bloquead[oa]|bloqueio)\s*[:,-]?\s*/i, "");
    if (!reason) return { kind: "ambigua", message: "Explique o bloqueio antes de confirmar o registro." };
    operation = { kind: "bloqueio", reason };
  } else if (/^excecao\b/.test(plain)) {
    const reason = body.replace(/^exce[çc][ãa]o\s*[:,-]?\s*/i, "");
    if (!reason) return { kind: "ambigua", message: "Informe o motivo da exceção. Ela só sai da base após revisão da operação." };
    operation = { kind: "excecao", reason };
  } else if (/^progresso\b/.test(plain)) {
    const match = body.match(/^progresso\s+(\d{1,3})\s*%?\s*[:,-]?\s*(.*)$/i);
    if (!match || !match[2].trim()) return { kind: "ambigua", message: "Informe o progresso de implantação de 0 a 100 e explique a atualização. Isso não comprova aderência da rotina." };
    operation = { kind: "progresso", value: Number(match[1]), reason: match[2] };
  } else {
    const no = /^(nao (fiz|fizemos|realizei|realizamos|executei|executamos|consegui|conseguimos)|ainda nao|nao feito)\b/.test(plain);
    const yes = /^(feito|fiz|fizemos|realizei|realizamos|executei|executamos|conclui|concluimos|sim,? (fiz|fizemos|realizei|realizamos|executei|executamos))\b/.test(plain);
    if (!no && !yes) return { kind: "consulta" };
    if (yes && /\b(nao fiz|nao fizemos|nao realizei|nao realizamos|nao executei|nao executamos|nao consegui|nao conseguimos)\b/.test(plain)) return { kind: "ambigua", message: "O relato contém execução e não execução. Separe as rotinas ou esclareça o que aconteceu neste ciclo." };
    const urls = evidenceLinks(body);
    operation = { kind: "execucao", performed: yes, evidence: urls, description: body };
  }
  const parsed = routineReplyOperationSchema.safeParse(operation);
  if (!parsed.success) return { kind: "ambigua", message: "Revise o relato, o valor e as referências antes de confirmar. Use até 2.000 caracteres e links HTTPS." };
  return { kind: "proposta", cycleId: references[0]?.[1].toLowerCase() ?? null, operation: parsed.data };
}
