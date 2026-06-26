# `src/app/(app)/ativos-de-gestao` — Rotas legadas inativas

Antes de editar, releia o **AGENTS.md**, `src/app/CLAUDE.md`, `src/components/CLAUDE.md` e `src/lib/CLAUDE.md`.

## Propósito

Rotas legadas da antiga funcionalidade Ativos de gestão. O módulo foi removido da navegação e do catálogo de módulos; as URLs remanescentes existem apenas para redirecionar usuários para `/omdx`.

## Convenções locais

- `/ativos-de-gestao`, `/ativos-de-gestao/sops` e `/ativos-de-gestao/matriz-de-papeis` devem redirecionar para `/omdx`.
- Não usar `module_management_assets` para gating novo.
- Não reintroduzir SOPs, matriz de papéis ou um novo subitem nesta pasta sem decisão explícita.
