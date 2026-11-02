# `/api/admin/management-assets` — Fluxo editorial dos ativos

Toda rota exige sessão `superadmin`. Regras de estado vivem em `src/lib/data/management-assets-admin-data-source.ts`; os handlers só validam entrada e traduzem erros.

- `POST /` aceita o contrato completo ou o contrato compacto com empresa, categoria e tipo. No contrato compacto, o servidor escolhe o modelo padrão do tipo, cria a versão 1 e devolve o ID para abrir o editor. Título, resumo e responsável iniciais são marcadores internos; a publicação exige substituí-los.
- `PATCH /[id]` salva metadados e, se houver rascunho em edição, o conteúdo. Conteúdo é validado por `richTextDocumentSchema`; documento fora do vocabulário permitido retorna 400.
- `POST /[id]/transition` executa `abrir_rascunho`, `publicar`, `arquivar`, `restaurar` ou `reindexar` e devolve o ativo atualizado com um aviso. O rascunho segue direto para publicação.
- Publicar gera trechos e embeddings e chama `app_private.publish_management_asset_version`, que troca a versão vigente numa única transação. Falha de embeddings não bloqueia a publicação: a busca textual segue funcionando e `reindexar` completa os vetores.

- `PATCH /bulk` altera metadados comuns de 1–200 ativos únicos da empresa indicada; `DELETE /bulk` exclui a seleção definitivamente, inclusive quando contém apenas um ativo. Ambos exigem superadmin, validam seleção completa e retornam `{ ids }` sem cache. Nenhuma dessas ações altera conteúdo de versões. Ver `bulk/CLAUDE.md`.
