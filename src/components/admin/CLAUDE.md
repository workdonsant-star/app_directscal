# `src/components/admin` — Componentes do superadmin

Antes de editar, releia o **AGENTS.md** da raiz e o `CLAUDE.md` de `src/components/`.

## Propósito

Componentes específicos da visão de superadministrador da Directscal. Eles administram módulos, campanhas de aquisição, leads e empresas capturadas pelos links públicos.

## Convenções

- Componentes devem consumir dados por `src/lib/data/admin-data-source.ts`.
- A persistência ainda é mockada em `localStorage`; não introduza backend, autenticação ou Supabase aqui.
- Campanhas, leads, empresas e aquisição pública ficam fora do primeiro go-live OMDx e devem respeitar `FEATURE_ACQUISITION=false`.
- Use os mesmos primitives do app autenticado: `Table`, `Card`, `Button`, `Sheet`, `Select`, `Badge` e `KpiCard` compartilhado.
- Mantenha continuidade visual com OMDx: tabelas principais de módulos, campanhas, leads e empresas ficam livres no fluxo da página, não dentro de `Card`. Use título/descrição/ações acima da tabela e apenas o wrapper `overflow-hidden rounded-lg border` na própria listagem.
- Use `Card` no admin apenas para KPIs, drawers/modais ou blocos que sejam ferramentas enquadradas, nunca como envelope da tabela operacional principal.
- Campos base de lead (`nome`, `email`, `empresa`) não devem ser removidos, porque sustentam as listagens de leads e empresas.
- Leads usam página própria de detalhe em `/admin/leads/[id]`; não abrir detalhes em drawer ou modal lateral.
- Texto visível em pt-BR, tom consultivo e direto, sem emoji e sem ponto de exclamação.

## Componentes atuais

| Componente | Uso |
| --- | --- |
| `AdminModulesWorkspace` | `/admin/modulos`, KPIs e tabela de módulos. |
| `AdminCampaignsWorkspace` | `/admin/campanhas`, KPIs, criação, tabela e drawer de campanhas. |
| `CampaignEditorDrawer` | Drawer para criar/editar campanha, selecionar módulo, definir slug de aquisição e campos do formulário. |
| `AdminLeadsTable` | `/admin/leads`, listagem de leads capturados com navegação por linha para o detalhe. |
| `AdminLeadDetail` | `/admin/leads/[id]`, leitura completa de contato, empresa, aquisição e campos preenchidos. |
| `AdminCompaniesTable` | `/admin/empresas`, empresas agrupadas a partir dos leads. |
| `AcquisitionPublicFlow` | `/a/[token]`, formulário público configurável e preview do módulo. |
| `AdminStatusBadge` | Status discretos de módulos/campanhas. |
| `useAdminData` | Assinatura client-side do snapshot mockado de admin. |
