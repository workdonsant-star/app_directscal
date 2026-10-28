# Ambiente para apresentações

Link principal: https://app.directscal.com/demo. Origem independente: https://directscal-demo.vercel.app/demo. Projeto Vercel dedicado directscal-demo. Dados fictícios da Vertex Logistics, estado local reiniciável e nenhuma credencial operacional.

## Fidelidade ao produto

A primeira entrega recriou uma sidebar e algumas telas, gerando divergências. A correção remove essas versões e usa AppSidebar, NavUser, AppTopbar, AppPage e os componentes originais das áreas. A versão operacional consultada usa o commit 7a4854a, deployment dpl_5oK6jQy5wVeR3bGVx97Bi1NXnhUd.

A sidebar conserva os ícones, grupos, perfil, pastas e seis dimensões do produto. Configurações troca a navegação pelas seções contextuais originais. Não há mistura da administração DirectScal na sidebar do cliente. Um controle Demo na topbar oferece reinício e acesso ao agente.

## Conteúdo e operações

- Analytics com duas coletas, seis dimensões, três camadas, filtro e indicadores de uso.
- Pesquisas com o workspace original, criação, ativação, encerramento, exclusão e links de respondentes. Formulário original com 24 afirmações, sem identificação pessoal.
- Relatórios de julho/outubro com cards, sumário, contato fictício, editorial correspondente, PDF e CSV.
- Action Points por liderança e detalhes, com fonte de coleta e PDF do cenário.
- Dez ativos nos quatro tipos: categorias, busca, quadro/tabela, leitura, edição e movimentação local em lote.
- Criação, renomeação, ordenação, ícones e exclusão de categorias com redistribuição dos documentos.
- Agente com compositor, fontes, feedback e histórico do produto; resposta determinística ao acervo fictício.
- Configurações e perfil com formulários originais sobre dados fictícios. Slack mostra estado ilustrativo, sem conexão real.

## Roteiro

1. Analytics: filtrar a coleta de outubro.
2. Diagnósticos: abrir relatório e baixar PDF.
3. Action Points: expandir uma liderança e abrir uma rotina.
4. Pasta de ativos: buscar, ler e editar um documento; trocar quadro/tabela.
5. Demo → Agente: perguntar “Como funciona a comunicação?” e abrir a fonte.
6. Pesquisas: criar uma coleta e copiar um link; abrir esse link e responder.
7. Configurações: conferir setores, empresa e Slack.
8. Demo → Reiniciar demo antes da apresentação seguinte.

## Dados e limites

O provider AppRuntime altera apenas URLs, fonte de requisições e saída. Componentes sem provider continuam com os caminhos e fetch operacionais. O adapter local tem lista fechada; não repassa chamadas desconhecidas. Não há banco, e-mail, OAuth, modelo de IA ou mensagens reais do Slack.

Estado em directscal:presentation:v1, no navegador. Recarregar preserva; reiniciar restaura o cenário e remove apenas os marcadores de resposta dos tokens fictícios enviados. Coletas históricas permanecem fixas; respostas da coleta aberta não alteram relatórios encerrados. Downloads dos ativos exportam o catálogo inicial; edições locais podem ser apresentadas na leitura, sem substituir a fixture do arquivo.

Esta demo cobre apresentação da interface de cliente. Não comprova homologação dos serviços operacionais nem oferece a administração global.

## Distribuição

Executar node scripts/demo/prepare.mjs /private/tmp/directscal-demo-<id> com destino novo. O script copia somente /demo e dependências transitivas, tokens e assets explícitos; rejeita imports de autenticação, banco, IA, integrações e fontes operacionais. Não copia .env, .git ou .vercel. Gera manifesto com commit e indicador de alterações locais. Instalar/buildar o pacote, vinculá-lo explicitamente ao projeto dedicado e publicar. Não publicar o repositório integral no projeto demo.

## Verificação desta correção

Build principal e independente aprovados; o pacote isolado lista somente raiz, 404, catch-all demo e os três downloads. TypeScript, lint e 517 testes (89 arquivos) passaram, incluindo nove da demo.

Navegador: sidebar e relatórios publicados em claro/escuro, pastas e leitor de ativos, edição de resumo e nova versão local, sidebar contextual de Configurações, compositor do agente com fonte. Formulário original em 375px, 24 respostas enviadas, confirmação Obrigado e contagem 12→13 verificadas. Não foi executada a suíte E2E geral do app operacional.

Deployment dpl_iUBaHgCTZofKqpG8mayzzda58eWL READY, alvo production do projeto dedicado; build remoto 1m14s. Alias público permaneceu directscal-demo.vercel.app. Aba do usuário recarregada com a nova interface; nenhum erro de console capturado. Checagem HTTP: 20 páginas/arquivos retornaram 200, incluindo seis dimensões, os dois PDFs válidos, CSV e Markdown; quatro URLs de APIs/IDs desconhecidos retornaram 404. O app operacional não foi publicado nesta correção.

Registro no Notion: https://app.notion.com/p/3ff026c1ddec81a6a518c487d3f651f6.


## Repositório e montagem no domínio principal

Código isolado em https://github.com/workdonsant-star/demo_directscal, branch main, commit inicial 0262d49. Projeto Vercel directscal-demo conectado ao repositório. Não há .env ou credenciais no pacote. O aplicativo operacional permanece no projeto app-directscal.

assetPrefix /demo-static separa JavaScript, CSS e fontes. Logos, ícones e avatares públicos também usam /demo-static. Duas regras de projeto na Vercel encaminham somente ^/demo(/.*)?$ e ^/demo-static(/.*)?$ para o mesmo caminho na origem da demo. Destinos usam captura $1; a forma :path* em destination acrescentava um asterisco literal no teste em staging. Cookies e Authorization são removidos nessas duas regras. Nenhuma rota raiz, autenticação ou API operacional é substituída.

O bloco do especialista na demo usa somente nome, cargo e link textual de contato. Avatar, cidade, fundo de card e CTA destacado foram removidos apenas na opção compact da apresentação. Conferido nos temas claro/escuro em desktop e 375px. Componentes operacionais mantêm o padrão completo.

Publicação do repositório: dpl_9rc3NJTSu75DYHUyerWxX8dggf5o READY. As duas regras foram publicadas após teste em staging: relatório, /demo, logo SVG e JavaScript retornaram 200, enquanto /entrar continuou operacional. O endereço final foi verificado no navegador em app.directscal.com/demo/relatorios/analytics-example-1. Requisições Python diretas ao domínio principal são bloqueadas pela camada Cloudflare com 1010; essa configuração não foi alterada. A prova do endereço final é de navegador, separada dos testes HTTP em staging.
