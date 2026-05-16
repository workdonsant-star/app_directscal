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
| `DimensionBarChart` | `dimension-bar-chart.tsx` | Dashboard (card "Maturidade por dimensão") | Lê scores pela camada `src/lib/data/`. |
| `StatusBadge` | `status-badge.tsx` | Tabela de diagnósticos | 3 estados: `rascunho`, `ativo`, `encerrado`. |
| `DiagnosticsTable` | `diagnostics-table.tsx` | Área de diagnósticos | Tabs de filtro, três colunas para copiar links públicos por grupo e menu com configuração de rascunho/exclusão. Rascunhos não exibem links. |
| `DeleteDiagnosticDialog` | `delete-diagnostic-dialog.tsx` | Área de diagnósticos | Confirma exclusão mockada antes de remover item da lista local. |
| `DiagnosticForm` | `diagnostic-form.tsx` | Drawer de criação/configuração | Formulário client-side mockado com validação mínima e resumo objetivo. Não exibe lista completa de dimensões nem escala Likert. |
| `LikertScalePreview` | `likert-scale-preview.tsx` | Disponível para telas futuras | Visual da escala 1-5 do template selecionado. Não é exibido no drawer atual. |
| `DimensionsSummary` | `dimensions-summary.tsx` | Disponível para telas futuras | Resumo compacto das 6 dimensões avaliadas. Não é exibido no drawer atual. |
| `DiagnosticsWorkspace` | `diagnostics-workspace.tsx` | `/omdx/diagnosticos` | Controla lista, ações e drawer de criação/configuração. |
| `ShareWorkspace` | `share-workspace.tsx` | `/omdx/[id]/compartilhar` | Central client-side de coleta com estado local para cópia e encerramento mockado. |
| `ShareLinks` | `share-links.tsx` | Compartilhamento | Cards por grupo com link, prévia e mensagem sugerida. |
| `ResponseCounters` | `response-counters.tsx` | Compartilhar e acompanhamento futuro | Total de respostas, respostas por grupo e aviso de suficiência. |
| `DimensionInsightWorkspace` | `dimension-insight-workspace.tsx` | `/insights/[dimensao]` | Controla o filtro da dimensão, renderiza topbar e injeta o dashboard. |
| `DimensionInsightDashboard` | `dimension-insight-dashboard.tsx` | `/insights/[dimensao]` | Dashboard compacto por dimensão, recebendo o diagnóstico filtrado por prop. |
| `DimensionDiagnosticFilter` | `dimension-diagnostic-filter.tsx` | Topbar de Insights | Select do sistema para alternar entre todos os diagnósticos e diagnóstico individual. Deve ser usado apenas na topbar. |
| `DimensionScoreTrend` | `dimension-score-trend.tsx` | Insights | Barras comparando a dimensão entre diagnósticos. |
| `LayerInsightComparison` | `layer-insight-comparison.tsx` | Insights | Comparação entre fundador, liderança e operação. |

## Convenções de domínio

- **Linguagem visível ao usuário** segue o vocabulário Directscal: "estruturação", "operação", "diagnóstico", "alavancagem", "modelo", "escala". **Nunca** "transformação digital", "DNA", "jornada", "incrível".
- **Sentence case** em títulos, botões e labels. Sem ponto de exclamação.
- **Score 1-5** sempre formatado com **uma casa decimal** (`(3.4).toFixed(1)`), com vírgula em pt-BR quando aplicável (formatação automática se vier de `toLocaleString("pt-BR")`).
- **Classificação** vem da função `classifyScore()` em `src/lib/data/omdx-data-source.ts`. Não inline a regra em componente.
- **Cores de score:** brand blue para ≥ 3, `--chart-negative` (vermelho) para < 3. Não use semáforo verde-amarelo-vermelho cheio — vai contra o registro da marca.
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

Quando criar, **adicione à tabela acima** e mantenha contratos, data-source e mocks coerentes.

## Estados a cobrir

Cada componente que mostra dados precisa lidar com pelo menos:
- **Sem dado** (ex.: diagnóstico sem respostas, grupo sem respondentes)
- **Dado parcial** (ex.: respostas insuficientes para gerar resultado)
- **Dado completo**

Para o respondente (futuro), prever:
- Link inválido
- Link expirado
- Já respondeu

## Fluxo de criação/configuração

- `/omdx` é dashboard executivo e não deve conter o formulário nem a tabela operacional completa.
- `/omdx/diagnosticos` é a área operacional para listar, filtrar e agir sobre diagnósticos, acessada pela sidebar.
- `Criar diagnóstico` abre o drawer lateral em modo criação.
- `Continuar configuração` abre o drawer lateral em modo edição preenchido com o rascunho.
- O drawer deve manter o formulário enxuto: campos, template, resumo da configuração, grupos e ações. Não exibir a lista completa de dimensões nem a escala Likert no fluxo atual.
- `Salvar como rascunho` valida o mínimo necessário e fecha o drawer em estado mockado.
- `Ativar diagnóstico` valida e mostra, no próprio drawer, os 3 links por grupo: fundador, liderança e operação.
- A tabela operacional também deve expor ações de copiar link por grupo em colunas próprias quando o diagnóstico não estiver em rascunho.
- O menu de três pontos da tabela deve ser enxuto: `Continuar configuração` apenas em rascunhos e `Excluir` para todos os diagnósticos, sempre com confirmação.
- `Baixar relatório` e `Baixar action points` aparecem na tabela apenas para diagnósticos com resultado consolidável (`generalScore` e dados de relatório disponíveis).
- O dashboard não deve exibir CTA para `/omdx/diagnosticos`; a navegação principal fica na sidebar.
- Não criar páginas visíveis para criação/configuração; se rotas antigas existirem, tratá-las como temporárias/deprecated.

## Fluxo de compartilhamento

- `/omdx/[id]/compartilhar` é uma central compacta de coleta, não uma lista completa de respondentes.
- Mostrar 3 links por grupo: fundador, liderança e operação.
- Cada link deve ter mensagem sugerida própria e ação de prévia pública em `/r/[token]`.
- `Encerrar coleta` é estado local mockado nesta fase; não há persistência real.
- `Baixar relatório` e `Baixar action points` aparecem como ações contextuais quando o diagnóstico já possui relatório consolidável.
- Acompanhamento detalhado e lista de respondentes ficam para `/omdx/[id]/acompanhamento`.

## Insights por dimensão

- `/insights/[dimensao]` mostra uma visão agregada da dimensão em todos os diagnósticos.
- O filtro padrão é `Todos os diagnósticos`; o usuário pode selecionar um diagnóstico individual.
- Filtros de página ficam na `AppTopbar`, usando a área `actions`. Não renderize filtros globais dentro do corpo do dashboard.
- O filtro de diagnóstico em Insights controla a query string `?diagnostico=...`; `todos` remove o parâmetro.
- O MVP deve permanecer compacto: KPIs, comparação por diagnóstico, percepção por camada e leitura executiva curta.
- Não adicionar recomendações profundas, riscos ou análise por item nesta etapa.

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
