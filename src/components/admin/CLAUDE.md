# `src/components/admin` — Componentes do superadmin

Antes de editar, releia o **AGENTS.md** da raiz e o `CLAUDE.md` de `src/components/`.

## Propósito

Componentes específicos da visão de superadministrador da Directscal. Eles administram módulos, campanhas de aquisição, leads e empresas capturadas pelos links públicos.

## Convenções

- Componentes devem consumir DTOs em camelCase vindos de `src/lib/data/admin-data-source.ts` e dos Route Handlers de admin.
- Campanhas, leads e empresas são persistidos no Supabase; não reintroduza `localStorage` para este fluxo.
- O link público de campanha começa por uma tela de escolha de método. Google cria um intent, encerra a sessão Auth.js anterior para forçar nova escolha de conta e completa empresa em `/a/[slug]/completar`; e-mail abre uma segunda etapa com dados da campanha e senha. Ambos criam lead, organização e membership `cliente`.
- A interface pública de campanha reutiliza `AuthPageShell` com `visualVariant="app"`: logo no topo, formulário na mesma coluna estreita do login, mesh gradient Bloom Field no painel lateral, depoimento e versão compacta do gradiente no mobile. Etapas longas usam `contentAlignment="start"`.
- Campanhas, leads, empresas e aquisição pública ficam disponíveis quando `FEATURE_ACQUISITION=true`; com o flag desligado, as rotas permanecem bloqueadas.
- Use os mesmos primitives do app autenticado: `Table`, `Card`, `Button`, `Sheet`, `Select`, `Badge` e `KpiCard` compartilhado.
- Mantenha continuidade visual com Maturidade: tabelas principais de módulos, campanhas, leads e empresas ficam livres no fluxo da página, não dentro de `Card`. Use título/descrição/ações acima da tabela e apenas o wrapper `overflow-hidden rounded-lg border` na própria listagem.
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
| `AcquisitionPublicFlow` | `/a/[slug]`, escolha de método de acesso e formulário público configurável na etapa de e-mail. |
| `AcquisitionGoogleCompleteFlow` | `/a/[slug]/completar`, coleta empresa após Google e conclui o cadastro como cliente. |
| `AdminStatusBadge` | Status discretos de módulos/campanhas. |
| `useAdminData` | Busca client-side do snapshot Supabase em `/api/admin/acquisition`. |
