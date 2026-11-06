# Apresentação com os componentes do produto

O superadmin da demo acessa os cinco geradores pelo `AppSidebar` compartilhado; os briefings são locais e não chamam APIs.

`DemoAcquisition` reutiliza `AuthPageShell` e `AcquisitionProgressiveForm` para os links de Campanhas. A opção Google abre apenas a etapa fictícia de conclusão; o envio cria um lead local com status `lead`, sem conta. `DemoAuth` usa o mesmo shell visual para entrada, cadastro e recuperação e identifica a simulação. Nunca importar Auth.js, clientes de banco ou serviços operacionais para estes componentes.

Na área Diagnósticos da demo, o cliente vê somente PDFs enviados pelo superadmin fictício. `DemoUploadedReports` lê os metadados locais e usa `UploadedReportsList`, com o mesmo card da listagem anterior; o download vem do IndexedDB pelo runtime. Sem arquivo enviado, mostra estado vazio. A aba Diagnósticos da empresa abre o mesmo formulário de upload restrito a PDF; não há leitura HTML demonstrativa.

`DemoShell` compõe os mesmos AppSidebar, NavUser, SidebarProvider e SidebarInset do layout autenticado. Não manter uma segunda sidebar, topbar, chat, biblioteca ou tabela. As telas usam DiagnosticsWorkspace, ManagementAssetsLibrary, ManagementAssetEditableReader, AiChatWorkspace, ReportWorkspace e os formulários de Configurações/Perfil do produto. A visão administrativa reutiliza AdminCompaniesTable, AdminSpecialistsWorkspace, AdminCompanyTabs e AnalyticsOverview; operações desses componentes passam pelo AppRuntimeProvider e por fixtures locais.

`AppRuntimeProvider` injeta somente resolução de URLs, pathname canônico e adapter local de requisições. Fora do provider, os componentes preservam URLs e fetch operacionais. O runtime da demo é estável para não reiniciar efeitos de formulário a cada atualização do estado. Qualquer operação não implementada retorna erro local; nunca encaminhar ao backend.

`demo-store.ts` mantém estado validado por Zod em uma chave própria. Reiniciar também limpa os marcadores de resposta dos tokens fictícios enviados, sem tocar dados de outros fluxos. Navegação e downloads ficam em /demo. O menu Demo, discreto na topbar, alterna as visões de cliente/superadmin e reúne reinício e atalho do agente; não introduzir itens próprios na sidebar do cliente. `DemoAdmin` reaproveita os componentes administrativos de empresas, especialistas e operação; `DemoAdminCompany` e `DemoAdminDelivery` montam as áreas internas descritas abaixo.

Os dados continuam fictícios e locais. Nenhum transporte Slack, e-mail, modelo de IA ou autenticação é chamado. Formulário público usa a superfície de respondente, fora do shell autenticado.

Na lista de Pesquisas, a coluna Dados CSV permanece visível e desativada: as contagens da demo são agregadas fictícias e não existem respostas individuais para exportar.

Na entrega administrativa, o provider do rascunho troca de chave quando a publicação local salva aparece após a hidratação. Assim, a redação persistida no navegador é carregada ao reabrir ou atualizar o relatório.

## Superadmin por empresa

A Visão geral administrativa da Vertex usa a mesma apresentação concisa da empresa real: sem subtítulo genérico sob o nome nem descrições redundantes nos gráficos. O cabeçalho administrativo dos ativos também fica apenas com o nome e as abas.

DemoAdminCompany reutiliza ManagementAssetsWorkspace, ManagementAssetEditorWorkspace, AssetQuestionAuditsWorkspace e AdminRoutinesWorkspace. DemoAdminDelivery reutiliza provider, shell e etapas da entrega; Operação global usa AdminOperationsWorkspace. Listagem, editor, perguntas, acordos e entregas permanecem sob /demo/admin. Os links de ativos do Analytics usam o editor administrativo. A alternância para cliente é explícita pelo menu Demo.

