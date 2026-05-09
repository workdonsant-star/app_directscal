# `src/lib` — Contratos, dados mockados e utilidades

Antes de editar, releia o **AGENTS.md** da raiz e este documento.

## Propósito

`src/lib` concentra a fronteira de dados do app. A fase atual ainda é 100% mockada, mas os contratos já estão preparados para futura integração com Supabase.

## Estrutura

```
src/lib/
├── contracts/              ← schemas Zod, tipos e mappers de dados
├── data/                   ← data-source mockado consumido por páginas/componentes
├── mock-data.ts            ← seed temporário e bruto dos dados mockados
├── profile-storage.ts      ← overrides locais de perfil via localStorage
├── types.ts                ← reexports dos tipos públicos de contracts/
└── utils.ts                ← cn() (clsx + tailwind-merge)
```

## Contratos

- `src/lib/contracts/` é a fonte canônica dos contratos de dados.
- Use Zod para validar shapes em runtime e inferir tipos TypeScript.
- `Db*` representa o formato futuro Supabase, com campos `snake_case`.
- DTOs e modelos usados pela UI ficam em `camelCase`.
- Conversões de `Db*` para UI devem passar por `src/lib/contracts/mappers.ts`.
- Datas de evento usam datetime ISO com offset: `createdAt`, `updatedAt`, `activatedAt`, `closedAt`.
- Datas de prazo usam date ISO: `deadline` no formato `YYYY-MM-DD`.
- IDs são `string` nesta fase porque os mocks usam ids como `diag_01`; a migração para UUID deve ser feita nos schemas, não nos componentes.

Contratos principais:
- `Diagnostic`, `DiagnosticListItem`, `DiagnosticDetail`.
- `DiagnosticTemplate`, `Dimension`, `LikertScalePoint`, `RespondentGroupMeta`.
- `DiagnosticShareLink`, `DiagnosticShareWorkspace`.
- `Respondent`, `ResponseSession`, `LikertAnswer`, `SubmitLikertResponseInput`.
- `DashboardSummary`, `DimensionInsightSummary`.
- `UserProfile`, `ProfileSettingsData`.
- Inputs de escrita: `CreateDiagnosticInput`, `UpdateDiagnosticDraftInput`, `ActivateDiagnosticInput`, `CloseDiagnosticInput`, `DeleteDiagnosticInput`, `UpdateProfileInput`, `ChangePasswordInput`, `UpdateOrganizationInput`.

## Data-source mockado

- Páginas e componentes devem importar dados de `src/lib/data/omdx-data-source.ts`.
- Não importe arrays de `mock-data.ts` em componentes ou páginas.
- `mock-data.ts` é apenas seed temporário. Ele pode ser importado pela camada `data/`, mas não pela UI.
- Quando Supabase entrar, a troca deve acontecer dentro de `src/lib/data/`, preservando os contratos públicos sempre que possível.
- Cálculos agregados e helpers de domínio devem ficar em `data/` ou em funções puras de contrato, não em componentes.
- `profile-storage.ts` é exceção client-only para a fase mockada: persiste overrides de perfil no `localStorage` e emite evento para atualizar o shell. Deve ser substituído por backend/autenticação real no futuro.

## `mock-data.ts`

Mantém dados fictícios determinísticos para validar a interface:
- organizações;
- perfil mockado;
- dimensões;
- templates;
- diagnósticos;
- registros de insights por dimensão;
- KPIs agregados temporários.

Os mocks devem continuar realistas, em pt-BR, sem dados pessoais reais e sem `Math.random()`.

## `utils.ts`

`cn(...inputs)` combina clsx + tailwind-merge. Use sempre que compor classes condicionalmente.

## Anti-padrões

- Importar `mock-data.ts` em página ou componente.
- Duplicar mappers de `Db*` dentro de UI.
- Criar campos opcionais por conveniência sem refletir o contrato real.
- Introduzir fetch, server action, Supabase client, migrations ou autenticação real nesta fase.
- Misturar validação de formulário com contrato de transporte quando o dado ainda não sai do client.
