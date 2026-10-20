import type { AssetQuestionAnswer } from "@/lib/contracts";
import type { EvalQuestion } from "./asset-agent-questions";
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
// Cada grupo obrigatório verifica um fato do SOP, além de status/fonte. É uma
// triagem determinística: não substitui revisão humana de contradições/omissões.
const facts: Record<string, RegExp[]> = {
 "fin-01": [/(quinto|5[oº°]?) dia util/], "fin-02": [/(primeiro|1[oº°]?) dia util/, /mes seguinte/],
 "fin-03": [/banc|extrato/, /receit/, /despes/, /desvio/], "fin-04": [/pendencia/],
 "fin-05": [/responsavel financeiro|lideranca financeira/], "fin-06": [/justificativa/, /responsavel/],
 "fin-07": [/banc/, /recebiveis/, /pagamento/], "fin-08": [/revis/, /resumo executivo/, /arquiv/],
 "cmp-01": [/nao/, /conversao/, /test/], "cmp-02": [/pendente|indisponivel|sem teste|sem aprovacao|ausencia/],
 "cmp-03": [/briefing/, /oferta/, /orcamento/], "cmp-04": [/objetivo/, /publico/, /oferta/, /meta/],
 "cmp-05": [/data/, /responsavel/, /evidencia/], "cmp-06": [/sim|revis/, /rastreamento|parametros/], "cmp-07": [/nao/, /responsavel/],
 "onb-01": [/customer success/], "onb-02": [/nao|antes/, /acessos/], "onb-03": [/passagem comercial/, /acessos/, /ata/, /plano/],
 "onb-04": [/confirmacao comercial/, /kickoff/], "onb-05": [/escopo/, /expectativas/, /restricoes/, /acordos/],
 "onb-06": [/retom|reinici|reaplic|revis/], "onb-07": [/escopo/, /responsaveis/, /acessos/, /prazos/],
 "pap-01": [/nao/, /aprov/], "pap-02": [/clickup|notion/, /cliente/], "pap-03": [/junior/, /pleno/, /senior/],
 "pap-04": [/gravacao/, /call|conversa|reuniao/], "pap-05": [/lider/], "pap-06": [/nao confirm|pendencia|valid/],
 "pap-07": [/nao/, /explicit|ambigu/], "pap-08": [/duvidas|decisoes|pendencias/],
 "pap-09": [/nao|exclui/, /jornada|presenca/], "pap-10": [/objetivo/, /lider/, /participantes/, /link/],
 "amb-03": [/ajust|corrig|revis|pendencia|nao/, /campanha|aprov/], "amb-04": [/nao|document|defin/],
 "man-03": [/nao/, /orcamento/, /aprov/],
};
export function gradeAssetAnswer(question: EvalQuestion, answer: AssetQuestionAnswer) {
 if (/falha tecnica|indisponivel/.test(normalize(answer.refusalReason ?? ""))) return false;
 const refused = answer.status === "insufficient_evidence" && answer.citations.length === 0;
 if (question.expect.type === "refuse") return refused;
 if (question.expect.type === "answer_or_refuse" && refused) return true;
 const validSource = answer.citations.some(citation => question.expect.type !== "refuse" && question.expect.assets.includes(citation.title));
 return answer.status === "answered" && validSource && (facts[question.id] ?? []).every(pattern => pattern.test(normalize(answer.answer)));
}
