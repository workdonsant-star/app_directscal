# `src/lib/data` — Fonte de dados e regras

Esta pasta é a fronteira entre UI e dados. O core de Maturidade lê Supabase no servidor; superadmin e aquisição também usam Supabase via Route Handlers server-side. Perfil e Configurações compartilham a leitura server-side de identidade, organização e aquisição; as edições de nome e avatar do Perfil persistem em account_profiles.

## Regras

- Páginas e componentes devem importar dados daqui, não de `mock-data.ts`.
- Leituras Maturidade que falam com Supabase são assíncronas e server-side.
- Leituras Maturidade nunca expandem `superadmin` para todas as organizações. Esse papel não possui escopo de cliente; dados administrativos são resolvidos pelas fontes e APIs de `admin`.
- Client Components devem importar apenas helpers puros de `omdx-domain.ts`, nunca a data-source Supabase.
- Regras como base mínima de Fundador para análise, trava local de resposta e validação de conjunto completo de respostas devem ficar em funções puras testáveis.
- Cálculos agregados e helpers de domínio ficam aqui ou em contratos/mappers, não nos componentes.
- Relatórios PDF devem consumir DTOs consolidados daqui, como `getDiagnosticReport()` e `getDiagnosticActionPlan()`, sem acessar mocks ou recalcular dados dentro do documento.
- `omdx-native-report-charts.ts` transforma um `DiagnosticReport` consolidado nos datasets dos seis gráficos da leitura nativa; componentes aplicam somente apresentação e tokens visuais.
- `action-plan-gantt.ts` converte a seleção publicada da entrega (`AdminDeliveryPublication` + catálogo `adminActionPointTemplates`) em tarefas (`GanttTask`) para a página `/action-points`. Texto, responsável, prazo, impacto e indicador vêm do catálogo; nota e gap vêm do `DiagnosticActionPlan`; o motivo prioriza a leitura do especialista (`dimensionReadings`). Janelas de datas iniciais ancoradas em `publishedAt` (o Superadmin da empresa pode sobrescrevê-las em `action_point_assignments`) (Alta na publicação, Média +7 dias, Baixa +14 dias, duração pelo prazo do catálogo). Ids fora do catálogo são ignorados. Determinístico, sem API de IA.
- `published-action-points.ts` (server-only) escolhe, entre os diagnósticos autorizados da sessão, a entrega publicada mais recente com ações selecionadas e monta a lista do cliente. Não há fallback para as ações geradas automaticamente do plano (que continuam alimentando o PDF de plano de ação).
- `omdx-data-source.ts` pode usar `cache()` do React apenas para memoização por request de sessão, autorização, modelo Maturidade e bundles derivados. Não use `unstable_cache`, `use cache`, CDN cache ou cache global/persistente para sessão, organizações, diagnósticos, respostas, tokens, cookies, JWT ou resultados obtidos com service role.
- Helpers memoizados que dependem de usuário devem receber `userId` explicitamente. Não dependa de variável global mutável para decidir escopo de organização ou acesso.
- `admin-data-source.ts` concentra helpers puros, seeds estáticos de módulos e derivação de empresas/módulos.
- `admin-delivery-workspace-data.ts` carrega, com `cache` do React, o contexto compartilhado do layout e das etapas de `/admin/entregas/[id]` (relatório real, publicação, análise, empresa e especialistas).
- `admin-operations-data-source.ts` conserva seeds legados e helpers de análise/action points. Especialistas em uso são lidos e escritos por person-profiles-data-source.ts no Supabase; os seeds não governam o cadastro compartilhado.
- `management-assets-data-source.ts` (server-only) lê bibliotecas e leitura individual no Supabase, filtrando pelas organizações da sessão de cliente, por `status = publicado`, `archived_at` nulo e pela versão vigente.
- A autoria publicada inclui `avatarUrl` do especialista associado. Don Santos usa a foto local já disponível nos relatórios; os demais preservam iniciais enquanto não tiverem imagem no cadastro estático. Nome e foto dos especialistas vêm de specialists e são compartilhados com os ativos publicados.
- `management-assets-admin-data-source.ts` (server-only, superadmin) cria ativos a partir de modelos, salva metadados e rascunho, aplica as transições editoriais e publica via `app_private.publish_management_asset_version`. Uma versão publicada é imutável; editar abre uma nova versão em rascunho, e só existe um rascunho aberto por ativo.
- `management-asset-templates.ts` guarda os modelos de partida (estruturas vazias por tipo e SOPs de referência). Modelos viram rascunho; nada é publicado automaticamente.
- `management-asset-routes.ts` é puro e resolve os caminhos das bibliotecas e da leitura individual por tipo.
- `rich-text.ts` é puro: sumário com âncoras únicas, texto plano, divisão em seções H2/H3 e conversão do formato legado em blocos.
- `process-usage-analytics.ts` é puro e calcula os indicadores de uso dos processos: Adoção (pessoas distintas que perguntaram ÷ lideranças ativas + time aprovado, limitada a 100%), Cobertura (respondidas com fonte ÷ respondidas + sem evidência; falhas técnicas ficam fora), Utilidade (úteis ÷ avaliadas), 8 semanas móveis e top 6 processos citados. Compara os últimos 30 dias com os 30 anteriores em pontos percentuais. `process-usage-data-source.ts` (server-only) busca as perguntas da organização principal da sessão e delega o cálculo.
- `management-asset-indexer.ts` é puro e transforma o documento em trechos determinísticos por seção (`H2 › H3`), incluindo listas e tabelas. A publicação grava esses trechos com embeddings opcionais.
- `acquisition-data-source.ts` é server-side e fala com Supabase para campanhas, leads, empresas, intents OAuth e credenciais de senha.
- `company-registry-data-source.ts` valida o CNPJ, consulta a API Minha Receita somente no servidor e normaliza razão social e dados cadastrais. A interface antecipa a consulta, mas a criação da conta repete a validação antes de persistir organização e lead.
- `profile-data-source.ts` resolve a organização vinculada e o lead `account_created` da empresa, mapeia identidade e posição para `/perfil` e os dados oficiais/onboarding para `/configuracoes`. O nome fantasia alimenta a sidebar, com fallback para o nome oficial; caixa alta integral é corrigida apenas na apresentação. Escritas empresariais exigem membership `cliente` e filtram pela organização; o `admin` convidado só atualiza sua própria posição em `organization_people`.
- `operational-onboarding-data-source.ts` concentra o cadastro operacional: domínio autorizado, link público, lista de pessoas cadastradas, exclusão autenticada, critério mínimo de pessoa aprovada e bloqueio antes da ativação do diagnóstico.
- `organization-structure-data-source.ts` concentra setores, lideranças e convites. Criação e aceite usam funções transacionais no schema `app_private`; o token bruto existe apenas no link/cookie curto e o banco guarda somente SHA-256. O aceite exige o mesmo e-mail, copia nome/foto de `next_auth.users` e cria membership `cliente` ou `admin`, preservando papéis mais privilegiados já existentes. Falhas do provedor não apagam o cadastro: ficam registradas para reenvio.
- `omdx-data-source.ts` deriva a visibilidade por criador e atribuição setorial. `cliente` recebe todos os diagnósticos; `admin` recebe os próprios e os atribuídos. Links de Time são filtrados pelos setores atribuídos, enquanto o link de Fundador permanece exclusivo de `cliente`.
- A ativação de diagnóstico chama `app_private.activate_diagnostic_with_links`, que cria os links e muda o status na mesma transação. A seleção de lideranças de um rascunho usa `app_private.sync_diagnostic_leaders`.
- Em aquisição Google, o e-mail OAuth autenticado é a fonte canônica; valide que `userId` e e-mail pertencem à mesma linha em `next_auth.users` e não crie nova conta quando o e-mail já tem acesso ativo.

