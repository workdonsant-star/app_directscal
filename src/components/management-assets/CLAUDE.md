# `src/components/management-assets` — Biblioteca de ativos de gestão

Antes de editar, releia o **AGENTS.md**, `src/components/CLAUDE.md` e `src/lib/CLAUDE.md`.

## Propósito

Esta pasta implementa as listagens de SOPs, Playbooks, Governança e Matriz RACI publicadas para a empresa do cliente, a leitura individual dos ativos textuais e o editor de texto usado pela operação Directscal.

## Convenções locais

- As listagens por categoria e os acessos legados por tipo compartilham `ManagementAssetsLibrary` e seguem o frame Figma `217:2` como padrão visual: filtros na topbar, cabeçalho livre no fluxo da página e grid responsivo de cards.
- As categorias são páginas raiz abertas pela sidebar e não exibem breadcrumb; o breadcrumb começa no detalhe de um ativo.
- Cada card apresenta título, resumo, autoria e data de atualização.
- As pastas misturam tipos conforme a categoria cadastrada. Em pastas, `showType` identifica o tipo no card; os acessos legados por tipo mantêm seu filtro.
- Todos os tipos, incluindo Matriz RACI, apontam para leitura individual (`getManagementAssetHref`). A RACI reutiliza a leitura RichText existente, incluindo tabelas.
- A busca e o filtro são client-side sobre dados recebidos da página server-side.
- O filtro de categoria precede a busca na topbar; As pastas mantêm apenas a busca, pois a categoria já está definida.
- `ManagementAssetDocumentView` renderiza a leitura com sumário por âncoras (títulos H2) e `RichTextView`, sem HTML livre.
- `RichTextView` transforma o documento do editor (`RichTextDocument`) em elementos React com tokens do sistema. É server-compatible e também alimenta a prévia do admin.
- `RichTextEditor` (client) usa Tiptap com vocabulário restrito: Título de seção (H2), Subtítulo (H3), parágrafo, negrito, itálico, link (http, https, mailto), listas, destaque e tabela simples sem mescla visual. Listas, destaques e células aceitam só parágrafos e listas; conteúdo colado fora disso é descartado. Não adicione marcas de cor, tamanho ou alinhamento.
- O JSON do editor é validado por `richTextDocumentSchema` no servidor. `tests/unit/fixtures/tiptap-editor-output.json` guarda uma saída real do editor; atualize o fixture se mudar extensões.
- O detalhe do ativo segue o frame `191:3421`: índice lateral de 220px, 40px de distância até o artigo de 768px, cabeçalho com categoria/data, metadados em três colunas e seções com divisórias sutis.
- Use apenas tokens do sistema e primitives existentes; não introduza cores próprias para categorias.
- O estado vazio inicial é diferente do estado sem resultados causado pelos filtros.

`ManagementAssetCategoryPage` resolve categorias principais e adicionais, filtra por categoria normalizada e conserva a autorização cliente. O breadcrumb do leitor volta à pasta da categoria, não à listagem por tipo. `Bibliotecas` não aparece na sidebar.

- Todas as tabelas visíveis usam o padrão das Dimensões de 06/10/2026 via `Table`: cabeçalho neutro de 44px com raio de 5px, padding horizontal de 16px, linhas de pelo menos 55px e divisórias de 0,5px entre linhas, sem borda externa nem fundo no hover. Conteúdo documental pode ampliar a altura; o editor preserva a indicação de células selecionadas.
