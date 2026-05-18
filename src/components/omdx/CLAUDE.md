# `src/components/omdx` — Componentes do módulo OMDx

Antes de editar, releia o **AGENTS.md** da raiz, o `CLAUDE.md` de `src/components/` e este documento.

## Propósito

Componentes específicos do **OMDx — Diagnóstico de Maturidade Operacional**. São compostos a partir dos primitives em `src/components/ui/` e consomem dados pela fronteira `src/lib/data/`, nunca diretamente pelos arrays de `src/lib/mock-data.ts`.

## Domínio em uma frase

OMDx avalia maturidade operacional em **6 dimensões** (Cultura, Visão, Comunicação, Processos, Liderança, Performance), respondidas via formulário Likert 1-5 por **3 grupos** (Sócios, Liderança, Time/Operação) — cada grupo com seu link público anônimo. O cliente administrador acompanha a coleta e lê o resultado executivo.

## Componentes atuais

| Componente | Arquivo | Onde é usado | Estado |
| --- | --- | --- | --- |
| `KpiCard` | `../kpi-card.tsx` via reexport local | Dashboard (4 cards de topo) | Compartilhado com o superadmin. Recebe `label`, `value`, `trend`, `trendValue`, `caption`, `hint`. |
| `StatusBadge` | `status-badge.tsx` | Tabela de diagnósticos | 3 estados: `rascunho`, `ativo`, `encerrado`. |
| `DiagnosticsTable` | `diagnostics-table.tsx` | Área de diagnósticos | Tabs de filtro, três colunas para copiar links públicos por grupo e menu com configuração de rascunho/exclusão. Rascunhos não exibem links. |
| `DeleteDiagnosticDialog` | `delete-diagnostic-dialog.tsx` | Área de diagnósticos | Confirma exclusão persistida antes de remover diagnóstico e links vinculados. |
| `DiagnosticForm` | `diagnostic-form.tsx` | Drawer de criação/configuração | Formulário client-side com validação mínima e resumo objetivo. Não exibe lista completa de dimensões nem escala Likert. |
| `LikertScalePreview` | `likert-scale-preview.tsx` | Disponível para telas futuras | Visual da escala 1-5 do template selecionado. Não é exibido no drawer atual. |
| `DimensionsSummary` | `dimensions-summary.tsx` | Disponível para telas futuras | Resumo compacto das 6 dimensões avaliadas. Não é exibido no drawer atual. |
| `DiagnosticsWorkspace` | `diagnostics-workspace.tsx` | `/omdx/diagnosticos` | Controla lista, ações e drawer de criação/configuração. |
| `ShareWorkspace` | `share-workspace.tsx` | `/omdx/[id]/compartilhar` | Central client-side de coleta com cópia local e encerramento persistido via API. |
| `ShareLinks` | `share-links.tsx` | Compartilhamento | Cards por grupo com link, prévia e mensagem sugerida. |
| `ResponseCounters` | `response-counters.tsx` | Compartilhar e acompanhamento futuro | Total de respostas, respostas por grupo e aviso de base de Fundador para análise. |
| `PublicResponseForm` | `public-response-form.tsx` | `/r/[token]` | Formulário público anônimo em lista contínua minimalista, com perguntas embaralhadas por carregamento, controle Likert em linha exibindo todos os rótulos, modal inicial, progresso discreto, validação com âncora na primeira pendência, envio para API, trava leve em `localStorage` e redirecionamento para `/r/[token]/obrigado` após sucesso. |
| `DimensionInsightWorkspace` | `dimension-insight-workspace.tsx` | `/insights/[dimensao]` | Controla o filtro da dimensão, renderiza topbar e injeta o dashboard. |
| `DimensionInsightDashboard` | `dimension-insight-dashboard.tsx` | `/insights/[dimensao]` | Dashboard compacto por dimensão, recebendo o diagnóstico filtrado por prop. |
| `DimensionDiagnosticFilter` | `dimension-diagnostic-filter.tsx` | Topbar de Insights | Select do sistema para alternar entre todos os diagnósticos e diagnóstico individual. Deve ser usado apenas na topbar. |
| `DimensionScoreTrend` | `dimension-score-trend.tsx` | Disponível para telas futuras | Barras comparando a dimensão entre diagnósticos. Não é exibido no dashboard atual de Insights. |
| `LayerInsightComparison` | `layer-insight-comparison.tsx` | Disponível para telas futuras | Comparação entre fundador, liderança e operação. Não é exibido no dashboard atual de Insights. |
| `DimensionQuestionResultsTable` | `dimension-question-results-table.tsx` | Insights | Tabela por pergunta da dimensão, respeitando o filtro de diagnóstico e ordenando por prioridade operacional. |
| `OverviewExecutiveCards` | `overview-executive-cards.tsx` | `/omdx` e `/insights/[dimensao]` | Indicadores executivos em gauges dentro de `Card`, com número e detalhes técnicos no tooltip do ícone de informação. A classificação orienta a cor do gauge, mas não aparece como chip. No Overview recebe maturidade, criticidade, desalinhamento e consenso; em Insights recebe métricas compactas da dimensão. |
| `OverviewDiagnosticFilter` | `overview-diagnostic-filter.tsx` | `/omdx` | Wrapper client do filtro de diagnósticos na topbar do Overview, reutilizando `DimensionDiagnosticFilter`. |
| `ClusteringProcessChart` | `clustering-process-chart.tsx` | `/omdx` | Scatter ECharts com agrupamento k-means determinístico de dimensões por maturidade e criticidade. A UI chama a leitura de `Agrupamento operacional` e não exibe centroides. |
| `OrganizationalAlignmentChart` | `organizational-alignment-chart.tsx` | Disponível para telas futuras | Scatter ECharts de maturidade e criticidade por dimensão. Não é exibido no overview atual. |
| `MaturityMisalignmentChart` | `maturity-misalignment-chart.tsx` | `/omdx` | Scatter plot ECharts com quadrantes de maturidade média e gap de percepção. |
| `InterventionPriorityChart` | `intervention-priority-chart.tsx` | `/omdx` | Barras horizontais ECharts para priorizar intervenção por criticidade operacional, maturidade, gap e dispersão. |
| `TopResearchBottlenecks` | `top-research-bottlenecks.tsx` | `/omdx` | Ranking React de perguntas com maior percentual de respostas críticas, sem ECharts. |
| `LayerHeatmapComparisonChart` | `layer-heatmap-comparison-chart.tsx` | `/omdx` | Heatmap ECharts para comparar diretoria, liderança e time por dimensão em escala de 1 a 5. |
| `useChartThemeColors` | `use-chart-theme-colors.ts` | Charts ECharts OMDx | Hook client-side que lê tokens CSS e observa mudanças da classe `dark` no `<html>` para recalcular cores sem refresh. |

