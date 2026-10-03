# `src/lib/data` — Fonte de dados e regras

Esta pasta é a fronteira entre UI e dados. O core de Maturidade lê Supabase no servidor; superadmin e aquisição também usam Supabase via Route Handlers server-side. Perfil e Configurações compartilham a leitura server-side de identidade, organização e aquisição; as edições pessoais do Perfil ainda preservam persistência local.

## Regras

- Páginas e componentes devem importar dados daqui, não de `mock-data.ts`.
- Leituras Maturidade que falam com Supabase são assíncronas e server-side.
- Leituras Maturidade nunca expandem `superadmin` para todas as organizações. Esse papel não possui escopo de cliente; dados administrativos são resolvidos pelas fontes e APIs de `admin`.
- Client Components devem importar apenas helpers puros de `omdx-domain.ts`, nunca a data-source Supabase.
- Regras como base mínima de Fundador para análise, trava local de resposta e validação de conjunto completo de respostas devem ficar em funções puras testáveis.
- Cálculos agregados e helpers de domínio ficam aqui ou em contratos/mappers, não nos componentes.
- Relatórios PDF devem consumir DTOs consolidados daqui, como `getDiagnosticReport()` e `getDiagnosticActionPlan()`, sem acessar mocks ou recalcular dados dentro do documento.
- `omdx-native-report-charts.ts` transforma um `DiagnosticReport` consolidado nos datasets dos seis gráficos da leitura nativa; componentes aplicam somente apresentação e tokens visuais.
- `action-plan-gantt.ts` converte `DiagnosticActionPlan` em tarefas de cronograma (`GanttTask`) para a rota histórica `/gantt`, preservando os metadados do action point usados no calendário e no modal de detalhes. O calendário achata os subitens da frente raiz e usa a data de início como dia do evento. É um motor determinístico baseado apenas nos dados quantitativos consolidados, sem API de IA e sem persistência de tarefas.
<<<<<<< Updated upstream
=======
- Exportações CSV devem consumir dados preparados daqui: respostas brutas anônimas via `getDiagnosticResponseExport()` e relatório consolidado via `buildDiagnosticReportCsv()`.
- `omdx-data-source.ts` pode usar `cache()` do React apenas para memoização por request de sessão, autorização, modelo Maturidade e bundles derivados. Não use `unstable_cache`, `use cache`, CDN cache ou cache global/persistente para sessão, organizações, diagnósticos, respostas, tokens, cookies, JWT ou resultados obtidos com service role.
- Helpers memoizados que dependem de usuário devem receber `userId` explicitamente. Não dependa de variável global mutável para decidir escopo de organização ou acesso.
>>>>>>> Stashed changes
- `admin-data-source.ts` concentra helpers puros, seeds estáticos de módulos e derivação de empresas/módulos.
- `admin-operations-data-source.ts` fornece o mock tipado da primeira versão frontend de especialistas, entregas e catálogo de action points. Ele não grava no Supabase e deve ser substituído por APIs e políticas próprias na etapa funcional.
- `management-assets-data-source.ts` (server-only) lê bibliotecas e leitura individual no Supabase, filtrando pelas organizações da sessão de cliente, por `status = publicado`, `archived_at` nulo e pela versão vigente.
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

<<<<<<< Updated upstream
=======
## Exportação CSV de respostas

`getDiagnosticResponseExport()` expõe as respostas brutas de um diagnóstico em formato longo para `/omdx/[id]/respostas`.

- Cada linha representa uma pergunta respondida.
- O respondente é identificado apenas por alias anônimo por grupo, como `fundador-001`.
- A ordenação segue sessão enviada, dimensão e ordem original da pergunta.
- A exportação usa dados reais de `response_sessions` + `likert_answers` e não consulta a tabela `respondents`.

## Exportação CSV de relatório

`buildDiagnosticReportCsv()` transforma um `DiagnosticReport` já consolidado em CSV para `/omdx/[id]/relatorio?formato=csv`.

- O helper é puro, não consulta Supabase e não altera a regra de disponibilidade do relatório.
- O CSV usa UTF-8 com BOM, separador `;` e uma estrutura longa com `secao = resumo | dimensao | pergunta`.
- As perguntas exportadas são agregados do relatório consolidado, não respostas individuais por respondente.

>>>>>>> Stashed changes
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
