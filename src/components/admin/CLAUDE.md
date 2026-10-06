# `src/components/admin` — Componentes do superadmin

Antes de editar, releia o **AGENTS.md** da raiz e o `CLAUDE.md` de `src/components/`.

## Propósito

Componentes específicos da visão de superadministrador da Directscal. Eles administram aquisição, empresas, especialistas e o ciclo interno de entregas ao cliente.

## Convenções

- Componentes devem consumir DTOs em camelCase vindos de `src/lib/data/admin-data-source.ts` e dos Route Handlers de admin.
- Campanhas, leads e empresas são persistidos no Supabase; não reintroduza `localStorage` para este fluxo.
- O link público de campanha começa por uma tela de escolha de método. Google cria um intent, encerra a sessão Auth.js anterior para forçar nova escolha de conta e completa empresa em `/a/[slug]/completar`; e-mail abre uma segunda etapa com dados da campanha e senha. Ambos criam lead, organização e membership `cliente`.
- A interface pública de campanha reutiliza `AuthPageShell` com `visualVariant="app"`: logo no topo, formulário na mesma coluna estreita do login, mesh gradient Bloom Field no painel lateral, depoimento e versão compacta do gradiente no mobile.
- O onboarding usa `AcquisitionProgressiveForm`: até três campos de campanha por bloco, sempre em uma única coluna, progresso explícito, avanço automático quando o bloco inteiro fica válido e um único botão para voltar. O último bloco de campanha pode ter menos de três campos; senha e confirmação permanecem juntas no último bloco técnico. A troca de blocos deve preservar a altura da coluna; quando necessário, somente a área dos campos pode rolar, sem transformar o formulário em uma página longa.
- Campanhas, leads, empresas e aquisição pública ficam disponíveis quando `FEATURE_ACQUISITION=true`; com o flag desligado, as rotas permanecem bloqueadas.
- Use os mesmos primitives do app autenticado: `Table`, `Card`, `Button`, `Sheet`, `Select`, `Badge` e `KpiCard` compartilhado.
- Mantenha continuidade visual com Maturidade: tabelas principais de módulos, campanhas, leads e empresas ficam livres no fluxo da página, não dentro de `Card`. Use título/descrição/ações acima da tabela e o container com rolagem horizontal do primitive, sem contorno externo.
- Use `Card` no admin apenas para KPIs, drawers/modais ou blocos que sejam ferramentas enquadradas, nunca como envelope da tabela operacional principal.
- Os campos base do onboarding não devem ser removidos. Além de nome, e-mail, WhatsApp, tamanho da empresa e desafios, o conjunto inclui posição, nicho, Instagram, website, CNPJ e faturamento do último trimestre. O nome da empresa não é digitado: a razão social e os demais dados cadastrais vêm da consulta server-side à API Minha Receita.
- Leads usam página própria de detalhe em `/admin/leads/[id]`; não abrir detalhes em drawer ou modal lateral.
- Texto visível em pt-BR, tom consultivo e direto, sem emoji e sem ponto de exclamação.
- A fila e o workspace do ciclo operacional recebem relatórios reais do Supabase pela camada server-side; edição, atribuição e publicação precisam declarar que permanecem locais.
- Relatório e action points pertencem à mesma entrega; a publicação deve validar os dois conteúdos juntos.

## Componentes atuais

| Componente | Uso |
| --- | --- |
| `AdminModulesWorkspace` | `/admin/modulos`, KPIs e tabela de módulos. |
| `AdminOperationsWorkspace` | `/admin/operacao`, métricas e fila de entregas. |
| `AdminSpecialistsWorkspace` | `/admin/especialistas`, equipe, cadastro local, perfil com foto, ativação, arquivamento e exclusão. |
| `AdminCompanyDetail` | `/admin/empresas/[id]`, atribuição, entregas e acessos. |
| `AdminDeliveryWorkspace` | `/admin/entregas/[id]`, seleção e download de relatório, overview analítico, detalhe por dimensão, edição persistida, action points e publicação no Supabase. |
| `AdminDeliveryStatusBadge` | Estados operacionais compartilhados das entregas. |
| `ManagementAssetsWorkspace` | `/admin/ativos`, abas por estado, filtro por empresa, tabela e drawer de criação. |
| `ManagementAssetCreateForm` | Drawer em três etapas para criar ativo a partir de modelo ou em branco, no padrão do formulário de diagnóstico. |
| `ManagementAssetEditorWorkspace` | `/admin/ativos/[id]`, editor, prévia, versão publicada, metadados, índice, histórico e ações editoriais. |
| `ManagementAssetStatusBadge` | Estados do ativo e das versões. |
| `AssetQuestionAuditsWorkspace` | `/admin/ativos/perguntas`, lacunas e histórico de perguntas ao agente. |
| `AdminCampaignsWorkspace` | `/admin/campanhas`, KPIs, criação, tabela e drawer de campanhas. |
| `CampaignEditorDrawer` | Drawer para criar/editar campanha, selecionar módulo, definir slug de aquisição e campos do formulário. |
| `AdminLeadsTable` | `/admin/leads`, listagem de leads capturados com navegação por linha para o detalhe. |
| `AdminLeadDetail` | `/admin/leads/[id]`, leitura completa de contato, empresa, aquisição e campos preenchidos. |
| `AdminCompaniesTable` | `/admin/empresas`, empresas agrupadas a partir dos leads. |
| `AcquisitionPublicFlow` | `/a/[slug]`, escolha de método de acesso e formulário público configurável na etapa de e-mail. |
| `AcquisitionGoogleCompleteFlow` | `/a/[slug]/completar`, coleta empresa após Google e conclui o cadastro como cliente. |
| `AcquisitionProgressiveForm` | Formulário progressivo compartilhado pelos fluxos de e-mail e Google, com até três campos de campanha por bloco, avanço automático e altura estável. |
| `AdminStatusBadge` | Status discretos de módulos/campanhas. |
| `useAdminData` | Busca client-side do snapshot Supabase em `/api/admin/acquisition`. |
<<<<<<< Updated upstream
=======

- `AdminOperationsNavigation` organiza as áreas Entregas e Criação dos ativos sob Operação. Não criar entrada independente de ativos na sidebar administrativa.
- `ManagementAssetCreateForm` recebe `initialOrganizationId` e `organizationLocked` da instância; a empresa fica fixa. `ManagementAssetsWorkspace` recebe só a empresa da instância e os ativos dela.

- `AdminDeliveryWorkspace` inclui Criação dos ativos no mesmo menu Dados / Relatório / Action points / Publicação. Recebe `assetsContent` do servidor; listagem, editor e perguntas são renderizados nessa aba com `embedded`, compartilhando topbar e espaçamento.
- Editor e perguntas dentro de uma entrega navegam por `?aba=ativos&ativo=<id>` e `?aba=ativos&perguntas=1`; voltar à lista mantém `?aba=ativos`. A empresa é resolvida pela organização do diagnóstico.

- Todas as tabelas visíveis usam o padrão das Dimensões de 06/10/2026 via `Table`: cabeçalho neutro de 44px com raio de 5px, padding horizontal de 16px, linhas de pelo menos 55px e divisórias de 0,5px entre linhas, sem borda externa nem fundo no hover. Conteúdo documental pode ampliar a altura; o editor preserva a indicação de células selecionadas.
>>>>>>> Stashed changes