## Fluxo público de resposta

`getDiagnosticByResponseToken()` resolve token real de `diagnostic_share_links`, retorna diagnóstico, grupo, escala e perguntas agrupadas por dimensão para `/r/[token]`.

- A página pública não fala direto com Supabase; envio passa por `/api/omdx/responses`.
- A API valida token, coleta ativa, trava por navegador e se o payload contém exatamente as perguntas do template.
- A resposta pública é anônima: não coleta nome, e-mail ou cargo. A trava leve do navegador usa `getResponseStorageKey()` no client e `getResponseCookieName()` no route handler.

## Cálculos dos Insights por dimensão

`getDimensionQuestionResults()` expõe os resultados por pergunta para `/insights/[dimensao]`, usando respostas reais em `response_sessions` + `likert_answers`.

- O filtro `todos` agrega ocorrências por `dimensionId + text`, porque os ids das perguntas incluem o diagnóstico.
- O filtro por diagnóstico retorna apenas as perguntas daquele diagnóstico.
- `score` é a média dos scores das ocorrências consideradas.
- `layerScores` preserva, por pergunta, as médias de Fundador/Diretoria, Liderança e Operação/Time; camadas sem respostas permanecem `null`.
- `gap` é a diferença entre a maior e a menor dessas médias de camada com base disponível; quando apenas uma camada respondeu, o gap fica `null`.
- `responses` é a soma das respostas das ocorrências consideradas.
- `priorityIndex` é `round((((5 - score) + (gap ?? 0)) / 5) * 100)`, limitado entre `0` e `100`.
- A classificação textual de score vem de `classifyScore()`: `<= 2.0` Crítico, `<= 3.0` Inconsistente, `<= 4.0` Atenção, acima de `4.0` Consistente.

