# `/api/action-points`

Execução dos action points publicados. Só o Superadmin da empresa (`cliente`) escreve e escolhe responsáveis; sem sessão responde `401` e outros papéis `403`.

- `PATCH /api/action-points`: atribui, troca ou remove o responsável (`assigneeUserId`; `null` remove) e atualiza etapa, início, prazo, cadência, progresso (0 a 100) e nota. O servidor só aceita ações da entrega publicada mais recente dos diagnósticos que a sessão enxerga (`404` caso contrário). A pessoa é consultada de novo no Slack (`users.info`), então nome e foto não vêm do cliente. A regra de o que gravar e registrar no histórico fica em `planActionPointUpdate` (`src/lib/data/action-point-execution.ts`, pura e testada). A gravação do estado e a do histórico são duas chamadas, não uma transação.
- `GET /api/action-points/slack-users`: pessoas ativas do workspace conectado à empresa (sem bots, desativados nem convidados), em ordem alfabética, sem cache. `409` quando não há Slack conectado e `502` quando o Slack recusa (por exemplo, permissões antigas).
- O token do bot nunca sai do servidor. As tabelas `action_point_assignments` e `action_point_events` só têm acesso de service role e todas as consultas filtram pela empresa.
