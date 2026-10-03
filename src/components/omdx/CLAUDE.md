# `src/components/omdx` — Componentes do módulo Maturidade

Antes de editar, releia o **AGENTS.md** da raiz, o `CLAUDE.md` de `src/components/` e este documento.

## Propósito

Componentes específicos do módulo **Maturidade**. São compostos a partir dos primitives em `src/components/ui/` e consomem dados pela fronteira `src/lib/data/`, nunca diretamente pelos arrays de `src/lib/mock-data.ts`.

## Domínio em uma frase

Maturidade avalia maturidade operacional em **6 dimensões** (Cultura, Visão, Comunicação, Processos, Liderança, Performance), respondidas via formulário Likert 1-5 por **3 grupos** (Sócios, Liderança, Time/Operação) — cada grupo com seu link público anônimo. O cliente administrador acompanha a coleta e lê o resultado executivo.

## Componentes atuais

| Componente | Arquivo | Onde é usado | Estado |
| --- | --- | --- | --- |
| `KpiCard` | `../kpi-card.tsx` via reexport local | Dashboard (4 cards de topo) | Compartilhado com o superadmin. Recebe `label`, `value`, `trend`, `trendValue`, `caption`, `hint`. |
| `StatusBadge` | `status-badge.tsx` | Tabela de diagnósticos | 3 estados: `rascunho`, `ativo`, `encerrado`. |
| `DiagnosticsTable` | `diagnostics-table.tsx` | Área de diagnósticos | Tabs de filtro, criador, setores, links de Liderança e Times e menu condicionado à permissão de gestão. Rascunhos não exibem links. |
| `DeleteDiagnosticDialog` | `delete-diagnostic-dialog.tsx` | Área de diagnósticos | Confirma exclusão persistida antes de remover diagnóstico e links vinculados. |
| `DiagnosticForm` | `diagnostic-form.tsx` | Drawer de criação/configuração | Formulário client-side com edição e revisão lado a lado no desktop, ações fixas no rodapé e empilhamento responsivo. O drawer usa `bg-card` e campos de baixo contraste no dark mode para preservar a hierarquia entre painel, controles e popovers. Não exibe lista completa de dimensões nem escala Likert. |
| `LikertScalePreview` | `likert-scale-preview.tsx` | Disponível para telas futuras | Visual da escala 1-5 do template selecionado. Não é exibido no drawer atual. |
| `DimensionsSummary` | `dimensions-summary.tsx` | Disponível para telas futuras | Resumo compacto das 6 dimensões avaliadas. Não é exibido no drawer atual. |
| `DiagnosticsWorkspace` | `diagnostics-workspace.tsx` | `/omdx/diagnosticos` | Controla lista, ações e drawer de criação/configuração. |
| `ShareWorkspace` | `share-workspace.tsx` | `/omdx/[id]/compartilhar` | Central client-side de coleta com cópia local e encerramento persistido via API. |
| `ShareLinks` | `share-links.tsx` | Compartilhamento | Cards por grupo com link, prévia e mensagem sugerida. |
| `ReportDownloadMenu` | `report-download-menu.tsx` | Overview e Compartilhar | Menu contextual para baixar o relatório consolidado em PDF ou CSV. O CSV usa `/omdx/[id]/relatorio?formato=csv`. |
| `ResponseCounters` | `response-counters.tsx` | Compartilhar e acompanhamento futuro | Total de respostas, respostas por grupo e aviso de base de Fundador para análise. |
| `PublicResponseForm` | `public-response-form.tsx` | `/r/[token]` | Formulário público anônimo em lista contínua minimalista, com perguntas embaralhadas por carregamento, controle Likert em linha exibindo todos os rótulos, modal inicial, progresso discreto, validação com âncora na primeira pendência, envio para API, trava leve em `localStorage` e redirecionamento para `/r/[token]/obrigado` após sucesso. |
| `DimensionInsightWorkspace` | `dimension-insight-workspace.tsx` | `/insights/[dimensao]` | Controla o filtro da dimensão, renderiza topbar e injeta o dashboard. |
| `DimensionInsightDashboard` | `dimension-insight-dashboard.tsx` | `/insights/[dimensao]` | Dashboard compacto por dimensão, recebendo o diagnóstico filtrado por prop. |
| `DimensionDiagnosticFilter` | `dimension-diagnostic-filter.tsx` | Topbar de Insights | Select do sistema para alternar entre todos os diagnósticos e diagnóstico individual. Deve ser usado apenas na topbar. |
| `DimensionScoreTrend` | `dimension-score-trend.tsx` | Disponível para telas futuras | Barras comparando a dimensão entre diagnósticos. Não é exibido no dashboard atual de Insights. |
| `LayerInsightComparison` | `layer-insight-comparison.tsx` | Disponível para telas futuras | Comparação entre fundador, liderança e operação. Não é exibido no dashboard atual de Insights. |
| `DimensionQuestionResultsTable` | `dimension-question-results-table.tsx` | Insights | Tabela por pergunta da dimensão, sem título ou descrição introdutória, respeitando o filtro de diagnóstico e acumulando Diretoria, Liderança e Time em uma barra horizontal empilhada, além de gap médio e status. |
| `DimensionQuestionLayerChart` | `dimension-question-layer-chart.tsx` + `dimension-question-layer-echarts.tsx` | Tabela de Insights | Wrapper client com carregamento dinâmico da barra horizontal ECharts por pergunta, três séries empilhadas com espessura uniforme de 16 px, escala fixa de 0 a 15, tooltip e tema dinâmico. A identificação das camadas, os valores e o total aparecem somente no hover. |
| `OverviewExecutiveCards` | `overview-executive-cards.tsx` | `/omdx` e `/insights/[dimensao]` | Indicadores executivos em superfície neutra sem borda ou sombra. No Overview e em Insights usa a apresentação numérica compacta, sem gauge, ícone ou status visível. Com três métricas, a grade desktop usa três colunas. |
| `OverviewDiagnosticFilter` | `overview-diagnostic-filter.tsx` | `/omdx` | Wrapper client do filtro de diagnósticos na topbar, reutilizando `DimensionDiagnosticFilter`. |
| `OverviewDimensionResultsTable` | `overview-dimension-results-table.tsx` | `/omdx` | Tabela compacta de leitura executiva por dimensão, exibindo dimensão, pontuação consolidada, status e gap entre camadas. |
| `LayerScoreDashboard` | `layer-score-dashboard.tsx` | `/omdx` e workspace admin da entrega | Na Overview, organiza uma grade 3 × 2: KPIs e Dimensões/Vulnerabilidades no topo; Alavancas/Camadas/Dimensões por Camadas abaixo. Cada visual ocupa um card independente de 512 × 434 no desktop. A apresentação `distilled` preserva a grade analítica sem KPIs. |
| `LayerScoreBarChart` | `layer-score-bar-chart.tsx` | `/omdx` | SVG responsivo de barras horizontais para Fundador, Liderança e Tático em escala fixa de 0 a 5, com geometria e cores do Figma. |
| `DimensionScoreBarChart` | `dimension-score-bar-chart.tsx` | `/omdx` | SVG responsivo de barras verticais roxas com a pontuação real das seis dimensões em escala fixa de 0 a 5 e na ordem definida no Figma. |
| `LayerDimensionStackedChart` | `layer-dimension-stacked-chart.tsx` | `/omdx` | SVG responsivo com uma pilha por dimensão em escala fixa de 0 a 15, labels internos e cores de Fundador, Liderança e Tático definidas no Figma. |
| `VulnerabilityQuestionMatrix` | `vulnerability-question-matrix.tsx` | `/omdx` | Matriz SVG 6 × 4 em escala roxa específica da Overview, com score e classificação reais na célula. |
| `LeverageMatrix` | `leverage-matrix.tsx` | `/omdx` | Matriz SVG 6 × 4 por maturidade, alinhamento, consenso e prioridade, em escala verde específica da Overview. |
| `LayerStackedScoreChart` | `layer-stacked-score-chart.tsx` | `/omdx` | Barras verticais empilhadas por dimensão, com Fundador, Liderança e Operação, labels internos e total acumulado no topo. |
| `OverviewCharts` | `overview-charts.tsx` | `/omdx` | Wrapper client mínimo que carrega os charts ECharts do Overview por dynamic import, preservando o shell inicial leve. |
| `OrganizationalAlignmentChart` | `organizational-alignment-chart.tsx` | Disponível para telas futuras | Scatter ECharts de maturidade e criticidade por dimensão. Não é exibido no overview atual. |
| `MaturityMisalignmentChart` | `maturity-misalignment-chart.tsx` | `/omdx` | Scatter plot ECharts com quadrantes de maturidade média e gap de percepção. |
| `InterventionPriorityChart` | `intervention-priority-chart.tsx` | `/omdx` | Barras horizontais ECharts para priorizar intervenção por criticidade operacional, maturidade, gap e dispersão. |
| `TopResearchBottlenecks` | `top-research-bottlenecks.tsx` | `/omdx` | Ranking React de perguntas com maior percentual de respostas críticas, sem ECharts. |
| `LayerHeatmapComparisonChart` | `layer-heatmap-comparison-chart.tsx` | `/omdx` | Heatmap ECharts para comparar diretoria, liderança e time por dimensão em escala de 1 a 5. |
| `ProcessUsageSection` | `process-usage-section.tsx` | `/omdx` | Server Component da seção `Uso dos processos`: três cards (Adoção, Cobertura, Utilidade) com variação em pontos percentuais contra os 30 dias anteriores, barras empilhadas por semana (8 semanas) e ranking dos processos mais consultados com a fração de avaliações negativas. SVG/HTML com tooltips nativos e tabela `sr-only`. Recebe `ProcessUsageAnalytics` pronto. |
| `useChartThemeColors` | `use-chart-theme-colors.ts` | Charts ECharts Maturidade | Hook client-side que lê tokens CSS e observa mudanças da classe `dark` no `<html>` para recalcular cores sem refresh. |
| `OperationalMemberRegistrationForm` | `operational-member-registration-form.tsx` | `/o/[token]` | Formulário público curto para a própria pessoa informar área, papel operacional e responsabilidades percebidas. Após cadastro aceito, mostra confirmação sem redirecionar automaticamente para pesquisa. |