## Exportação CSV de relatório

`buildDiagnosticReportCsv()` transforma um `DiagnosticReport` já consolidado em CSV para `/omdx/[id]/relatorio?formato=csv`.

- O helper é puro, não consulta Supabase e não altera a regra de disponibilidade do relatório.
- O CSV usa UTF-8 com BOM, separador `;` e uma estrutura longa com `secao = resumo | dimensao | pergunta`.
- As perguntas exportadas são agregados do relatório consolidado, não respostas individuais por respondente.

## Cálculos do Overview Maturidade

`omdx-overview-analytics.ts` consolida os cards executivos do Overview e os dados dos gráficos. Os cards usam índices normalizados em escala `0-100`; os valores Likert originais continuam como base de cálculo e entram no `technicalDetail` quando útil.

O mesmo arquivo produz `layerScores`, `layerSummary` e `dimensionSummary` para o dashboard principal em `/omdx`. As pontuações por camada são a média das seis dimensões em escala `1-5`, separadas entre Fundador, Liderança e Time; camadas sem respostas permanecem `null` e nunca recebem valor inventado. O resumo das dimensões compara os scores consolidados já presentes em `dimensions`, sem recalcular na UI.

`buildOmdxOverviewComparisonFromReports()` separa a leitura atual da referência histórica. Ordena por `closedAt` com fallback para `createdAt`; em `todos`, agrega todos os relatórios nos cards, barras e heatmaps, soma a base de respostas e mantém os charts sem referência histórica separada, mas inclui nos cards a variação do relatório mais recente contra o imediatamente anterior. Em um diagnóstico selecionado, usa apenas esse relatório como leitura principal e considera somente os relatórios anteriores a ele como referência. As duas leituras reutilizam `buildOmdxOverviewAnalyticsFromReports()` e preservam `null` para camadas sem base.

