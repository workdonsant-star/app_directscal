# `src/app/(app)/admin` — Superadmin

Antes de editar, releia o **AGENTS.md** da raiz e `src/app/CLAUDE.md`.

## Propósito

Rotas autenticadas da visão de superadministrador. Usam a mesma shell do app (`AppSidebar`, `AppTopbar`, `SidebarInset`), mas a sidebar muda para navegação administrativa quando o pathname começa com `/admin`.

## Rotas

- `/admin` redireciona para `/admin/modulos`.
- `/admin/modulos` lista módulos disponíveis.
- `/admin/campanhas` lista e configura campanhas de aquisição.
- `/admin/leads` lista leads capturados.
- `/admin/leads/[id]` mostra o detalhe completo de um lead capturado.
- `/admin/empresas` lista empresas agrupadas a partir dos leads.

## Convenções

- Manter container `mx-auto w-full max-w-6xl` com padding `px-6 py-8 lg:px-10`.
- Manter continuidade visual com `/omdx/diagnosticos`: páginas de listagem do admin devem renderizar tabelas livres, sem card/box externo envolvendo a tabela.
- Dados vêm de `/api/admin/acquisition`, montados no servidor a partir do Supabase.
- Campanhas, leads e empresas ficam disponíveis quando `FEATURE_ACQUISITION=true`; com o flag desligado, as rotas retornam `notFound()`.
- Rotas `/admin/*` exigem role `superadmin`; usuários `cliente` devem ser redirecionados para `/omdx`.
- Breadcrumbs devem começar por `Admin`.