## Convenções de domínio

- **Linguagem visível ao usuário** segue o vocabulário Directscal: "estruturação", "operação", "diagnóstico", "alavancagem", "modelo", "escala". **Nunca** "transformação digital", "DNA", "jornada", "incrível".
- **Sentence case** em títulos, botões e labels. Sem ponto de exclamação.
- **Score 1-5** sempre formatado com **uma casa decimal** (`(3.4).toFixed(1)`), com vírgula em pt-BR quando aplicável (formatação automática se vier de `toLocaleString("pt-BR")`).
- **Classificação** vem da função `classifyScore()` em `src/lib/data/omdx-domain.ts`. Não inline a regra em componente. A régua textual do score Likert é: `<= 2.0` Crítico, `<= 3.0` Inconsistente, `<= 4.0` Atenção, acima de `4.0` Consistente.
- **Biblioteca principal de visualização:** usar Apache ECharts via `echarts` e `echarts-for-react` para charts analíticos do OMDx. Evite shadcn/ui Charts e Recharts como base principal.
- **Charts reutilizáveis:** componentes de visualização devem ser tipados, receber dados já preparados por props ou pela camada `src/lib/data/`, e manter opções ECharts próximas do componente de domínio que as governa.
- **Charts e tema:** ECharts não reage sozinho a CSS variables após troca de tema. Use `useChartThemeColors()` para ler tokens e recomputar `option` quando light/dark mudar; não congele cores com `useMemo(..., [])`.
- **Charts sem border radius:** não use `borderRadius`, `border-radius`, `rounded-*` ou cantos arredondados em barras, áreas, tooltips ou elementos internos de charts. Preserve a geometria padrão/retangular da biblioteca.
- **Cores de score em charts:** não use vermelho/verde para maturidade. Use cores fixas por série/camada; a posição e o tamanho da barra comunicam o score.
- **Cores por camada:** use uma paleta cyan fixa começando no peso 70 e diminuindo: diretoria cyan 70, liderança cyan 60 e time cyan 50, sem variar intensidade conforme a pontuação.
- **Cores por dimensão:** quando houver score consolidado por dimensão, prefira famílias neutras (`cool gray`, `gray`, `warm gray`) sem semáforo; vermelho e verde ficam restritos a estados semânticos fora dos charts.
- **Nomes humanos, não técnicos**, em títulos visíveis: "O que mais pesa no resultado", não "GraficoItensDimensao". O nome técnico fica no código.
- **Rótulos curtos** (`shortName` em `dimensions[]`) para gráficos. A pergunta completa vai em tooltip ou texto secundário.

