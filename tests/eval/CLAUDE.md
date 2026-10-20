# `tests/eval` — Avaliação offline do agente de consulta

Roda contra o Supabase e o provedor de IA do ambiente (`.env.local`), fora do `npm run test`.

1. Escolha uma empresa de teste sem dados reais de clientes e defina `ASSET_EVAL_ORGANIZATION_ID`, `ASSET_EVAL_ACTOR_USER_ID` (um `next_auth.users.id` da operação) e `ASSET_EVAL_ALLOW_SEED=true`.
2. `npm run eval:seed` publica os SOPs de modelo nessa empresa pelo mesmo fluxo editorial do admin. Ativos com o mesmo título não são recriados.
3. `npm run eval:agent` roda `asset-agent-questions.ts` (respondíveis, ambíguas, sem resposta e tentativas de manipulação) e falha abaixo de 85% de acerto. Com `ASSET_EVAL_OTHER_ORGANIZATION_ID`, também verifica que outra empresa não recebe trechos da empresa de teste.

Regras:
- A avaliação não grava em `asset_question_audits` (`skipAudit`).
- Cada execução com provedor pago gera custo; com Gemini gratuito, use apenas conteúdo fictício.
- Ao mudar prompt, limiar, provedor ou chunking, rode antes e depois e compare.


A17: avaliação isolada adicional: ASSET_EVAL_ISOLATED=true npx vitest run --config vitest.eval.config.ts tests/eval/isolated-asset-agent.eval.ts. Cria empresas novas, publica somente os quatro SOPs fictícios, executa o mesmo conjunto, verifica isolamento e limpa em finally. IDs não secretos ficam em /tmp/directscal-agent-eval-fixtures.json para recuperação. asset-agent-grader exige fatos essenciais e fontes/status; falha técnica não pontua como recusa. Não representa revisão semântica completa.


A17 v2: conjunto mantém cinquenta perguntas, corrigindo amb-04 para recusa porque coordenação geral não atribui kickoff/ata. Execução isolada salva progresso por pergunta, limita concorrência a duas consultas e permite 45 minutos. Primeira rodada parou em 43/50 pelo limite de vinte minutos; não era aprovação. Fixtures dessa rodada foram removidas e ausência conferida antes da repetição.


A17: asset-agent-roles.eval.ts usa fontes controladas dos SOPs fictícios e provedor real, sem testar busca/banco. v2 completo obteve 43/50 (86%), com quatro falhas de provedor e três itens sinalizados. A checagem pontual expôs status respondido apesar de ausência de responsável; corrigido no resolver. v3 repete cinquenta casos e corrige falso negativo lexical pap-09, sem mudar a resposta esperada. Preservar ambos os relatórios e não atribuir toda diferença ao prompt.


Reprocessamento sem provedor: ASSET_EVAL_REPLAY=true npx vitest run --config vitest.eval.config.ts tests/eval/asset-agent-replay.eval.ts. Usa bruto v3 preservado, aplica somente regra pura de recusa e confirma que só amb-04 mudou. Rodada real v3=43/50; replay=44/50, sem nova chamada de modelo/DB. Manifestos registram fontes antes/depois.
