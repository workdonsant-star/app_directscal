# `src/app/(app)/ativos-de-gestao` — Bibliotecas de ativos

Antes de editar, releia o **AGENTS.md**, `src/app/CLAUDE.md`, `src/components/CLAUDE.md` e `src/lib/CLAUDE.md`.

## Propósito

Rotas autenticadas das bibliotecas de SOPs, Playbooks, Governança e Matriz RACI publicadas para a empresa do cliente.

## Convenções locais

- `/ativos-de-gestao` redireciona para `/ativos-de-gestao/sops`.
- As quatro bibliotecas usam `ManagementAssetsPage` e recebem dados de `management-assets-data-source.ts`.
- SOPs, Playbooks e Governança possuem leitura individual em `/ativos-de-gestao/<tipo>/[id]`, todas via `ManagementAssetReaderPage`. Matriz RACI continua somente como biblioteca até ganhar componente tabular.
- SOPs, Playbooks e Governança usam categorias. Matriz RACI não usa categoria nesta primeira versão.
- `/ativos-de-gestao/matriz-de-papeis` é legado e redireciona para `/ativos-de-gestao/matriz-raci`.
- Não usar `module_management_assets` para gating novo nesta fase.
- Os dados vêm do Supabase: somente a versão publicada vigente de ativos não arquivados das organizações da sessão. O cliente não edita ativos.