## Convenções de domínio

- **Linguagem visível ao usuário** segue o vocabulário Directscal: "estruturação", "operação", "diagnóstico", "alavancagem", "modelo", "escala". **Nunca** "transformação digital", "DNA", "jornada", "incrível".
- **Sentence case** em títulos, botões e labels. Sem ponto de exclamação.
- **Score 1-5** sempre formatado com **uma casa decimal** (`(3.4).toFixed(1)`), com vírgula em pt-BR quando aplicável (formatação automática se vier de `toLocaleString("pt-BR")`).
- **Classificação** vem da função `classifyScore()` em `src/lib/data/omdx-domain.ts`. Não inline a regra em componente. A régua textual do score Likert é: `<= 2.0` Crítico, `<= 3.0` Inconsistente, `<= 4.0` Atenção, acima de `4.0` Consistente.
- **Biblioteca principal de visualização:** usar Apache ECharts via `echarts` e `echarts-for-react` para charts analíticos gerais de Maturidade. Os cinco charts manuais da Overview são a exceção deliberada: usam SVG responsivo para preservar a geometria aprovada no Figma. Evite shadcn/ui Charts e Recharts como base principal.
- **Charts reutilizáveis:** componentes de visualização devem ser tipados e receber dados já preparados por props ou pela camada `src/lib/data/`. Na Overview, preserve `viewBox="0 0 472 342"`, barras de 33 px, células de 80 × 33 px e os offsets documentados no código.
- **Tipografia dos charts:** eixos, legendas, tooltips e demais textos auxiliares usam Funnel Sans, preservando Plus Jakarta Sans para os títulos do app.
- **Charts e tema:** ECharts não reage sozinho a CSS variables após troca de tema. Use `useChartThemeColors()` nos charts ECharts. Os SVGs da Overview consomem as variáveis CSS diretamente em `fill` e `stroke`, reagindo ao tema sem JavaScript.
- **Barras com raio consistente:** charts gerais usam `chartBarBorderRadius`; os três charts do Overview usam `overviewChartBarBorderRadius`, ambos centralizados em `chart-colors.ts`.
- **Sistema de cor da Overview:** siga `CHART_COLOR_SYSTEM.md`. Cada papel usa o mesmo token nos dois temas; `:root` e `.dark` fornecem os equivalentes e o switch os resolve sem lógica no componente. Valores coincidentes podem continuar separados quando pertencem a funções que evoluem de forma independente.
- **Cores de score em charts:** vermelho e verde só aparecem quando o dado possui significado negativo ou positivo documentado. A posição, o tamanho e o número continuam carregando o valor.
- **Cores por camada fora da Overview:** os charts ainda não migrados preservam temporariamente o mapeamento legado: Fundador/Diretoria azul, Liderança ciano e Time/Operação teal. Não propague esse padrão para novos charts.
- **Cores por dimensão:** não atribua uma família forte a cada dimensão. Use posição, label, ordem e tooltip; a série consolidada superior usa o token roxo específico aprovado no Figma.
- **Histórico não usa cor de série:** represente a média histórica exclusivamente com três pequenos traços neutros, centralizados em `chartHistoricalMarkerSymbol`, acompanhados pelo tooltip.
- **Comparação histórica:** mostre variação de maturidade em pontos na escala `1-5`; percentual pode existir como informação secundária, mas não substitui o delta em pontos.
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
- `Ativar diagnóstico` exige liderança ativa e mostra, no próprio drawer, um link de Fundador, um geral de Liderança e um link de Time por setor selecionado.
- A tabela operacional expõe o criador, os setores e ações para copiar o link geral de Liderança ou escolher um dos links setoriais de Time.
- O menu de três pontos da tabela deve ser enxuto: `Continuar configuração` apenas em rascunhos e `Excluir` para todos os diagnósticos, sempre com confirmação.
- `Baixar relatório PDF`, `Baixar relatório CSV` e `Baixar action points` aparecem na tabela para diagnósticos com resultado consolidável (`generalScore` e ao menos uma resposta de Fundador).
- O dashboard não deve exibir CTA para `/omdx/diagnosticos`; a navegação principal fica na sidebar.
- Não criar páginas visíveis para criação/configuração; se rotas antigas existirem, tratá-las como temporárias/deprecated.

