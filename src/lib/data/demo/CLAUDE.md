# Ambiente de demonstração

`demo-admin-data.ts` define a empresa e a especialista fictícias do superadmin. `demo-request.ts` atende apenas as ações administrativas listadas; qualquer outra operação continua recusada. Estado de especialistas e exclusão fictícia da empresa ficam em `demo-state.ts` e são reiniciados com a apresentação.

Fonte pura e determinística exclusiva de `/demo`. Usa empresa e pessoas fictícias, sem sessão, Supabase, modelos de IA, e-mail ou Slack. Reutiliza contratos e cálculos do produto. Datas do cenário são fixas, não vencem conforme o dia da apresentação.

`demo-data.ts` mantém o cenário único: pesquisas, relatório editorial, ativos, responsáveis e roteiro do agente. `demo-state.ts` valida o estado local versionado e concentra as transições. Alterações só persistem no navegador e podem ser reiniciadas. Perguntas sem conteúdo correspondente recebem recusa; consulta não comprova rotina.

`uploadedDocuments` guarda apenas os metadados dos arquivos enviados na apresentação. Os bytes ficam no IndexedDB por ID, acessados exclusivamente pelo runtime da demo. `demoFolders` combina categorias, ativos editoriais e arquivos enviados para alimentar a sidebar do cliente.

O pacote online é montado por `scripts/demo/prepare.mjs`: inclui somente rotas `/demo`, componentes e suas dependências transitivas, sem APIs operacionais, autenticação, `.env`, credenciais ou conexões. Não usar esta experiência como evidência de homologação do produto real.

demo-workspaces.ts produz os DTOs dos componentes reais, validados pelos mesmos schemas. demo-routes.ts traduz URLs sem mudar a navegação original, incluindo a sidebar fictícia de superadmin sob `/demo/admin` e as abas da Vertex Logistics no mesmo contexto administrativo. demo-request.ts é uma lista fechada de transições locais de pesquisas, categorias, ativos, perfil e setores; não usa fetch. Formulário valida conjunto completo e único de 24 respostas e evita duplicação por token. IDs desconhecidos e endereços externos são recusados.

Na criação/edição de pesquisas, a demo associa automaticamente lideranças ativas do estado local. Sem setores, gera um link fictício geral de Time, sem consultar Slack ou produção.

## Edição e operação administrativas

demo-admin-assets.ts adapta os documentos fictícios para os contratos administrativos, com IDs UUID estáveis próprios e revisão de conflito. A publicação mantém conteúdo anterior até publicar; arquivar retira a leitura, restaurar conserva a identidade original. Metadados em lote preservam versões; exclusão recusa vínculos com rotinas. demo-admin-routines.ts monta acordos, diretório e eventos locais, conservando revisões e versões históricas. demo-state.ts guarda somente estado validado opcional para compatibilidade com apresentações anteriores. Reiniciar remove as alterações.

O adapter de requisições atende apenas a empresa fictícia; IDs externos são recusados. As entregas e revisões administrativas são locais. Revisão de ciclos, envios por evento e reindexação externa sem simulação recebem erro explícito. A preparação do pacote continua recusando imports de serviços; domínio puro da entrega fica em admin-delivery-domain.ts.

As entregas administrativas sem edição local começam em análise, com relatório editorial vazio e gráficos da coleta disponíveis no editor. O relatório fictício publicado na visão do cliente permanece um cenário separado da redação administrativa.

`adminActionPoints` aceita prazo/encerramento ISO date ou null e frequência diária, semanal, quinzenal ou mensal, ou null para pontuais. Campos ausentes recebem null para restaurar registros antigos sem reiniciar o restante da demo. Não há horário, agenda ou integração; a frequência descreve apenas a execução esperada.

`adminFollowUpPlans` conserva planos de acompanhamento por Action Point e versão. `demo-action-point-follow-up.ts` monta uma proposta fictícia com diagnóstico e texto da versão publicada do ativo, simula ciclos determinísticos e soma contagens. A proposta é editável antes da aprovação; um plano ativo mantém os ciclos da sua versão. Nenhuma classificação da demo deve ser apresentada como avaliação real de uma resposta ou prova de execução.

`adminAiEngines` e `adminAiAssignments` guardam o catálogo e a escolha de modelo por etapa apenas na demo. `demo-ai-engines.ts` define os três provedores exibidos e limpa atribuições quando um modelo é pausado ou removido. Identificadores de modelo são texto ilustrativo, sem credenciais ou transporte externo. O app operacional mantém sua configuração de provedores por ambiente; esta tela não a altera.
