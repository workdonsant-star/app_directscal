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

Componentes compartilhados com `/demo/admin` usam `useAppRuntime()` para requisições e links da apresentação. O runtime padrão preserva os endpoints operacionais; o runtime da demo atende somente fixtures locais.

| Componente | Uso |
| --- | --- |
| `AdminModulesWorkspace` | `/admin/modulos`, KPIs e tabela de módulos. |
| `AdminOperationsWorkspace` | `/admin/operacao`, métricas e fila de entregas. |
| `AdminSpecialistsWorkspace` | `/admin/especialistas`, equipe, cadastro persistido, perfil com nome e foto, ativação, arquivamento e exclusão. |
| `AdminAiProvidersWorkspace` | `/admin/motores-de-ia`, três conexões reais, teste de chave/modelo e seleção de um motor para o agente. |
| `GeneratorBriefingWorkspace` | `/admin/geradores/[tipo]`, campos por tipo e briefing Markdown; em Diagnósticos também importa CSV, mostra agregados e exporta rascunho revisável. |

| `AdminCompanyDetail` | `/admin/empresas/[id]`, atribuição, entregas e acessos. |
| `DeliveryDraftProvider` / `DeliveryShell` e etapas em `delivery/` | `/admin/entregas/[id]/*`, rascunho compartilhado, cabeçalho, navegação lateral por fase, checklist de publicação e uma etapa por rota (dados, relatório, action points, publicação). Ver `delivery/CLAUDE.md`. |
| `AdminDeliveryStatusBadge` | Estados operacionais compartilhados das entregas. |
| `ManagementAssetsWorkspace` | Etapa de ativos da entrega, com abas por estado, tabela e diálogo compacto de categoria/tipo. |
| `CompanyFilesWorkspace` / `CustomerDocumentsWorkspace` | Na aba Arquivos da empresa, a raiz mostra pastas. Cada pasta reúne uploads e ativos editoriais existentes; os modais criam pastas e enviam arquivos prontos para a biblioteca e para Relatórios do cliente. |
| `ManagementAssetCreateForm` | Escolha compacta de categoria e tipo; clicar no tipo abre o editor com o modelo padrão. |
| `ManagementAssetEditorWorkspace` | `/admin/empresas/[id]/criacao-dos-ativos/[assetId]`, editor, prévia, versão publicada, metadados, índice, histórico e ações editoriais. |
| `ManagementAssetStatusBadge` | Estados do ativo e das versões. |
| `AssetQuestionAuditsWorkspace` | `/admin/empresas/[id]/criacao-dos-ativos/perguntas`, lacunas e histórico de perguntas ao agente. |
| `AdminCampaignsWorkspace` | `/admin/campanhas`, KPIs, criação, tabela e drawer de campanhas. |
| `CampaignEditorDrawer` | Drawer para criar/editar campanha, selecionar módulo, definir slug de aquisição e campos do formulário. |
| `AdminLeadsTable` | `/admin/leads`, listagem de leads capturados com navegação por linha para o detalhe. |
| `AdminLeadDetail` | `/admin/leads/[id]`, leitura completa de contato, empresa, aquisição e campos preenchidos. |
| `AdminCompaniesTable` | `/admin/empresas`, empresas com conta cliente, busca e entrada no detalhe. |
| `AcquisitionPublicFlow` | `/a/[slug]`, escolha de método de acesso e formulário público configurável na etapa de e-mail. |
| `AcquisitionGoogleCompleteFlow` | `/a/[slug]/completar`, coleta empresa após Google e conclui o cadastro como cliente. |
| `AcquisitionProgressiveForm` | Formulário progressivo compartilhado pelos fluxos de e-mail e Google, com até três campos de campanha por bloco, avanço automático e altura estável. |
| `AdminStatusBadge` | Status discretos de módulos/campanhas. |
| `useAdminDataSnapshot` | Snapshot inicial obrigatório do servidor; atualização por evento em `/api/admin/acquisition`. |

`AdminSpecialistsWorkspace` usa apenas um título para a lista; arquivar alterna o título para `Especialistas arquivados`. A tabela fica após o controle de arquivados, sem subtítulos de apresentação.

`AdminCampaignsWorkspace` exige `initialSnapshot` real, autorizado e carregado pela página no servidor. Usa `useAdminDataSnapshot(initialSnapshot)`, sem busca redundante ao montar ou campanhas seed temporárias. O evento administrativo mantém a atualização após criar/editar; lista sem campanhas mostra estado vazio.

`AdminCompaniesTable` também exige snapshot inicial real da página: organizações seed não podem ocupar a listagem durante o carregamento. A exclusão mantém seleção, confirmação, remoção otimista apenas dos IDs confirmados e releitura pelo evento administrativo.

A tabela mostra nome e e-mail de todas as contas `cliente` vinculadas à empresa; busca também por esses campos. A demo usa contatos fictícios.

Na tabela de empresas, o link do nome cobre visualmente a linha inteira para abertura por mouse ou toque, enquanto o checkbox mantém uma camada própria para seleção. A coluna `Acessar` não existe; o link permanece acessível pelo teclado.

