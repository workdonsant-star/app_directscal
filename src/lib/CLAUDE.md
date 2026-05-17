# `src/lib` — Contratos, dados, Supabase e utilidades

Antes de editar, releia o **AGENTS.md** da raiz e este documento.

## Propósito

`src/lib` concentra a fronteira de dados do app. A UI ainda usa a camada mockada, mas a fundação Supabase de produção já existe para Auth.js, RLS e mutações server-side. Autenticação principal usa Auth.js/NextAuth com Google OAuth e regra corporativa em `auth/`.

## Estrutura

```
src/lib/
├── auth/                   ← Google OAuth, sessão e fallback mockado
├── contracts/              ← schemas Zod, tipos e mappers de dados
├── data/                   ← data-source mockado + regras de produção
├── supabase/               ← clients server-side Supabase
├── pdf/                    ← documentos PDF renderizados a partir da camada data
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
- `AdminModule`, `AcquisitionCampaign`, `AcquisitionFormField`, `Lead`, `LeadCompany`.
- `AuthUser`, `AuthSession`, `SignInInput`, `SignUpInput`, `ResetPasswordInput`.
- `Diagnostic`, `DiagnosticListItem`, `DiagnosticDetail`.
- `DiagnosticActionPlan`, `DiagnosticActionPoint`.
- `DiagnosticTemplate`, `Dimension`, `LikertScalePoint`, `RespondentGroupMeta`.
- `DiagnosticShareLink`, `DiagnosticShareWorkspace`.
- `Respondent`, `ResponseSession`, `LikertAnswer`, `SubmitLikertResponseInput`.
- `DashboardSummary`, `DimensionInsightSummary`, `DimensionQuestionResult`.
- `DiagnosticReport`, `DiagnosticReportDimension`, `DiagnosticReportQuestion`.
- `DiagnosticActionPlan`, `DiagnosticActionPlanDimension`, `DiagnosticActionPoint`.
- `UserProfile`, `ProfileSettingsData`.
- Inputs de escrita: `CreateDiagnosticInput`, `UpdateDiagnosticDraftInput`, `ActivateDiagnosticInput`, `CloseDiagnosticInput`, `DeleteDiagnosticInput`, `UpdateProfileInput`, `ChangePasswordInput`, `UpdateOrganizationInput`.
- Inputs de aquisição: `AcquisitionSubmissionInput`.
- Inputs de autenticação: `SignInInput`, `SignUpInput`, `ResetPasswordInput`.

## Data-source e Supabase

- Páginas e componentes devem importar dados de `src/lib/data/omdx-data-source.ts`.
- Não importe arrays de `mock-data.ts` em componentes ou páginas.
- `mock-data.ts` é apenas seed temporário. Ele pode ser importado pela camada `data/`, mas não pela UI.
- `omdx-overview-analytics.ts` deriva DTOs executivos do relatório OMDx para cards, charts e rankings da homepage. Dados de distribuição Likert ainda são mockados de forma determinística a partir de score, gap e dispersão enquanto não houver respostas individuais persistidas.
- A troca completa para Supabase deve acontecer dentro de `src/lib/data/`, preservando os contratos públicos sempre que possível.
- Cálculos agregados e helpers de domínio devem ficar em `data/` ou em funções puras de contrato, não em componentes.
- Planos de ação PDF devem consumir DTOs consolidados daqui, como `getDiagnosticActionPlan()`, sem gerar regra dentro do documento PDF.
- `profile-storage.ts` é exceção client-only para a fase mockada: persiste overrides de perfil no `localStorage` e emite evento para atualizar o shell. Deve ser substituído por backend/autenticação real no futuro.
- `supabase/` concentra clients server-side; `SUPABASE_SERVICE_ROLE_KEY` nunca deve chegar ao client.
- `auth/` concentra Auth.js/NextAuth, regra de domínio/e-mail corporativo, provisionamento de membership no Supabase, JWT para RLS e fallback mockado. O cookie `directscal_session` sustenta o login demo por e-mail/senha apenas em desenvolvimento.
- `admin-data-source.ts` também usa `localStorage` na fase mockada para campanhas editadas e leads enviados pelos links `/a/[token]`.

## `mock-data.ts`

Mantém dados fictícios determinísticos para validar a interface:
- organizações;
- perfil mockado;
- dimensões;
- templates;
- diagnósticos;
- registros de insights por dimensão;
- KPIs agregados temporários.
- módulos, campanhas e leads mockados do superadmin.

Os mocks devem continuar realistas, em pt-BR, sem dados pessoais reais e sem `Math.random()`.

## `utils.ts`

`cn(...inputs)` combina clsx + tailwind-merge. Use sempre que compor classes condicionalmente.

## Anti-padrões

- Importar `mock-data.ts` em página ou componente.
- Duplicar mappers de `Db*` dentro de UI.
- Criar campos opcionais por conveniência sem refletir o contrato real.
- Criar Supabase client em Client Component ou expor service role.
- Misturar validação de formulário com contrato de transporte quando o dado ainda não sai do client.
