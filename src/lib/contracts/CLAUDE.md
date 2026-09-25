# `src/lib/contracts` — Contratos de dados

Esta pasta define os contratos de dados preparados para a futura integração com Supabase.

## Convenções

- Use Zod para schemas runtime e `z.infer` para tipos TypeScript.
- `Db*` representa o formato futuro de banco/Supabase, com campos `snake_case`.
- DTOs e modelos de domínio usados pela UI ficam em `camelCase`.
- Datas de evento usam datetime ISO com offset (`createdAt`, `updatedAt`, `activatedAt`, `closedAt`).
- Datas de prazo usam date ISO (`deadline`, formato `YYYY-MM-DD`).
- IDs continuam como `string` nesta fase porque os mocks usam valores como `diag_01`; a futura migração para UUID deve ser feita nos schemas, não nos componentes.
- Componentes não devem importar schemas diretamente salvo necessidade de validação local. Prefira tipos e funções de `src/lib/data/`.
- Contratos do cronograma ficam em `gantt.ts`: status, tarefas recursivas, metadados opcionais de action point para detalhe de execução e payload de workspace usado para transformar action points em frentes no Gantt.
- Contratos do superadmin ficam em `admin.ts`: módulos, campanhas, campos configuráveis, leads, empresas e input de submissão pública.
- Contratos da operação especializada ficam em `admin-operations.ts`: especialistas, entregas, estados e catálogo de action points da primeira versão frontend.
- Contratos da biblioteca de ativos ficam em `management-assets.ts`: tipo, categoria opcional, autoria, datas de publicação/atualização e documento de SOP com metadados, seções e blocos tipados de parágrafo, lista ou tabela.
- Contratos de setores, lideranças e convites ficam em `organization-structure.ts`. `accessLevel` usa `owner | admin` na UI e mapeia para `cliente | admin` no banco; o `superadmin` global nunca é uma opção. Nome e foto permanecem nulos até o aceite Google.
- `Diagnostic` carrega criador, setores e permissões derivadas. `DiagnosticShareLink` possui identidade própria e setor opcional; a coleção de links é variável porque existe um link de Time por setor.

## Mappers

`mappers.ts` centraliza a conversão de `Db*` para domínio/UI. Não duplique conversões dentro de páginas ou componentes.
