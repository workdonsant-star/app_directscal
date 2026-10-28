# Ambiente de demonstração

Fonte pura e determinística exclusiva de `/demo`. Usa empresa e pessoas fictícias, sem sessão, Supabase, modelos de IA, e-mail ou Slack. Reutiliza contratos e cálculos do produto. Datas do cenário são fixas, não vencem conforme o dia da apresentação.

`demo-data.ts` mantém o cenário único: pesquisas, relatório editorial, ativos, responsáveis e roteiro do agente. `demo-state.ts` valida o estado local versionado e concentra as transições. Alterações só persistem no navegador e podem ser reiniciadas. Perguntas sem conteúdo correspondente recebem recusa; consulta não comprova rotina.

O pacote online é montado por `scripts/demo/prepare.mjs`: inclui somente rotas `/demo`, componentes e suas dependências transitivas, sem APIs operacionais, autenticação, `.env`, credenciais ou conexões. Não usar esta experiência como evidência de homologação do produto real.

demo-workspaces.ts produz os DTOs dos componentes reais, validados pelos mesmos schemas. demo-routes.ts traduz URLs sem mudar a navegação original. demo-request.ts é uma lista fechada de transições locais de pesquisas, categorias, ativos, perfil e setores; não usa fetch. Formulário valida conjunto completo e único de 24 respostas e evita duplicação por token. IDs desconhecidos e endereços externos são recusados.