- A sidebar administrativa mostra Empresas cadastradas, Especialistas e Campanhas por grupos. `AdminOperationsNavigation` permanece apenas na rota legada de Operação, fora da navegação principal. Na aba Arquivos da empresa, pastas agrupam uploads e ativos editoriais existentes. A criação editorial permanece na etapa de ativos da entrega, sem seletor de empresa no formulário.
- `ManagementAssetCreateForm` recebe a empresa fixa e categorias disponíveis; exige escolha de categoria antes de habilitar o tipo. No editor, o breadcrumb da topbar termina no nome da empresa; o cabeçalho do conteúdo mostra título editável e estado, sem repetir categoria, tipo ou empresa. O salvamento ocorre após pausa curta. Resumo e responsável permanecem na lateral; falha de salvamento oferece nova tentativa.

- A entrega reúne Dados, Relatório, Action points, Criação dos ativos e Publicação como rotas aninhadas de `/admin/entregas/[id]/`; o menu lateral agrupa as etapas em Analisar, Produzir e Entregar. Listagem, editor e perguntas dos ativos rodam em `/ativos`, `/ativos/[assetId]` e `/ativos/perguntas` com `embedded`, compartilhando topbar e espaçamento. A empresa é resolvida pela organização do diagnóstico.

- Todas as tabelas visíveis usam o padrão das Dimensões de 06/10/2026 via `Table`: cabeçalho neutro de 44px com raio de 5px, padding horizontal de 16px, linhas de pelo menos 55px e divisórias de 0,5px entre linhas, sem borda externa nem fundo no hover. Conteúdo documental pode ampliar a altura; o editor preserva a indicação de células selecionadas.

## Edição e exclusão de ativos

`ManagementAssetsWorkspace` usa tabela operacional com seleção de até 200 ativos, ação individual de editar e exclusão com confirmação explícita. Editar cria a próxima versão em rascunho quando não há uma aberta; o rascunho é publicado diretamente. `ManagementAssetsBulkEditDialog` altera um campo por operação: autor (especialista atribuído, ou Directscal), categoria ou líder responsável. Metadados são comuns às versões; a edição em massa não altera conteúdo nem cria versões. Ativos arquivados precisam ser restaurados antes da edição. Exclusão definitiva individual ou em massa remove também versões, escopos e índice de busca; a seleção e os erros permanecem visíveis em caso de falha.

A tabela administrativa reutiliza `Table variant="operational"` e o `AssetCheckbox` da biblioteca do cliente: seleção em margem de 32px, visível no hover, foco, toque e quando marcada, com estado parcial no cabeçalho.

- useSpecialists lê o snapshot do servidor via SpecialistsProvider; /api/admin/specialists atualiza em foco e a cada minuto visível. Seletores da operação, empresa e entrega não consultam a lista fixa de demonstração. Edição de especialista não concede acesso ao painel.


A11: AdminCompanyDetail recebe contexto real do servidor por ID da empresa. Salvar chama PATCH autenticado com updatedAt esperado; erro mantém seleção e não confirma sucesso. Histórico lista diagnósticos encerrados reais, inclusive os que ainda não têm base de Fundador para análise. Principal sugere especialista em entregas novas, sem reatribuir publicações ou revisões já existentes.

A12: criação inclui RACI e modelo de responsabilidades. Editor envia a versão esperada e preserva texto após conflito. A lista de ativos mostra rascunhos, publicados e arquivados; a publicação direta mantém a versão anterior disponível até a nova publicação. Seletores seguem TabsList variant="selector". A fila administrativa ainda exige conferência visual autenticada em claro/escuro.

A04: routines/ contém workspace por empresa com tabela operacional, criação/edição em Sheet, histórico de revisões, pausa/retomada e transferência de todas as rotinas da ação. Diretório é consultado ao abrir formulário; erros mantêm texto/seleção. Link Operação das rotinas no detalhe da empresa. Sem percentuais inventados ou contato automático.

O detalhe da empresa usa `AdminCompanyTabs` em Visão geral, Arquivos, Diagnósticos e Action points quando há organização. `AdminActionPointsWorkspace` agrupa as ações manuais por líder e mostra separadamente as ações publicadas pelo responsável atual, com a revisão vigente da rotina, quando existe. Os dois registros não se substituem. A prop `showActionPoints` mantém a demo no mesmo cabeçalho. As rotas antigas de Operação e Rotinas permanecem acessíveis por URL, sem abas na navegação da empresa.
Na aba real, `AdminCompanyActionPointForm` permite cadastrar e editar ações manuais por líder Slack e ativo publicado. O formulário preserva campos e mostra conflito de versão; o painel do agente da demo continua uma simulação local, sem ativação no app real.
Action Points recorrentes exigem dias da semana e horário de Brasília. A agenda começa na data do primeiro cadastro; quinzenais usam semanas alternadas a partir dela e mensais usam os dias escolhidos na primeira semana do mês. Registros recorrentes antigos sem agenda precisam ser editados antes do disparo automático.
Na mesma aba, `Enviar pergunta no Slack` inicia uma pergunta privada apenas por ação explícita do superadmin. Após a entrega confirmada, `Enviar nova pergunta` inicia outro ciclo e outra thread mesmo sem resposta ao anterior; os relatos continuam ligados ao ciclo original. O último ciclo mostra entrega e relatos resumidos. Envios em preparação e incertos ficam travados para evitar duplicação.
Dúvidas recebidas no acompanhamento manual ficam registradas como `Dúvida registrada` na aba administrativa, sem exibir um pedido de confirmação de resumo que não foi enviado à pessoa.
As duas abas mantêm largura e posição estáveis entre rotas, inclusive quando o peso da aba ativa muda.

