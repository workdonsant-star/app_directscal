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
| `AdminSpecialistsWorkspace` | `/admin/especialistas`, equipe, cadastro persistido, perfil com nome e foto, ativação, arquivamento e exclusão. |
| `AdminCompanyDetail` | `/admin/empresas/[id]`, atribuição, entregas e acessos. |
| `DeliveryDraftProvider` / `DeliveryShell` e etapas em `delivery/` | `/admin/entregas/[id]/*`, rascunho compartilhado, cabeçalho, navegação lateral por fase, checklist de publicação e uma etapa por rota (dados, relatório, action points, publicação). Ver `delivery/CLAUDE.md`. |
| `AdminDeliveryStatusBadge` | Estados operacionais compartilhados das entregas. |
| `ManagementAssetsWorkspace` | `/admin/empresas/[id]/criacao-dos-ativos`, abas por estado, empresa fixa, tabela e drawer de criação. |
| `ManagementAssetCreateForm` | Drawer em três etapas para criar ativo a partir de modelo ou em branco, no padrão do formulário de diagnóstico. |
| `ManagementAssetEditorWorkspace` | `/admin/empresas/[id]/criacao-dos-ativos/[assetId]`, editor, prévia, versão publicada, metadados, índice, histórico e ações editoriais. |
| `ManagementAssetStatusBadge` | Estados do ativo e das versões. |
| `AssetQuestionAuditsWorkspace` | `/admin/empresas/[id]/criacao-dos-ativos/perguntas`, lacunas e histórico de perguntas ao agente. |
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

- `AdminOperationsNavigation` organiza as áreas Entregas e Criação dos ativos sob Operação. Não criar entrada independente de ativos na sidebar administrativa.
- `ManagementAssetCreateForm` recebe `initialOrganizationId` e `organizationLocked` da instância; a empresa fica fixa. `ManagementAssetsWorkspace` recebe só a empresa da instância e os ativos dela.

- A entrega reúne Dados, Relatório, Action points, Criação dos ativos e Publicação como rotas aninhadas de `/admin/entregas/[id]/`; o menu lateral agrupa as etapas em Analisar, Produzir e Entregar. Listagem, editor e perguntas dos ativos rodam em `/ativos`, `/ativos/[assetId]` e `/ativos/perguntas` com `embedded`, compartilhando topbar e espaçamento. A empresa é resolvida pela organização do diagnóstico.

- Todas as tabelas visíveis usam o padrão das Dimensões de 06/10/2026 via `Table`: cabeçalho neutro de 44px com raio de 5px, padding horizontal de 16px, linhas de pelo menos 55px e divisórias de 0,5px entre linhas, sem borda externa nem fundo no hover. Conteúdo documental pode ampliar a altura; o editor preserva a indicação de células selecionadas.

## Edição e exclusão de ativos

`ManagementAssetsWorkspace` usa tabela operacional com seleção de até 200 ativos, ação individual de editar e exclusão com confirmação explícita. Editar cria a próxima versão em rascunho quando não há uma aberta e mantém o contexto da entrega. A publicação continua passando pela revisão editorial. `ManagementAssetsBulkEditDialog` altera um campo por operação: autor (especialista atribuído, ou Directscal), categoria, líder responsável ou ciclo de revisão. Metadados são comuns às versões; a edição em massa não altera conteúdo nem cria versões. Ativos arquivados precisam ser restaurados antes da edição. Exclusão definitiva individual ou em massa remove também versões, escopos e índice de busca; a seleção e os erros permanecem visíveis em caso de falha.

- useSpecialists lê o cadastro compartilhado via /api/admin/specialists, no carregamento, foco e a cada minuto. Seletores da operação, empresa e entrega não consultam a lista fixa de demonstração. Edição de especialista não concede acesso ao painel.


A11: AdminCompanyDetail recebe contexto real do servidor por ID da empresa. Salvar chama PATCH autenticado com updatedAt esperado; erro mantém seleção e não confirma sucesso. Histórico lista diagnósticos encerrados reais, inclusive os que ainda não têm base de Fundador para análise. Principal sugere especialista em entregas novas, sem reatribuir publicações ou revisões já existentes.

A12: criação inclui RACI e modelo de responsabilidades. Editor envia a revisão esperada e preserva texto após conflito. Lista de ativos oferece filtro Revisão vencida, prazo calculado da versão publicada e responsável documental; publicar uma revisão reinicia o ciclo, sem arquivamento automático. Seletores seguem TabsList variant="selector". A fila administrativa ainda exige revisão visual autenticada em claro/escuro.

A04: routines/ contém workspace por empresa com tabela operacional, criação/edição em Sheet, histórico de revisões, pausa/retomada e transferência de todas as rotinas da ação. Diretório é consultado ao abrir formulário; erros mantêm texto/seleção. Link Operação das rotinas no detalhe da empresa. Sem percentuais inventados ou contato automático.


A17: AssetQuestionAuditsWorkspace usa selector/operational e saúde real. AgentGapReviewDialog mostra registro completo e histórico, exige responsável/evidência para resolver e preserva texto em erro. Lacunas exclui resolvidas; Todas conserva consultas. Sem alertas externos ou promessa de monitoramento contínuo. Revisão visual em claro/escuro pendente de navegador.


A12: ativos vinculados a histórico de rotina não podem ser excluídos definitivamente; API orienta arquivar. A seleção e os registros são preservados.