## Componentes a construir

| Componente | Onde será usado | Observação |
| --- | --- | --- |
| `RespondentTable` | `/omdx/[id]/acompanhamento` | Lista de respondentes |
| `ScoreCard` | `/omdx/[id]/resultado` | Score geral + classificação + interpretação |
| `ExecutiveHighlights` | Resultado | 3 cards: maior gargalo / criticidade / prontidão |
| `LayerComparison` | Resultado | Comparação Sócios × Liderança × Time |
| `MisalignmentMatrix` | Resultado | Heatmap dimensão × camada |
| `ItemWeightChart` | Detalhe por dimensão | Barras horizontais com label curto + tooltip |
| `MisalignmentHighlight` | Detalhe por dimensão | Maior gap entre camadas |

Quando criar, **adicione à tabela acima** e mantenha contratos, data-source e docs coerentes.

## Estados a cobrir

Cada componente que mostra dados precisa lidar com pelo menos:
- **Sem dado** (ex.: diagnóstico sem respostas, grupo sem respondentes)
- **Dado parcial** (ex.: Fundador respondeu, mas liderança/operação ainda aparecem sem base)
- **Dado completo**

Para o respondente, prever:
- Link inválido
- Link expirado
- Já respondeu
- Coleta encerrada
- Respostas incompletas

## Fluxo de criação/configuração

- `/omdx` é dashboard executivo e não deve conter o formulário nem a tabela operacional completa.
- `/omdx/diagnosticos` é a área operacional para listar, filtrar e agir sobre diagnósticos, acessada pela sidebar.
- `Criar diagnóstico` abre o drawer lateral em modo criação.
- `Continuar configuração` abre o drawer lateral em modo edição preenchido com o rascunho.
- O drawer deve manter o formulário enxuto: campos, template, resumo da configuração, grupos e ações. Não exibir a lista completa de dimensões nem a escala Likert no fluxo atual.
- `Salvar como rascunho` valida o mínimo necessário, persiste no Supabase e fecha o drawer.
- `Ativar diagnóstico` valida e mostra, no próprio drawer, os 3 links por grupo: fundador, liderança e operação.
- A tabela operacional também deve expor ações de copiar link por grupo em colunas próprias quando o diagnóstico não estiver em rascunho.
- O menu de três pontos da tabela deve ser enxuto: `Continuar configuração` apenas em rascunhos e `Excluir` para todos os diagnósticos, sempre com confirmação.
- `Baixar relatório` e `Baixar action points` aparecem na tabela para diagnósticos com resultado consolidável (`generalScore` e ao menos uma resposta de Fundador).
- O dashboard não deve exibir CTA para `/omdx/diagnosticos`; a navegação principal fica na sidebar.
- Não criar páginas visíveis para criação/configuração; se rotas antigas existirem, tratá-las como temporárias/deprecated.

## Fluxo de compartilhamento

- `/omdx/[id]/compartilhar` é uma central compacta de coleta, não uma lista completa de respondentes.
- Mostrar 3 links por grupo: fundador, liderança e operação.
- Cada link deve ter mensagem sugerida própria e ação de prévia pública em `/r/[token]`.
- `Encerrar coleta` chama a API e persiste `status = encerrado` no Supabase.
- `Baixar relatório` e `Baixar action points` aparecem como ações contextuais quando o diagnóstico já possui base de Fundador e relatório consolidável.
- Acompanhamento detalhado e lista de respondentes ficam para `/omdx/[id]/acompanhamento`.

## Insights por dimensão

- `/insights/[dimensao]` mostra uma visão agregada da dimensão em todos os diagnósticos.
- O filtro padrão é `Todos os diagnósticos`; o usuário pode selecionar um diagnóstico individual.
- Filtros de página ficam na `AppTopbar`, usando a área `actions`. Não renderize filtros globais dentro do corpo do dashboard.
- O filtro de diagnóstico em Insights controla a query string `?diagnostico=...`; `todos` remove o parâmetro.
- O MVP deve permanecer compacto: KPIs e tabela de perguntas.
- A tabela de perguntas usa `getDimensionQuestionResults()` e deve respeitar o filtro atual. Em `Todos os diagnósticos`, agrega por `dimensionId + text`; em diagnóstico individual, mostra apenas as perguntas daquele diagnóstico. As colunas visíveis são `Pergunta`, `Score`, `Status`, `Gap`, `Respostas` e `Prioridade`.
- A prioridade da tabela é `round((((5 - score) + (gap ?? 0)) / 5) * 100)`, limitada entre `0` e `100`. A barra deve ser retangular, sem `rounded-*`.
- Não adicionar recomendações profundas, riscos ou análise por item nesta etapa.