## Fluxo de compartilhamento

- `/omdx/[id]/compartilhar` é uma central compacta de coleta, não uma lista completa de respondentes.
- Mostrar um link de Fundador, um link geral de Liderança e um link de Time por setor selecionado.
- O link de Fundador fica restrito ao Superadmin da empresa. O criador Admin gerencia o diagnóstico, mas não recebe esse link.
- Cada link deve ter mensagem sugerida própria e ação de prévia pública em `/r/[token]`.
- `Encerrar coleta` chama a API e persiste `status = encerrado` no Supabase.
- `Baixar relatório` abre opções de PDF e CSV; `Baixar action points` aparece como ação contextual quando o diagnóstico já possui base de Fundador e relatório consolidável.
- `Baixar respostas CSV` aparece quando houver ao menos uma resposta, pois exporta dados brutos anônimos e não depende de base consolidável.
- Acompanhamento detalhado e lista de respondentes ficam para `/omdx/[id]/acompanhamento`.

## Insights por dimensão

- `/insights/[dimensao]` mostra uma visão agregada da dimensão em todos os diagnósticos.
- As seis páginas de dimensão usam o mesmo recuo horizontal de `/omdx` (`px-6 lg:px-10`), sem `max-width` ou centralização adicional no conteúdo.
- O filtro padrão é `Todos os diagnósticos`; o usuário pode selecionar um diagnóstico individual.
- Filtros de página ficam na `AppTopbar`, usando a área `actions`. Não renderize filtros globais dentro do corpo do dashboard.
- O filtro de diagnóstico em Insights controla a query string `?diagnostico=...`; `todos` remove o parâmetro.
- O MVP deve permanecer compacto: KPIs e tabela de perguntas.
- A tabela de perguntas usa `getDimensionQuestionResults()` e deve respeitar o filtro atual. Em `Todos os diagnósticos`, agrega por `dimensionId + text`; em diagnóstico individual, mostra apenas as perguntas daquele diagnóstico. A tabela fica diretamente no fluxo da página, com o mesmo contorno de 1 px em `foreground/10` dos cards e raio de 5 px, sem card, wrapper com overflow ou rolagem própria. As colunas visíveis são `Pergunta`, `Pontuação empilhada`, `Gap médio` e `Status`. O grupo analítico ocupa a porção direita da tabela, e cada título segue o conteúdo da coluna, com pontuação, gap e status alinhados à esquerda. A barra é renderizada com Apache ECharts, acumula as três médias em escala total de 0 a 15 e usa os mesmos tokens lime, lime deep e purple do chart empilhado do dashboard. A legenda não aparece acima da tabela; a identificação das camadas, os valores e o total ficam restritos ao tooltip. Camadas sem base permanecem ausentes.
- A prioridade continua calculada na camada de dados para ordenar internamente as perguntas, mas não aparece como coluna visual.
- Não adicionar recomendações profundas, riscos ou análise por item nesta etapa.