Na Visão geral e em Arquivos, não repetir o nome da área em frases auxiliares como “Dados e trabalho desta empresa” ou “Área de gestão desta empresa”.


A17: AssetQuestionAuditsWorkspace usa selector/operational e saúde real. AgentGapReviewDialog mostra registro completo e histórico, exige responsável/evidência para resolver e preserva texto em erro. Lacunas exclui resolvidas; Todas conserva consultas. Sem alertas externos ou promessa de monitoramento contínuo. Revisão visual em claro/escuro pendente de navegador.


A12: ativos vinculados a histórico de rotina não podem ser excluídos definitivamente; API orienta arquivar. A seleção e os registros são preservados.

C2 (26/10/2026): AdminCompanyDetail inclui SlackDeliveriesPanel, sob demanda, usando a API administrativa existente. Lista paginada preserva conteúdo em falha; só Falhou sem tentativa automática oferece recuperação com confirmação e updatedAt. Incerto nunca recebe botão de reenvio. POST sem confirmação trava novas tentativas até releitura; sucesso em fila não equivale a entrega. Concluído sem deliveredTs aparece Encerrado sem envio. Link Guia de operação abre /admin/guia.

## Exclusão definitiva de empresas

`AdminCompaniesTable` oferece seleção individual ou de até 100 empresas, estado parcial no checkbox do cabeçalho, limpeza de seleção e diálogo com os nomes congelados. A confirmação exige EXCLUIR. DELETE /api/admin/companies apaga o lote em transação; erro conserva seleção/diálogo, sucesso retira somente IDs confirmados e atualiza aquisição. A copy distingue contas exclusivas de contas com vínculos externos e não promete apagar contas/mensagens nos provedores Google/Slack.

## Carregamento inicial sem dados provisórios

Todos os consumidores de `useAdminDataSnapshot` exigem snapshot do servidor: Campanhas, Empresas, Leads, detalhe de Lead e Módulos. O hook não busca ao montar, acompanha novos snapshots do servidor e conserva o último confirmado em erro de atualização; respostas antigas não sobrescrevem uma requisição mais nova.

`SpecialistsProvider` recebe diretório real do servidor em Operação, detalhe da empresa e layout da entrega. `useSpecialists` exige esse provider e não começa com lista vazia. Um único listener de foco e timer por provider atualiza os consumidores; não há fetch redundante na montagem. A atualização mantém os dados anteriores em falha e só roda com a página visível. Especialistas mantém sua página própria com snapshot inicial.

## Transporte compartilhado com a demo

Listagem/editor/perguntas de ativos, revisão de lacunas, operação e navegação usam useAppRuntime para requisições e URLs. O runtime padrão conserva o backend administrativo; a demo mantém estado local. O editor aceita companyId explícito para conservar a empresa do breadcrumb (o fallback operacional continua company_organizationId). Regras editoriais e componentes visuais permanecem compartilhados.

`AdminCompanyTabs` aceita `actions` opcional para mostrar as ações da aba ativa na mesma linha das abas, à direita. `CompanyFilesWorkspace` só usa isso com `actionsInTabs` (repassado como `renderTabs` a `CustomerDocumentsWorkspace`, que então omite o título Arquivos). Sem essas props, o app operacional mantém o layout anterior; hoje só a demo as liga.

`AdminCompanyTabs` usa `showReport` no produto e na demo para a aba Diagnósticos. A aba reutiliza `CustomerDocumentsWorkspace` com `reportsOnly`: o superadmin envia um PDF final, que aparece na área Diagnósticos do cliente. O fluxo não usa editor ou rascunho.
Na rota real, `AdminCompanyReportsWorkspace` é a fronteira de cliente que cria a função `renderTabs`; a página de servidor passa somente ID e documentos. Não passar funções do servidor como props para esse workspace.

O formulário `AdminCompanyActionPointForm` configura frequência, dias e horário de Brasília. Quinzenal alterna semanas a partir da data inicial; mensal usa os dias escolhidos na primeira semana do mês. A lista mostra a programação para revisão.
O horário recorrente usa seletores de hora e minuto em intervalos de cinco minutos, alinhados ao Supabase Cron. Horários antigos fora dessa grade continuam visíveis na edição e exigem ajuste antes de salvar.