- `normalizeLikertToIndex(score)`: converte score Likert para índice com `round((score / 5) * 100)`, limitado entre `0` e `100`.
- `normalizeGapToIndex(gap)`: converte gap entre camadas para índice com `round((gap / 5) * 100)`, limitado entre `0` e `100`.
- `normalizeCriticality(rawCriticality)`: converte criticidade composta para índice com `round((rawCriticality / 16) * 100)`, limitado entre `0` e `100`.
- `Maturidade geral`: média das maturidades das dimensões, normalizada por `normalizeLikertToIndex()`. Maior é melhor.
- `Criticidade operacional`: média de `calculateDimensionCriticality()` por dimensão. A fórmula base é `5 - maturity + (gap ?? 0) + dispersion + criticalPercentage / 100`. Maior é pior; quando não há comparação entre camadas, o card executivo fica `Sem dados`.
- `Desalinhamento organizacional`: gap médio entre camadas com base, normalizado por `normalizeGapToIndex()`. Maior é pior; com apenas Fundador, fica `Sem dados`.
- `Consenso interno`: `round(100 - (averageDispersion / 5) * 100)`. Maior é melhor.

Faixas de classificação:

- Maturidade: `<= 40` Crítico, `<= 60` Inconsistente, `<= 80` Atenção, acima de `80` Consistente.
- Criticidade: `<= 25` Consistente, `<= 50` Atenção, `<= 75` Inconsistente, acima de `75` Crítico.
- Desalinhamento: `<= 10` Consistente, `<= 24` Atenção, `<= 50` Inconsistente, acima de `50` Crítico.
- Consenso: `>= 80` Consistente, `>= 60` Atenção, `>= 40` Inconsistente, abaixo de `40` Crítico.

- Produção de ativos na instância: `getAdminManagementAssetCompany()` resolve `company_<organizationId>`; listagens de ativos e auditorias recebem organizationId e filtram no banco antes de retornar resultados. Rotas editoriais conferem se o ativo pertence à empresa da URL.

## Pastas dos ativos de gestão

`management-asset-categories.ts` normaliza categorias, resolve pastas e conta ativos sem inferir área a partir do tipo. Conserva categorias adicionais e Sem categoria. `getPublishedManagementAssets()` lê todos os tipos publicados das organizações da sessão; a memoização React é somente por request e recebe userId explicitamente. O layout e a página compartilham essa leitura. Os links por tipo permanecem para leitura e compatibilidade.

## Exportação Markdown dos ativos

`management-asset-markdown.ts` converte o DTO publicado em Markdown UTF-8 com metadados, títulos, marcas, links, listas aninhadas, destaques e tabelas GFM. É puro, não consulta serviços nem altera dados. Usado pelo download autenticado dos quatro tipos.

## Ações administrativas em massa

`updateManagementAssetsInBulk` e `deleteManagementAssets` validam a seleção completa na empresa antes de escrever. Cada mutação filtra novamente organização e IDs e devolve apenas IDs efetivamente afetados. Edição recusa arquivados e altera apenas metadados enviados, sem tocar versões. Exclusão usa uma única instrução; FKs existentes removem versões, escopos e chunks em cascata. Referências históricas na auditoria do agente permanecem. Não há migração nova.

## Identidade compartilhada

person-profiles-data-source.ts lê account_profiles (prioritário) ou next_auth.users (inicial), persiste dados pessoais e resolve specialists. Fotos são raster base64 limitado a 1 milhão de caracteres ou referências HTTPS/caminhos locais. Não existe cache entre requests. Exclusão de especialista é lógica, conserva autorias e bloqueia novas atribuições; contagens usam admin_deliveries real.

## Execução dos action points

- `action-points-list.ts` (puro) junta a seleção publicada (`GanttTask[]`) às atribuições, marca atraso (prazo vencido e não concluído), define a cadência padrão por prioridade (Alta semanal; as demais quinzenal), traz o progresso e a última interação de cada ação (e a média e a mais recente por grupo) e agrupa por dimensão, responsável ou mês do prazo. Exporta também os rótulos de etapa e cadência e a formatação de datas sem deslocamento de fuso.
- `action-point-execution.ts` (puro): `planActionPointUpdate()` decide o que gravar e que registros de histórico gerar, sempre como frase de ação iniciada por verbo (atribuição, etapa, prazo, andamento, nota com detalhe); concluir fecha o progresso em 100% quando não há outro valor informado;, valida que o prazo não é anterior ao início e exige responsável antes de etapa, prazo ou cadência.
- `action-point-execution-data-source.ts` (server-only) lê e grava `action_point_assignments` e `action_point_events`, sempre filtrando pela empresa mesmo com service role.
- `published-action-points.ts` devolve a lista publicada e a empresa da entrega; é a fonte tanto da página quanto da validação do `PATCH`.

