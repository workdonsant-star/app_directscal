# `/action-points` — Action Points

## Propósito

Painel de acompanhamento da execução dos action points que o gestor Directscal selecionou e publicou na entrega do cliente (`/admin/entregas/[id]/action-points`). Cada ação tem uma pessoa responsável (usuário do Slack da empresa), uma etapa e um prazo. Aparece na sidebar como `Action Points`. `/gantt` é só um redirecionamento legado. Não é uma agenda: o prazo é uma coluna da lista.

A direção do produto é que a execução seja conduzida pelo agente no Slack (notificar o responsável, tirar dúvidas, acompanhar o andamento em cadência). Esta página é o painel de quem acompanha; o agente ativo ainda não existe (ver `docs/experiencia-agentica-projetos-e-action-points.md`, seção 18).

## Convenções locais

- A rota pertence à aplicação do cliente e redireciona `superadmin` para `/admin/operacao`.
- Fonte das ações: `getPublishedActionPointsWorkspace()` (`src/lib/data/published-action-points.ts`), com a entrega publicada mais recente dos diagnósticos que a sessão pode ver. Sem entrega publicada com ações selecionadas, a página mostra o estado vazio; não há fallback automático nem dados de demonstração.
- Estado de execução (responsável, etapa, início, prazo, cadência e histórico): `getActionPointExecution()` (`action-point-execution-data-source.ts`), sempre filtrado pela empresa da entrega.
- Edição: somente o Superadmin da empresa (`cliente`), via `PATCH /api/action-points`. O papel `admin` da empresa vê a página, sem o formulário.
- Responsável: escolhido numa lista ao vivo das pessoas do Slack (`GET /api/action-points/slack-users`). Só a referência do Slack e um registro de nome e foto são gravados. Sem Slack conectado, ou com instalação anterior às permissões `users:read` e `im:write`, o painel orienta a conectar ou reconectar em `/configuracoes`.
- A página calcula o status do Slack no servidor (`desconectado`, `reconectar`, `conectado`) e a data de hoje no servidor, para não divergir na hidratação.
- Estrutura: `AppTopbar` (título `Action Points`, sem breadcrumb) e `AppPage` com largura total. Sem `Card` em volta da tabela.
- Lista, abas, agrupamento e painel de detalhes: `src/components/gantt/CLAUDE.md`.
- A cadência fica gravada, mas ainda não dispara nada. Não prometa acompanhamento ativo na interface antes do agendador e da mensagem privada existirem.
- Mantenha `Action Points` como item independente da sidebar; não promova para módulo próprio sem nova decisão explícita.
