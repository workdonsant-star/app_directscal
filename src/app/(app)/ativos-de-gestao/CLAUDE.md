# `src/app/(app)/ativos-de-gestao` — Bibliotecas de ativos

Antes de editar, releia o **AGENTS.md**, `src/app/CLAUDE.md`, `src/components/CLAUDE.md` e `src/lib/CLAUDE.md`.

## Propósito

Rotas autenticadas das bibliotecas de SOPs, Playbooks, Governança e Matriz RACI publicadas para a empresa do cliente.

## Convenções locais

- `/ativos-de-gestao` mostra pastas por categoria com a contagem de ativos publicados.
- As quatro bibliotecas usam `ManagementAssetsPage` e recebem dados de `management-assets-data-source.ts`.
- SOPs, Playbooks, Governança e Matriz RACI possuem leitura individual em `/ativos-de-gestao/<tipo>/[id]`, todas via `ManagementAssetReaderPage`. Matriz RACI usa o documento RichText publicado, incluindo tabelas.
- Todos os tipos são agrupados pela categoria cadastrada. Ativos sem classificação aparecem em Sem categoria.
- `/ativos-de-gestao/matriz-de-papeis` é legado e redireciona para `/ativos-de-gestao/matriz-raci`.
- Não usar `module_management_assets` para gating novo nesta fase.
- Os dados vêm do Supabase: somente a versão publicada vigente de ativos não arquivados das organizações da sessão. O cliente não edita ativos.

A seção Ativos de gestão é a navegação única para os ativos, com quatro categorias principais e outras categorias que existam nos dados publicados. As rotas por tipo continuam para compatibilidade e leitura; não aparecem na sidebar. Categorias adicionais usam `/categorias/[categoria]`.
