# `src/app/(app)/ativos-de-gestao/matriz-de-papeis` — Rota legada inativa

Antes de editar, releia o **AGENTS.md**, `src/app/CLAUDE.md` e `src/app/(app)/ativos-de-gestao/CLAUDE.md`.

## Propósito

Rota legada da antiga matriz de papéis em Ativos de gestão. A funcionalidade foi removida; esta URL deve redirecionar para `/omdx`.

## Convenções locais

- Não renderizar `RoleMatrixWorkspace`, `AppTopbar` ou breadcrumb.
- Não usar `module_management_assets` para gating.
- Manter redirect server-side para `/omdx`.
