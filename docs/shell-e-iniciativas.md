# Interface Symbach — 03/10/2026

## Navegação vigente — 06/10/2026

Por decisão do usuário, a seção Iniciativas não aparece na sidebar, incluindo a lista e o botão de criação. O componente foi removido de AppSidebar; registros locais existentes permanecem preservados. A seção Dimensões reúne Cultura, Visão, Comunicação, Processos, Liderança e Performance com os mesmos links e ícones existentes; Análises e relatórios e Contratos foram removidos da sidebar. Relatórios passa ao grupo principal com o nome Diagnósticos, mantendo /relatorios. Agente sai da sidebar, mantendo /assistente disponível por URL. As demais seções descrevem o histórico da implementação.

## Referência e preservação

A interface foi portada do código local de Symbach Os para a branch symbach de app_directscal. O documento de origem identifica o frame 242:267 do Figma; esta entrega usou o código fornecido, sem nova leitura do Figma.

Ponto de retorno: tag antes-symbach-2026-10-03, commit 2328704, na branch codex/preservacao-2026-10-03. As duas branches e a tag estão no GitHub.

## Primeiro ajuste — shell e iniciativas

Sidebar de 256px expandida a partir de 1280px, compacta abaixo disso e drawer abaixo de 768px. Topbar de 56px e sidebar compartilham surface-shell, conteúdo com raio de 20px e avatar circular. Tokens definidos nos dois temas.

Analytics, Pesquisas, Agente e Action Points preservam as rotas existentes. Análises e relatórios agrupa dimensões e documentos. Iniciativas oferece lista, busca, criação e edição, com os quatro registros iniciais da referência. Persistência no navegador, versionada e escopada por usuário e organização, sem colaboração entre contas ou gravação no servidor.

TypeScript, lint e build passaram. Chromium com sessão fictícia local verificou claro/escuro em 1440px, menus expansíveis, criação/edição e recarga, busca sem resultado, isolamento entre contas, sidebar compacta em 1024px, drawer e navegação em 375px. O servidor local foi reiniciado porque estava servindo o CSS anterior.

## Segundo ajuste — ativos por categoria

Ativos de gestão é a única seção de navegação dos ativos. Bibliotecas por tipo foi retirada da sidebar. Cada categoria reúne SOPs, Playbooks, documentos de Governança e matrizes RACI, com o tipo identificado no card. A classificação usa a categoria cadastrada, normalizada por acentos, caixa e espaços; o tipo não força inclusão em Governança.

As quatro categorias principais são Gestão de pessoas, Governança, Cultura e Comunicação. Outras categorias dos ativos publicados aparecem automaticamente; Sem categoria conserva os ativos não classificados. A raiz mostra pastas e contagens. Categorias adicionais usam categorias/[categoria]. A leitura retorna à pasta pelo breadcrumb; RACI reutiliza a leitura RichText existente, incluindo tabelas.

Os dados continuam limitados às organizações da sessão, versões publicadas vigentes e ativos não arquivados. A memoização é por request, com userId explícito. Autenticação e regras editoriais existentes não mudaram; sem migração ou escrita no banco.

Validação: quatro testes unitários passaram, cobrindo tipos mistos por categoria, normalização, categorias adicionais/sem categoria e destino RACI. TypeScript e lint passaram. Chromium verificou o índice de pastas, ausência de Bibliotecas na navegação, acesso às categorias, claro/escuro em desktop, navegação móvel, categoria desconhecida com 404 e restrição de superadmin. Sem erros de JavaScript ou overflow móvel. Build de produção passou.

## Limites e registro

Os testes de navegador usam sessão fictícia e dados vazios; não confirmam classificação ou documentos reais de produção. Alterações locais na branch symbach, sem deploy.

Registro no Notion: https://app.notion.com/p/3ee026c1ddec81cea86fc7cc73cda7e5.

## Analytics — Figma 252:545 (04/10/2026)

A nova referência foi lida integralmente no Figma. Na branch symbach, o switcher passa a usar header de 72px, botão de 48px, avatar de 32px, nome em 14px e empresa em 10px. A topbar mantém 56px e alinha seu conteúdo ao AppPage: 40px de recuo horizontal no desktop e 32px de recuo vertical no corpo.

Aderência dos ativos de gestão aparece primeiro, com KPIs em linha e os dois charts de 490px. O chart semanal tem 360px. Resultado de coletas vem abaixo, com três KPIs em linha e Alavancas prioritárias / Dimensões por camadas / Dimensões gerenciais: cards de 490px, SVGs de 389px e intervalos de 16px. O filtro aparece na topbar e no cabeçalho dos resultados com IDs próprios e a mesma query string. A aderência continua independente do diagnóstico.

Os visuais adicionais saem apenas da apresentação principal; o workspace admin preserva a apresentação distilled. Dados, cálculos de maturidade, permissões e navegação existente foram preservados. A escala visual das perguntas semanais reserva espaço acima da maior barra para o valor. Sem dependência nova, migração, escrita no banco ou deploy. A porta 3001 pertence ao checkout da versão anterior e não foi alterada nesta entrega.

Validação desta entrega: TypeScript, lint completo e diff-check passaram. Chromium verificou os componentes com dados fictícios nos temas claro/escuro a 1920px, e responsividade a 1440px, 1024px e 375px; sem cortes de conteúdo nos cards, overflow horizontal ou erros de JavaScript. Medidas computadas: AppPage 32/40/32/40px, topbar 56px, header do switcher 72px, cards analíticos 490px e SVGs 389px. Filtros testados nos dois sentidos (seção → topbar e topbar → seção) e menu de usuário preservado. A rota temporária de verificação foi removida. A sessão demo redireciona /omdx para /docs pelo gate existente de module_omdx; dados reais, permissões de produção e operações externas não foram validados nem alterados. Registro na página existente de Shell e iniciativas no Notion.
