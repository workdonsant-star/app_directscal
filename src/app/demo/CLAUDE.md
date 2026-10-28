# /demo — Apresentação pública

Layout público com dados fictícios e os mesmos componentes do app autenticado. A base visual foi conferida com o commit 7a4854a, implantado no produto durante esta correção. Mudanças no produto devem ser reaproveitadas nos componentes, sem recriar navegação ou telas.

O catch-all resolve Analytics, Pesquisas, seis Dimensões, Relatórios, Action Points, categorias, leitura/edição de ativos, agente, Configurações, Perfil e formulário público. Rotas desconhecidas retornam 404. AppRuntimeProvider adapta caminhos e operações para a fonte local, sem chamar APIs reais.

Downloads PDF de relatório e Action Points e CSV aceitam apenas coletas do catálogo fictício. Markdown aceita apenas ativos fictícios. Não conectar estas rotas a dados, sessão ou credenciais reais. Metadata impede indexação.

Distribuição em projeto Vercel dedicado por scripts/demo/prepare.mjs, sem .env, autenticação, serviços operacionais ou outras rotas. Ver docs/ambiente-demo.md.

O contato do especialista no relatório usa a opção compact: nome, cargo e link discreto, sem avatar, cidade ou superfície de card, conforme ajuste solicitado para a demo.

O download de relatório reutiliza o modelo editorial A4 do produto; `conteudo=dados` mantém o PDF detalhado anterior e `formato=csv` mantém o CSV. Todos continuam restritos às fixtures do catálogo demo. Fontes/capa são empacotadas localmente, sem serviço externo.

Action Points usa ActionPointsDownload nas actions da AppTopbar, com o diagnosticId do board fictício. A abertura não repete o download nem oferece Voltar ao relatório.
