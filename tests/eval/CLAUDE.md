# `tests/eval` — Avaliação offline do agente de consulta

Roda contra o Supabase e o provedor de IA do ambiente (`.env.local`), fora do `npm run test`.

1. Escolha uma empresa de teste sem dados reais de clientes e defina `ASSET_EVAL_ORGANIZATION_ID`, `ASSET_EVAL_ACTOR_USER_ID` (um `next_auth.users.id` da operação) e `ASSET_EVAL_ALLOW_SEED=true`.
2. `npm run eval:seed` publica os SOPs de modelo nessa empresa pelo mesmo fluxo editorial do admin. Ativos com o mesmo título não são recriados.
3. `npm run eval:agent` roda `asset-agent-questions.ts` (respondíveis, ambíguas, sem resposta e tentativas de manipulação) e falha abaixo de 85% de acerto. Com `ASSET_EVAL_OTHER_ORGANIZATION_ID`, também verifica que outra empresa não recebe trechos da empresa de teste.

Regras:
- A avaliação não grava em `asset_question_audits` (`skipAudit`).
- Cada execução com provedor pago gera custo; com Gemini gratuito, use apenas conteúdo fictício.
- Ao mudar prompt, limiar, provedor ou chunking, rode antes e depois e compare.