## Cálculo dos cards executivos

`OverviewExecutiveCards` é apenas componente de apresentação. Ele não calcula métricas; recebe `title`, `value`, `suffix`, `classification`, `description` e, quando disponível, `technicalDetail` prontos. A descrição não deve aparecer como texto fixo no card; detalhes explicativos ficam no tooltip do ícone de informação. As regras de cálculo ficam em:

- Overview (`/omdx`): `src/lib/data/omdx-overview-analytics.ts`, função interna `buildMetrics()`.
- Insights por dimensão (`/insights/[dimensao]`): `src/components/omdx/dimension-insight-dashboard.tsx`, função interna `buildDimensionMetrics()`, usando o resumo de `getDimensionInsightSummary()`.

### Cards do Overview

O Overview exibe três cards empilhados na primeira coluna da grade de analytics: raio de 5 px, título discreto e valor alinhado à esquerda, sem gauge, ícone ou status visível. Em `Todos os diagnósticos`, os valores consolidam todos os relatórios e a linha auxiliar compara o relatório mais recente com o imediatamente anterior. No filtro individual, quando há histórico anterior comparável, cada card mostra a variação percentual contra a média anterior; em `Risco`, redução é evolução positiva.

- **Maturidade geral**: média simples das seis dimensões, exibida na escala original `1-5` com uma casa decimal.
- **Risco**: média do índice de criticidade das seis dimensões, exibida na escala `0-100`. Quanto menor, melhor.
- **Base de respostas**: soma das respostas concluídas de Fundador, Liderança e Time em todos os diagnósticos incluídos no filtro.

