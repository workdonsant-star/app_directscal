# `/api/admin/management-assets` — Fluxo editorial dos ativos

Toda rota exige sessão `superadmin`. Regras de estado vivem em `src/lib/data/management-assets-admin-data-source.ts`; os handlers só validam entrada e traduzem erros.

- `POST /` cria o ativo e a versão 1 em rascunho, a partir de um modelo ou em branco.
- `PATCH /[id]` salva metadados e, se houver rascunho em edição, o conteúdo. Conteúdo é validado por `richTextDocumentSchema`; documento fora do vocabulário permitido retorna 400.
- `POST /[id]/transition` executa `abrir_rascunho`, `enviar_para_revisao`, `aprovar_revisao`, `devolver_para_rascunho`, `publicar`, `arquivar`, `restaurar` ou `reindexar` e devolve o ativo atualizado com um aviso.
- Publicar gera trechos e embeddings e chama `app_private.publish_management_asset_version`, que troca a versão vigente numa única transação. Falha de embeddings não bloqueia a publicação: a busca textual segue funcionando e `reindexar` completa os vetores.
