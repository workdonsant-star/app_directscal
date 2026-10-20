# Atualização de ativos pelo cliente

PATCH /api/management-assets/[id] exige sessão definitiva com papel cliente. O payload estrito contém título, resumo, documento Tiptap e ID da versão base; nunca empresa ou ator. A RPC privada revalida membership de dono na empresa do ativo, bloqueia versões desatualizadas, arquivados e rascunhos editoriais. Criação da versão, publicação e índice textual são atômicos; histórico publicado é preservado. Admin convidado e superadmin global não usam esta API. Erros internos não são expostos.

PATCH /api/management-assets/bulk oferece alteração atômica de tipo/categoria de 1–1.000 ativos publicados da empresa do dono. Payload não escolhe organização nem ator, categorias são as pastas existentes da sidebar. Conteúdo/versões intactos. Ver bulk/CLAUDE.md.
