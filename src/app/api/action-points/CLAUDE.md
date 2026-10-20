# `/api/action-points`

Execução dos action points publicados. Só o Superadmin da empresa (`cliente`) escreve e escolhe responsáveis; sem sessão responde `401` e outros papéis `403`.

- `PATCH /api/action-points`: atribui, troca ou remove o responsável (`assigneeUserId`; `null` remove) e atualiza etapa, início, prazo, cadência, progresso (0 a 100) e nota. O servidor só aceita ações publicadas do diagnóstico solicitado e autorizado para a sessão (`404` caso contrário). A pessoa é consultada de novo no Slack (`users.info`), então nome e foto não vêm do cliente. A regra de o que gravar e registrar no histórico fica em `planActionPointUpdate` (`src/lib/data/action-point-execution.ts`, pura e testada). A RPC privada save_action_point_update grava estado e histórico na mesma transação; exige dono, publicação na empresa e versão updated_at esperada. Conflito responde 409.
- `GET /api/action-points/slack-users`: pessoas ativas do workspace conectado à empresa (sem bots, desativados nem convidados), em ordem alfabética, sem cache. `409` quando não há Slack conectado e `502` quando o Slack recusa (por exemplo, permissões antigas).
- O token do bot nunca sai do servidor. As tabelas `action_point_assignments` e `action_point_events` só têm acesso de service role e todas as consultas filtram pela empresa.

Conflito permanente da RPC usa PT409 (migração de 20/10/2026), mapeado para HTTP 409. Não lançar 40001 para versão desatualizada: esse código aciona retries do PostgREST 14.

A04: o trigger diferido recusa alterações de responsável que deixem acordos divergentes. O conflito conhecido orienta solicitar transferência à operação DirectScal; nenhuma escrita parcial ou confirmação de sucesso ocorre.