## Configuração inicial do cliente

`client-onboarding-data-source.ts` resolve a organização principal da sessão, lê conclusão privada e revalida Slack com escopos e todos os setores ativos (inclusive a contagem bruta para detectar setores sem liderança). `client-onboarding.ts` exige Slack válido, ao menos um setor e liderança Slack ativa em todos, sem exigir e-mail/cargo/convite. Setores antigos preservam o critério legado de convite enviado ou aceite. Conclusão é idempotente e durável por empresa; falhas não são tratadas como conclusão. O onboarding operacional público permanece independente.

## Lideranças do Slack

`slack-leadership-data-source.ts` consulta o diretório sem cache persistente, revalida `users.info` no token da empresa antes de gravar e hidrata nome/foto/cargo em cada leitura. Guarda apenas vínculo setor + team/user ID e eventual cargo ajustado em `app_private.organization_sector_slack_leaders`. Não insere `organization_people`, `next_auth.users`, membership ou convite. `getOrganizationStructure` junta referências novas e registros antigos. Diagnósticos preservam referências Slack em `diagnostic_slack_leader_assignments`; não concedem acesso ao painel. Falhas no Slack não liberam onboarding.

A decisão de entrada usa `requiresOnboarding`, derivada no servidor: conclusão persistida ou instalação Slack ativa da própria empresa dispensam o onboarding inteiro. Sem ambos, a preparação é obrigatória. Conexão de outra empresa não libera acesso. A conclusão explícita continua revalidando setores e lideranças; dispensar a tela não grava conclusão nem transfere workspace.

`process-usage-example.ts` gera atividade fictícia determinística em oito semanas, com volumes e proporções de lacunas irregulares (picos, quedas e retomadas, sem crescimento progressivo), e calcula os mesmos indicadores reais. Uso exclusivo das visualizações explícitas `/omdx?exemplo=uso` e `/exemplos/analytics`; não grava auditorias, feedback ou documentos no banco. Links dos documentos fictícios são nulos.

`analytics-example.ts` produz dois relatórios fictícios validados por Zod, com seis dimensões, três camadas e 48 respostas no total. Reutiliza o cálculo real de Analytics e comparação histórica; o filtro escolhe um diagnóstico ou todos. Não lê nem grava dados reais.

`acme-report-example.ts` fornece o relatório fictício da Acme para `/relatorios/exemplo-acme`, com 27 participantes, seis dimensões, 24 perguntas e seis textos editoriais. Reutiliza os scores determinísticos de `buildAnalyticsExampleReports()`, sem consultar ou alterar dados reais. O exemplo é identificado na listagem e na leitura, sem publicação ou ações reais associadas.

- `last_edited_by_user_id` registra o ator autenticado ao criar/salvar rascunho de ativo. A leitura mostra `lastEditedBy` da versão publicada, resolvido pelo perfil da conta, em Editado por na barra de metadados. Histórico sem registro fica Não registrado; criador, especialista e publicador não são usados para inferir a última edição.

- `organization_asset_navigation` persiste ordem e ícones por empresa com RLS e grants somente service_role. `asset-navigation` define payload estrito e catálogo fechado; layout lê pela empresa da sessão, PUT /api/settings/asset-navigation exige dono cliente e ignora qualquer tentativa de escolher organização no payload. Sem localStorage nem modificação de documentos/categorias.


- management-asset-update-data-source.ts publica atualizações do dono via RPC privada update_customer_management_asset. Membership é revalidado no banco, com bloqueio de superadmin, arquivados, rascunho aberto e versão base desatualizada. A transação cria versão, registra editor, preserva histórico e substitui índice textual usando a publicação existente. Embeddings ficam opcionais e podem ser reindexados pela operação.