## Cálculo dos cards executivos

`OverviewExecutiveCards` é apenas componente de apresentação. Ele não calcula métricas; recebe `title`, `value`, `suffix`, `classification`, `description` e, quando disponível, `technicalDetail` prontos. A descrição não deve aparecer como texto fixo no card; detalhes explicativos ficam no tooltip do ícone de informação. As regras de cálculo ficam em:

- Overview (`/omdx`): `src/lib/data/omdx-overview-analytics.ts`, função interna `buildMetrics()`.
- Insights por dimensão (`/insights/[dimensao]`): `src/components/omdx/dimension-insight-dashboard.tsx`, função interna `buildDimensionMetrics()`, usando o resumo de `getDimensionInsightSummary()`.

### Cards do Overview

Os cards do Overview usam índices executivos normalizados em escala `0-100`, mesmo quando a base original vem de Likert `1-5`. A normalização permite comparar maturidade, criticidade, desalinhamento e consenso na mesma superfície.

- **Maturidade geral**: média das maturidades das dimensões, arredondada com uma casa, normalizada por `normalizeLikertToIndex(score) = round((score / 5) * 100)`. Quanto maior, melhor. Classificação por `classifyMaturityIndex()`: `<= 40` Crítico, `<= 60` Inconsistente, `<= 80` Atenção, acima de `80` Consistente.
- **Criticidade operacional**: média do índice de criticidade de cada dimensão. Para cada dimensão, `rawCriticality = 5 - maturity + (gap ?? 0) + dispersion + criticalPercentage / 100`, depois `normalizeCriticality(rawCriticality) = round((rawCriticality / 16) * 100)`, limitado entre `0` e `100`. Quanto maior, pior. Quando não há comparação entre camadas, o card fica `Sem dados`.
- **Desalinhamento organizacional**: média dos gaps por dimensão, em que `gap = maior score de camada - menor score de camada` entre camadas com base. O gap médio é normalizado por `normalizeGapToIndex(gap) = round((gap / 5) * 100)`. Quanto maior, pior. Com apenas Fundador, o card fica `Sem dados`.
- **Consenso interno**: parte da dispersão média das dimensões. Fórmula: `consensus = round(100 - (averageDispersion / 5) * 100)`, limitado entre `0` e `100`. Quanto maior, melhor. Classificação por `classifyConsensusIndex()`: `>= 80` Consistente, `>= 60` Atenção, `>= 40` Inconsistente, abaixo de `40` Crítico.

### Cards dos Insights por dimensão

Os cards de Insights reaproveitam a mesma apresentação, mas os dados são específicos da dimensão filtrada. Quando não há base suficiente, o card usa `Sem dados`.

- **Base de respostas**: soma de `responses` dos diagnósticos considerados pelo filtro. Em `Todos os diagnósticos`, soma todos os diagnósticos com dados; em diagnóstico individual, usa apenas o diagnóstico selecionado.
- **Maturidade da dimensão**: média dos scores da dimensão entre os diagnósticos considerados, normalizada por `normalizeLikertToIndex(score)`. O texto técnico preserva o valor original em escala `1-5`.
- **Diagnósticos analisados**: quantidade de diagnósticos com score disponível para a dimensão dentro do filtro atual.
- **Variação entre diagnósticos**: diferença entre o maior e o menor score da dimensão nos diagnósticos considerados. Quando existe mais de um diagnóstico, normaliza o gap por `normalizeGapToIndex(variation)` e classifica por `classifyMisalignmentIndex()`. Com um único diagnóstico, mostra `Sem dados`, porque não há comparação possível.

## Anti-padrões

- Importar `@base-ui/*` direto. Use sempre via `src/components/ui/`.
- Replicar `classifyScore` em vários lugares — está na camada de dados.
- Usar nomes técnicos como label visível.
- Pergunta Likert inteira em label de gráfico — vai em tooltip; label = `shortName`.
- Cards com sombra colorida ou gradiente.
- Cor única para representar valor numérico — use também posição (barra) e número.

## Quando o backend chegar

Os componentes desta pasta **não devem** mudar de forma. O que muda:
- Em vez de trocar componentes, a implementação de `src/lib/data/` passa a buscar dados reais no backend ou expõe hooks preservando os contratos.
- Estados `loading`/`error` ficam reais em vez de cosméticos.
- Tipos em `src/lib/types.ts` permanecem os mesmos.

Mantenha as fronteiras estáveis para essa transição ser uma troca de fonte, não um refactor.
