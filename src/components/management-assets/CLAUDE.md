# `src/components/management-assets` — Biblioteca de ativos de gestão

Antes de editar, releia o **AGENTS.md**, `src/components/CLAUDE.md` e `src/lib/CLAUDE.md`.

## Propósito

Esta pasta implementa as listagens de SOPs, Playbooks, Governança e Matriz RACI publicadas para a empresa do cliente e a leitura individual de SOPs.

## Convenções locais

- As quatro listagens compartilham `ManagementAssetsLibrary` e mantêm o mesmo grid-base de Relatórios.
- Cada card apresenta título, resumo, autoria e data de atualização.
- SOPs, Playbooks e Governança exibem categoria e permitem filtrar por área; Matriz RACI não usa categoria nesta primeira versão.
- Cards de SOP apontam para a leitura individual em `/ativos-de-gestao/sops/[id]`; cards dos demais tipos permanecem estáticos enquanto não houver rota própria.
- A busca e o filtro são client-side sobre dados recebidos da página server-side.
- `SopDocumentView` renderiza conteúdo contínuo com sumário por âncoras e blocos tipados (`paragraph`, `list` e `table`), sem HTML livre.
- O detalhe do SOP segue o frame `191:3421`: índice lateral de 220px, 40px de distância até o artigo de 768px, cabeçalho com categoria/data, metadados em três colunas e seções com divisórias sutis.
- Use apenas tokens do sistema e primitives existentes; não introduza cores próprias para categorias.
- O estado vazio inicial é diferente do estado sem resultados causado pelos filtros.