- updateCustomerAssetsInBulk valida seleção publicada de uma única empresa e resolve categoryKey pelas mesmas pastas da sidebar. RPC update_customer_assets_metadata bloqueia ativos em ordem estável, revalida dono de cada organização e estado publicado, recusa IDs ausentes/duplicados e aplica tipo/categoria em uma transação. Conteúdo, versões e índice não mudam. Não confia em empresa/ator enviados pelo cliente.

- Categorias vazias e nomes personalizados persistem em organization_asset_navigation.preferences.categories, por organização, com chave estável. getPublishedManagementAssetFolders combina registro, padrões e categorias publicadas; usado na sidebar, páginas, breadcrumb e edição em lote. save_management_asset_category revalida dono e duplicatas, bloqueia registro e renomeia ativos atomicamente. save_asset_navigation_preferences faz merge atômico de ordem/ícones preservando categories. Sem localStorage.

- DELETE de categoria consulta e transfere todos os estados de management_assets, não apenas a biblioteca publicada. RPC delete_management_asset_category revalida dono, categoria/título atual, destino distinto e contagem; cria destino novo, move documentos e remove registro/ordem/ícone na mesma transação. Padrões recebem deleted:true para não reaparecerem vazios. Nenhuma versão, conteúdo ou documento é excluído.

- A data limite da pesquisa é inclusiva até o fim do dia em America/Sao_Paulo. `hasDiagnosticDeadlinePassed` é compartilhado pela página pública e pela API: após o prazo, não renderiza o formulário e o envio retorna 410, inclusive para formulários abertos anteriormente. Não depende de expires_at dos links nem altera automaticamente o status persistido.

- Pesquisas não exibe coluna Prazo. Status, filtros, contadores e ações usam getEffectiveDiagnosticStatus: ativo com prazo vencido em São Paulo ou coleta encerrada manualmente aparece Encerrado; rascunhos permanecem configuráveis. Não altera status no banco ao ler. A tela reavalia a cada minuto e ao recuperar foco.

A fonte demonstrativa de aderência inclui perguntas explícitas do agente e respostas em checkIns para a timeline compartilhada; fromLeader distingue os autores. O componente não infere perguntas nem grava conversas reais.

Cada Action Point demonstrativo possui why com resumo do que a prática trata e de sua importância operacional na empresa. O texto alimenta a descrição do painel Figma 282:1322; não inventar resultados medidos ou contexto real do cliente.

adherenceLeaderPhotos centraliza as fotos demonstrativas por autor, compartilhadas pela listagem e pela timeline de Action Points. Não representa fotos persistidas de usuários reais.

O histórico demonstrativo da daily (ap-001) contém 14 mensagens: sete perguntas e sete respostas, em ciclos do mais recente ao mais antigo. As dez entradas adicionais são exemplos de prioridades, bloqueios, dependências e encaminhamentos; não representam conversas reais do Slack.

`omdx-analytics-overview.ts` (puro) monta a leitura do Analytics em seis níveis a partir de `OverviewAnalytics`, da comparação histórica e da aderência: veredito (maturidade média, variação em pontos, desalinhamento médio, dimensões com nota até 3,0, consenso, adoção), dimensões ordenadas, percepção por camada com gap ≥ `gapCutoff`, top 5 perguntas por menor nota agregadas por dimensão + texto e alavancas com a prioridade real. `QuestionResult` passou a expor `layerGap`; `maturityCutoff` e `gapCutoff` são exportados.

`omdx-impact-example.ts` é a fonte ilustrativa e determinística do impacto: as três dimensões mais críticas viram alavancas tratadas, com ativo e execução tirados da demonstração de Action Points (pesos por saúde), uso do ativo, nota estimada, confiança, quadrante de impacto, evolução em 30/60/90 dias e marcos. Não lê nem grava dados reais. Ver `docs/analytics-impacto.md`.


