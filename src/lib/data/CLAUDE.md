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

`client-onboarding-data-source.ts` resolve a organização principal da sessão, lê conclusão privada e revalida Slack com escopos e todos os setores ativos (inclusive a contagem bruta para detectar setores sem liderança). `client-onboarding.ts` concentra o critério puro: ao menos um setor ativo, liderança e convite enviado ou aceito em todos, Slack válido. Conclusão é idempotente e durável por empresa; falhas não são tratadas como conclusão. O onboarding operacional público permanece independente.
