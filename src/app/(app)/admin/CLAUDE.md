# `src/app/(app)/admin` — Superadmin

Antes de editar, releia o **AGENTS.md** da raiz e `src/app/CLAUDE.md`.

## Propósito

Rotas autenticadas da visão de superadministrador. Usam a mesma shell do app (`AppSidebar`, `AppTopbar`, `SidebarInset`), mas a sidebar muda para navegação administrativa quando o pathname começa com `/admin`.

## Rotas

- `/admin` redireciona para `/admin/operacao`.
- `/admin/operacao` concentra indicadores e a fila de entregas.
- `/admin/especialistas` lista e cadastra especialistas internos em estado local.
- `/admin/operacao/criacao-dos-ativos` seleciona a empresa; toda produção, edição, revisão, publicação e auditoria fica em `/admin/empresas/[id]/criacao-dos-ativos` e suas subrotas.
- `/admin/campanhas` lista e configura campanhas de aquisição.
- `/admin/leads` lista leads capturados.
- `/admin/leads/[id]` mostra o detalhe completo de um lead capturado.
- `/admin/empresas` lista empresas agrupadas a partir dos leads.
- `/admin/empresas/[id]` mostra especialista, entregas e acessos da empresa.
- `/admin/entregas/[id]` reúne dados, relatório, action points e publicação.
- `/admin/modulos` permanece como rota legada para o catálogo, fora da navegação principal.

## Convenções

- Usar `AppPage` com o mesmo recuo horizontal de Dimensões (`px-6 lg:px-10`) e conteúdo em largura total, sem `max-width` ou centralização adicional.
- Manter continuidade visual com `/omdx/diagnosticos`: páginas de listagem do admin devem renderizar tabelas livres, sem card/box externo envolvendo a tabela.
- Dados vêm de `/api/admin/acquisition`, montados no servidor a partir do Supabase.
- Campanhas, leads e empresas ficam disponíveis quando `FEATURE_ACQUISITION=true`; com o flag desligado, as rotas retornam `notFound()`.
- Rotas `/admin/*` exigem role `superadmin`; usuários `cliente` devem ser redirecionados para `/omdx`.
- A navegação do `superadmin` não oferece links para a aplicação do cliente. O papel administrativo não pode abrir páginas, downloads ou APIs de Maturidade; toda operação privilegiada permanece em `/admin/*` e `/api/admin/*`.
- Páginas raiz abertas pela sidebar administrativa não exibem breadcrumb. Páginas de detalhe começam pela raiz imediata, como `Leads / Detalhe`, `Empresas / Detalhe` e `Operação / Empresa`.
- A primeira versão de Operação usa mocks tipados e estado local; não deve simular persistência ou ampliar acesso do `superadmin` ao app do cliente.
