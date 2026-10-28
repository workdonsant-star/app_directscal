# Apresentação com os componentes do produto

`DemoShell` compõe os mesmos AppSidebar, NavUser, SidebarProvider e SidebarInset do layout autenticado. Não manter uma segunda sidebar, topbar, chat, biblioteca ou tabela. As telas usam DiagnosticsWorkspace, ManagementAssetsLibrary, ManagementAssetEditableReader, AiChatWorkspace, DimensionInsightWorkspace, ReportWorkspace e os formulários de Configurações/Perfil do produto.

`AppRuntimeProvider` injeta somente resolução de URLs, pathname canônico e adapter local de requisições. Fora do provider, os componentes preservam URLs e fetch operacionais. O runtime da demo é estável para não reiniciar efeitos de formulário a cada atualização do estado. Qualquer operação não implementada retorna erro local; nunca encaminhar ao backend.

`demo-store.ts` mantém estado validado por Zod em uma chave própria. Reiniciar também limpa os marcadores de resposta dos tokens fictícios enviados, sem tocar dados de outros fluxos. Navegação e downloads ficam em /demo. O menu Demo, discreto na topbar, reúne reinício e atalho do agente; não introduzir itens próprios na sidebar do cliente.

Os dados continuam fictícios e locais. Nenhum transporte Slack, e-mail, modelo de IA ou autenticação é chamado. Formulário público usa a superfície de respondente, fora do shell autenticado.