Fechamento A01/A02/A08 (19/10/2026): catálogo usa dimensionId estável; buildPublishedActionPlan recorta o PDF com a mesma seleção deduplicada do painel. getPublishedActionPointsWorkspace aceita coleta específica autorizada. published-action-points-board mantém a visão por responsável e não converte progresso em aderência nem inventa conversas. getAdminDeliveryDraft é exclusivo do workspace interno; clientes continuam lendo admin_deliveries, imutável durante save. saveAdminDeliveryPublication usa RPC transacional que publica snapshot e preserva histórico privado. report-findings descreve diferenças observadas sem inferir causas, inclusive em base uniforme.


A09 iniciada: buildAnalyticsOverview não calcula impacto ilustrativo no caminho operacional. Exemplos precisam optar explicitamente por illustrativeImpact; prioridades e notas reais permanecem. Sem evidência, progresso/estimativa/uso ficam sem base. População agora inclui liderança ativa do Slack e time aprovado, com paginação integral, deduplicação de referências Slack e de e-mail/conta internos. Conciliação entre canais só usa vínculo verificado; sem ele, adoção fica sem base em vez de somar pessoas possivelmente duplicadas. Auditorias sem identidade elegível também suprimem o percentual. Comparação usa a população atual nos dois períodos e explicita as janelas. Fonte persistida de prova app/Slack permanece pendente.


A13: `response-submission.ts` mantém UUID aleatório por link/tentativa, tolerando armazenamento bloqueado. Recibo transacional usa hashes, sem IP, e-mail ou identidade do respondente. Gravação atômica fica na RPC privada; helper não persiste respostas.


A11: admin-company-operations-data-source exige superadmin para contexto e lê histórico por organização na RPC get_organization_operations. saveCompanySpecialistAssignment deriva UUID do ID da empresa e valida concorrência no banco. Principal é sugestão somente quando não há publicação/rascunho; limpar especialista em revisão não faz fallback ao principal. Fila e detalhe usam os mesmos estados. getPublishedSpecialistContact expõe apenas contato cadastrado ativo da atribuição publicada, após autorização do relatório na página.

A12: salvamento administrativo usa `save_admin_management_asset`, que compara revisão e valida estado/especialista antes de gravar metadados e conteúdo atomicamente. Modelo `estrutura-raci` inicia uma matriz editável; tipo/modelo incompatíveis são recusados antes de escrever. `management-asset-review.ts` calcula revisão pela publicação vigente: meses de calendário, último dia válido e prazo inclusivo em São Paulo. Sem publicação/regra reconhecida não inventa prazo; sob demanda e arquivados não vencem automaticamente. Revisão vencida não retira conteúdo publicado. Conflitos permanentes das RPCs de cliente/categorias/lote usam PT409; 40001 não deve ser lançado como regra de negócio porque o PostgREST 14 repete a transação.

A03: `asset-adherence.ts` calcula execução relatada/validada sobre oportunidades com prazo alcançado, excluindo somente exceções aprovadas. Sem elegíveis retorna null; não mistura leitura/resultado ou médias de percentuais. `asset-adherence-data-source.ts` é server-only: revalida dono/DirectScal, filtra empresa e lê todas as páginas. Acordos/ciclos/fatos são adicionais e imutáveis; integrações futuras devem resolver ator/empresa pela sessão. Não há endpoint novo nem envio ao Slack. Ver `docs/modelo-de-aderencia.md`.

A04 (base inicial, ampliada abaixo): transitionAssetAdherenceRoutine persiste pausa/retomada somente pela operação DirectScal, com motivo obrigatório, versão esperada e tentativa idempotente. Pausa bloqueia oportunidades novas, conserva ciclos/fatos anteriores e não exclui denominadores retroativamente. Interface, recomendações adaptadas e transferência foram adicionadas na continuação descrita abaixo.

A04: admin-adherence-data-source resolve empresa/ator no servidor e revalida pessoa ativa via users.info antes de criar/adaptar acordo ou transferir a ação inteira. RPCs privadas gravam atribuição, histórico e revisões na mesma transação. customer-routine-agreements primeiro verifica acesso ao diagnóstico por RLS e só então lê acordos privados selecionados; não usa cookie administrativo nem expõe payload interno. Conflitos preservam formulário. Transferência inclui todas as rotinas da ação, inclusive pausadas, com snapshot esperado completo.

