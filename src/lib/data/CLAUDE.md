# `src/lib/data` — Fonte de dados e regras

Esta pasta é a fronteira entre UI e dados. O core de Maturidade lê Supabase no servidor; superadmin e aquisição também usam Supabase via Route Handlers server-side. Perfil deriva identidade da sessão autenticada, mas ainda preserva persistência mockada/local enquanto seu backend não entra no escopo.

## Regras

- Páginas e componentes devem importar dados daqui, não de `mock-data.ts`.
- Leituras Maturidade que falam com Supabase são assíncronas e server-side.
- Client Components devem importar apenas helpers puros de `omdx-domain.ts`, nunca a data-source Supabase.
- Regras como base mínima de Fundador para análise, trava local de resposta e validação de conjunto completo de respostas devem ficar em funções puras testáveis.
- Cálculos agregados e helpers de domínio ficam aqui ou em contratos/mappers, não nos componentes.
- Relatórios PDF devem consumir DTOs consolidados daqui, como `getDiagnosticReport()` e `getDiagnosticActionPlan()`, sem acessar mocks ou recalcular dados dentro do documento.
- `action-plan-gantt.ts` converte `DiagnosticActionPlan` em tarefas de cronograma (`GanttTask`) para a rota `/gantt`, preservando os metadados do action point usados no modal de detalhes. É um motor determinístico baseado apenas nos dados quantitativos consolidados, sem API de IA e sem persistência de tarefas. A rota aparece na sidebar dentro de `Maturidade`.
<<<<<<< Updated upstream
=======
- Exportações CSV devem consumir dados preparados daqui: respostas brutas anônimas via `getDiagnosticResponseExport()` e relatório consolidado via `buildDiagnosticReportCsv()`.
- `omdx-data-source.ts` pode usar `cache()` do React apenas para memoização por request de sessão, autorização, modelo Maturidade e bundles derivados. Não use `unstable_cache`, `use cache`, CDN cache ou cache global/persistente para sessão, organizações, diagnósticos, respostas, tokens, cookies, JWT ou resultados obtidos com service role.
- Helpers memoizados que dependem de usuário devem receber `userId` explicitamente. Não dependa de variável global mutável para decidir escopo de organização ou acesso.
>>>>>>> Stashed changes
- `admin-data-source.ts` concentra helpers puros, seeds estáticos de módulos e derivação de empresas/módulos.
- `acquisition-data-source.ts` é server-side e fala com Supabase para campanhas, leads, empresas, intents OAuth e credenciais de senha.
- `operational-onboarding-data-source.ts` concentra o cadastro operacional: domínio autorizado, link público, lista de pessoas cadastradas, exclusão autenticada, critério mínimo de pessoa aprovada e bloqueio antes da ativação do diagnóstico.
- `pessoas-data-source.ts` concentra o MVP de Pessoas: Overview, diretório, perfil, fechamento mensal e configurações mínimas. Ele compõe seeds mockados com `operational_members` server-side quando a organização possui cadastros; não cria persistência própria nem faz cálculo legal de CLT.
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
- `gap` é a diferença entre a maior e a menor média de camada com base disponível; quando só Fundador respondeu, o gap fica `null`.
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