### Cards dos Insights por dimensão

Os Insights exibem três cards: `Base de respostas`, `Maturidade da dimensão` e `Gap médio`. Eles usam raio de 5 px e removem gauges, ícone de informação e status. Apresentam título, número alinhado à esquerda e, quando existem pelo menos dois diagnósticos, uma linha percentual abaixo do valor. O comparativo usa o diagnóstico mais recente por `createdAt` contra a média de todos os anteriores; aumento usa seta ascendente e redução usa seta descendente. A linha não aparece ao filtrar um único diagnóstico.

- **Base de respostas**: quantidade de respostas do diagnóstico mais recente no filtro `Todos os diagnósticos`, acompanhada da variação percentual contra a média dos anteriores. Em diagnóstico individual, usa apenas o diagnóstico selecionado e não mostra comparação.
- **Maturidade da dimensão**: score do diagnóstico mais recente no filtro `Todos os diagnósticos`, exibido na escala original `1-5` e acompanhado da variação percentual contra a média dos anteriores. Em diagnóstico individual, usa o score selecionado sem comparação. A normalização por `normalizeLikertToIndex(score)` é usada apenas internamente para classificação.
- **Gap médio**: diferença entre a maior e a menor média de camada da dimensão no diagnóstico mais recente, em escala `0-5`. Quanto menor, melhor. Com pelo menos dois diagnósticos que tenham gap calculável, mostra a variação percentual contra a média dos anteriores; redução é evolução positiva.

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