A15: slack-delivery-operations revalida papel global antes de listar metadados da empresa. Paginação por received_at + id, cursor validado, sem corpo de conversa no DTO. Recuperação exige versão atual e falha confirmada; Incerto não é reenviável. Rotas não aceitam organização/ator no payload.

A09: slack-identity-data-source deriva empresa pelo membership, exige conta definitiva, gera 256 bits aleatórios e persiste somente SHA-256. Confirmação consome desafio na transação do evento/lease e deriva workspace/pessoa da DM recebida, nunca de formulário. Vínculos só entram na população quando instalação e membership continuam válidos. Sem prova, adoção permanece sem base. A mesma pessoa que usa os dois canais conta uma vez; consulta permanece distinta de execução.

A05: routine-calendar gera oportunidade do período corrente, com fuso IANA, acordo/ativação como limite inferior, segunda a sexta na cadência diária e sem presumir eventos. routine-contact-data-source resolve empresa/ator, usa RPCs privadas e cursor durável por lote de 25; erro de uma rotina não impede marcar seu avanço e tentar as demais. Contador ensured inclui job novo ou já existente. mapAssetAdherenceRule é compartilhado com a base A03. Ver docs/agente-proativo-rotinas.md.


A06: routine-reply-parser distingue consulta de relato explícito sem autorizar escrita. customer-routine-records exige sessão definitiva, RLS do diagnóstico e RPC privada; pagina ciclos em lotes de cem sem base parcial. published-action-points-board usa fatos confirmados, oportunidades vencidas dos últimos trinta dias e soma de numeradores/denominadores, incluindo eventos explícitos. Conversa vem de ingresso real e resposta entregue, sem reconstrução. Ver docs/conversa-de-execucao-rotinas.md.


A07: routine-supervision calcula fila de evidência/exceção/bloqueio, silêncio após 24h e escalonamento interno após 48h, confirmação expirada e retorno em atraso. Não altera fatos ao classificar. routine-supervision-data-source pagina ciclos privados da empresa, revalida papel global e grava decisão pela RPC atômica. Prazo de retorno não modifica due_at/denominador. scheduleRoutineReminders conserva um lembrete por ciclo; consumidor continua separado do agendamento.


A14: completeAcquisitionAccount substitui criação sequencial e reutilização de organização por nome/domínio. RPC une usuário, empresa, membership, credencial, lead e recibo. Conta existente não recebe senha nem novo acesso pelo cadastro público. Reentrada Google exige identidade/e-mail verificados, payload idêntico e membership vigente; lead antigo não restaura acesso removido.


A17: agent-operations-data-source exige operação global definitiva; pagina revisões em lotes de 200. Auditorias consultadas em todas as páginas, por empresa; feedback com desempate por data/id. Lacuna resolvida sai de pendências, mas conserva histórico. assistant-history-data-source exige cliente/admin definitivo com membership atual, filtra próprio user_id+app e usa cursor de data/id em páginas de 25; não incorpora Slack.


A10: routine-results-data-source exige superadmin definitivo, captura snapshot por revisão de acordo e lê somente organização da rota. Baseline vem de coleta encerrada e preserva data real da captura; não estima nota por execução/uso. Estimativa/rubrica/percepção/calibração continuam dependentes de A16 e decisão metodológica, documentadas em docs/resultado-com-evidencia.md.


A12/A03: exclusão de ativo referenciado por histórico de rotina permanece impedida pela FK, atomicamente. deleteManagementAssets traduz 23503 para conflito 409 com orientação de arquivar, sem expor erro interno ou apagar relações para forçar exclusão.


A17: auditorias e avaliações administrativas avançam por cursor (created_at bruto + id), sem offset; novas consultas não deslocam a página e escondem lacunas antigas.
