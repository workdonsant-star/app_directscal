# `src/app/(app)/ativos-de-gestao/sops` — Rota legada inativa

Antes de editar, releia o **AGENTS.md**, `src/app/CLAUDE.md` e `src/app/(app)/ativos-de-gestao/CLAUDE.md`.

## Propósito

Rota legada da antiga experiência de SOPs. A funcionalidade Ativos de gestão foi removida; esta URL deve redirecionar para `/omdx`.

## Convenções locais

- Não renderizar `SopsWorkspace`, `AppTopbar` ou breadcrumb.
- Não consultar `sops-data-source.ts` nesta rota.
- Manter redirect server-side para `/omdx`.