Na aba Arquivos da empresa, CompanyFilesWorkspace é o mesmo componente do produto: a raiz mostra pastas e cada pasta reúne uploads e ativos editoriais existentes. Nova pasta e Novo arquivo abrem modais para criar pastas e enviar PDF/DOCX fictícios. Metadados ficam no estado da demo e os bytes em IndexedDB neste navegador, sem API real. A visão do cliente mostra as pastas, os arquivos e os relatórios enviados; o reset limpa ambos os armazenamentos.

As operações editoriais, metadados em lote, acordos e rascunhos de entrega passam por useAppRuntime; nenhuma busca desses componentes pode usar fetch diretamente na demo. Publicações e versões persistem apenas no navegador. Rotinas reutilizam diretório fictício; revisão e transporte externos não são simulados como entrega real.

No superadmin, o menu Demo oferece somente a troca explícita para cliente e o reinício. Reiniciar conserva a visão atual; o atalho do agente pertence à visão do cliente.

## Action points do consultor

A empresa fictícia tem a aba Action points (`/demo/admin/empresas/demo-vertex/action-points`). `DemoAdminActionPoints` injeta fixtures e salvamento local no mesmo `AdminActionPointsWorkspace` do produto, incluindo a seção de ações publicadas em entregas. O consultor cria e edita cada action point no formulário compartilhado com ativo publicado, líder do diretório fictício, tipo e os três textos operacionais. O teste de envio é rotulado como simulação e não chama Slack.

O estado fica em `adminActionPoints` no navegador; até o primeiro salvamento a aba mostra dois exemplos. Reiniciar a demo restaura os exemplos. A visão do cliente em `/demo/action-points` ainda não lê esses registros. O workspace antigo de Entregas permanece sem alteração.

A listagem administrativa agrupa os action points pelo ID do líder no diretório fictício. Cada pessoa aparece com foto (mesmo mapa local da visão do cliente, com iniciais como fallback), nome e contagem de ações. O botão da pessoa expande/recolhe seus itens com `aria-expanded`/`aria-controls`; dentro do grupo, cada ação mostra título, ativo e prazo e abre o editor existente. Salvar abre o grupo do responsável escolhido; trocar o líder move a ação e remove grupos que ficarem vazios. Pessoas sem ações não aparecem. Não adicionar métricas de aderência fictícias a essa listagem de criação.

Nas três abas da empresa (Visão geral, Arquivos e Action points) não há título de seção repetindo o nome da aba. As ações de cada aba ficam na linha das abas, à direita, acima da divisória: filtro de pesquisa, Nova pasta/Novo arquivo e Novo action point. A demo liga isso por `actions` em `AdminCompanyTabs`, `actionsInTabs` em `CompanyFilesWorkspace` e `hideHeader` em `AnalyticsOverview`.

Action points pontuais aceitam prazo opcional. Recorrentes usam o mesmo formulário do produto, com frequência diária, semanal, quinzenal ou mensal, dias da semana e horário de Brasília em passos de cinco minutos, além de encerramento opcional. A demo salva essa programação apenas no navegador: não agenda nem envia ocorrências. A lista mostra dias, horário e data de encerramento ou Sem encerramento; pontuais sem data mostram Sem prazo. Trocar o tipo limpa a data para não converter prazo em encerramento implicitamente. Os exemplos iniciais são semanais e têm programação fictícia. O estado antigo sem frequência é tratado como pontual, preservando o prazo existente.

## Plano do agente na demo

O antigo `DemoActionPointPlan` não aparece mais nessa aba: o app atual mostra teste de envio e histórico de acompanhamento por Action Point. A demo preserva o código do plano apenas para compatibilidade de estados antigos, mas a interface exibe somente um marcador de envio simulado, sem conversa ou medição fictícia.

## Motores de IA do superadmin fictício

`/demo/admin/motores-de-ia` usa `DemoAiEngines` para cadastrar vários modelos por provedor (Anthropic, OpenAI e Google) e escolher um modelo disponível para cada etapa do agente de Action Points: planejamento, conversa e classificação. A mesma instância pode servir em mais de uma etapa. Pausar ou remover um modelo limpa suas atribuições. O estado fica apenas no navegador; não há campo de chave, teste de conexão, chamada de modelo nem efeito nos planos e ciclos fictícios. A sidebar compartilhada recebe `demoMode` para resolver este item na apresentação; o superadmin real abre `/admin/motores-de-ia` com conexões próprias.
