# /demo — Apresentação pública

Layout público com dados fictícios e os mesmos componentes do app autenticado. A base visual foi conferida com o commit 7a4854a, implantado no produto durante esta correção. Mudanças no produto devem ser reaproveitadas nos componentes, sem recriar navegação ou telas.

O shell de demonstração também usa o frame Figma `318:2`: topbar e conteúdo ficam na mesma superfície arredondada, com fundo `bg-background`. O recuo externo preserva a sidebar visível no desktop e vira 12px no mobile; rotas públicas do respondente continuam fora desse shell.

`demo-portraits.css` ancora no topo o recorte circular dos cinco retratos verticais locais para manter o rosto visível. O seletor fica restrito a `/demo/avatars/` e funciona também no namespace `/demo-static/demo/avatars/` do pacote isolado.

O catch-all resolve Analytics, Pesquisas, seis Dimensões, Relatórios, Action Points, categorias, leitura/edição de ativos, agente, Configurações, Perfil, visão fictícia de superadmin em `/demo/admin` e formulário público. Rotas desconhecidas retornam 404. AppRuntimeProvider adapta caminhos e operações para a fonte local, sem chamar APIs reais.

O menu Demo alterna entre cliente e superadmin. A visão administrativa reutiliza AppSidebar com as entradas Empresas cadastradas e Especialistas; a central mostra destinos administrativos, e empresas/especialistas reutilizam os componentes operacionais com fixtures locais. O detalhe de Vertex Logistics reutiliza as abas e o Analytics da empresa. Ativos de gestão e Rotinas mantêm rotas da empresa sob `/demo/admin/empresas/demo-vertex/`; a lista administrativa de ativos abre documentos na mesma área. Nenhum link da sidebar deve sair de `/demo`.

`/demo/admin/motores-de-ia` é uma área exclusiva do superadmin fictício para cadastrar modelos de Anthropic, OpenAI e Google e atribuí-los às três etapas do agente de Action Points. O catálogo e o roteamento são locais, sem segredos nem conexão externa; a sidebar do produto não recebe essa entrada.

A Visão geral da Vertex mostra somente os dados analíticos. Na aba `Arquivos`, a raiz mostra pastas e os botões `Nova pasta` e `Novo arquivo` abrem modais do componente do produto com adapter local. Os ativos editoriais existentes ficam dentro das pastas. Arquivos enviados aparecem em `/demo/ativos-de-gestao/categorias/[categoria]` e PDFs de relatório em `/demo/relatorios`; downloads leem IndexedDB. Nenhum upload alcança Supabase ou a API operacional.

O cabeçalho da empresa e a aba Arquivos evitam subtítulos explicativos. O Analytics da visão administrativa usa textos concisos; os dados e títulos permanecem visíveis.

Nas páginas administrativas da Vertex Logistics, o breadcrumb termina em `Empresas / Vertex Logistics`. A seção atual aparece nas abas ou no título do conteúdo.

Na entrega administrativa da demo, a rota `/dados` abre `/relatorio`. A escrita do relatório apresenta apenas gráficos, campos de análise e salvamento do rascunho, sem o shell de etapas.

Downloads PDF de relatório e Action Points e CSV aceitam apenas coletas do catálogo fictício. Markdown aceita apenas ativos fictícios. Não conectar estas rotas a dados, sessão ou credenciais reais. Metadata impede indexação.

Diagnósticos da demo lista PDFs enviados pelo superadmin fictício. O envio usa o formulário compartilhado da empresa e armazena bytes localmente; não existe PDF estático de um cliente embutido no pacote.

Distribuição em projeto Vercel dedicado por scripts/demo/prepare.mjs, sem .env, autenticação, serviços operacionais ou outras rotas. Ver docs/ambiente-demo.md.

O contato do especialista no relatório usa a opção compact: nome, cargo e link discreto, sem avatar, cidade ou superfície de card, conforme ajuste solicitado para a demo.

O download de relatório reutiliza o modelo editorial A4 do produto; `conteudo=dados` mantém o PDF detalhado anterior e `formato=csv` mantém o CSV. Todos continuam restritos às fixtures do catálogo demo. Fontes/capa são empacotadas localmente, sem serviço externo.

Action Points usa ActionPointsDownload nas actions da AppTopbar, com o diagnosticId do board fictício. A abertura não repete o download nem oferece Voltar ao relatório.

## Rotas administrativas completas

Na aba administrativa Action points da Vertex, `Configurar agente` abre a proposta de plano, revisão e ativação iniciais e os ciclos simulados locais. A aprovação acontece uma vez; não existe revisão por ciclo. A simulação não chama IA, Slack ou APIs e não atualiza indicadores operacionais.

A empresa fictícia abre /demo/admin/empresas/demo-vertex/criacao-dos-ativos, seu editor /[assetId], /perguntas e /rotinas. /demo/admin/entregas/[id] resolve Dados por padrão e permite dados, relatorio, action-points, ativos (lista/editor/perguntas) e publicar. /demo/admin/guia reutiliza o guia de operação com URLs adaptadas. O catch-all não redireciona esses destinos para a biblioteca ou os relatórios do cliente.
