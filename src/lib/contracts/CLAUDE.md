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
- Contratos de Pessoas ficam em `pessoas.ts`: pessoa, vínculo, remuneração, documentos, benefícios, pagamentos, Overview, diretório, perfil, fechamento mensal e configurações mínimas.

## Mappers

`mappers.ts` centraliza a conversão de `Db*` para domínio/UI. Não duplique conversões dentro de páginas ou componentes.
