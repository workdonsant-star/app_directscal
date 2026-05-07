# `src/components/omdx` — Componentes do módulo OMDx

Antes de editar, releia o **AGENTS.md** da raiz, o `CLAUDE.md` de `src/components/` e este documento.

## Propósito

Componentes específicos do **OMDx — Diagnóstico de Maturidade Operacional**. São compostos a partir dos primitives em `src/components/ui/` e leem mock data de `src/lib/mock-data.ts`.

## Domínio em uma frase

OMDx avalia maturidade operacional em **6 dimensões** (Cultura, Visão, Comunicação, Processos, Liderança, Performance), respondidas via formulário Likert 1-5 por **3 grupos** (Sócios, Liderança, Time/Operação) — cada grupo com seu link público anônimo. O cliente administrador acompanha a coleta e lê o resultado executivo.

## Componentes atuais

| Componente | Arquivo | Onde é usado | Estado |
| --- | --- | --- | --- |
| `KpiCard` | `kpi-card.tsx` | Dashboard (4 cards de topo) | Funcional. Recebe `label`, `value`, `trend`, `trendValue`, `caption`, `hint`. |
| `DimensionBarChart` | `dimension-bar-chart.tsx` | Dashboard (card "Maturidade por dimensão") | Lê `lastDiagnosticDimensionScores` direto do mock. Quando vier API, virar `props`. |
| `StatusBadge` | `status-badge.tsx` | Tabela de diagnósticos | 3 estados: `rascunho`, `ativo`, `encerrado`. |
| `DiagnosticsTable` | `diagnostics-table.tsx` | Dashboard (lista de diagnósticos) | Tabs de filtro (todos/ativos/rascunhos/encerrados), ações por status. |

## Convenções de domínio

- **Linguagem visível ao usuário** segue o vocabulário Directscal: "estruturação", "operação", "diagnóstico", "alavancagem", "modelo", "escala". **Nunca** "transformação digital", "DNA", "jornada", "incrível".
- **Sentence case** em títulos, botões e labels. Sem ponto de exclamação.
- **Score 1-5** sempre formatado com **uma casa decimal** (`(3.4).toFixed(1)`), com vírgula em pt-BR quando aplicável (formatação automática se vier de `toLocaleString("pt-BR")`).
- **Classificação** vem da função `classifyScore()` em `mock-data.ts`. Não inline a regra em componente.
- **Cores de score:** brand blue para ≥ 3, `--chart-negative` (vermelho) para < 3. Não use semáforo verde-amarelo-vermelho cheio — vai contra o registro da marca.
- **Nomes humanos, não técnicos**, em títulos visíveis: "O que mais pesa no resultado", não "GraficoItensDimensao". O nome técnico fica no código.
- **Rótulos curtos** (`shortName` em `dimensions[]`) para gráficos. A pergunta completa vai em tooltip ou texto secundário.

## Componentes a construir

| Componente | Onde será usado | Observação |
| --- | --- | --- |
| `DiagnosticForm` | `/omdx/novo` e `/omdx/[id]/configurar` | Nome, empresa, descrição, prazo |
| `LikertScalePreview` | Página de criação | Visual da escala 1-5 |
| `DimensionsSummary` | Empty state da página inicial | 6 cards compactos com descrição curta |
| `ShareLinks` | `/omdx/[id]/compartilhar` | 3 links (sócios/liderança/time) com botão copiar e mensagem sugerida |
| `ResponseCounters` | Compartilhar e acompanhamento | Total + por grupo |
| `RespondentTable` | `/omdx/[id]/acompanhamento` | Lista de respondentes |
| `ScoreCard` | `/omdx/[id]/resultado` | Score geral + classificação + interpretação |
| `ExecutiveHighlights` | Resultado | 3 cards: maior gargalo / criticidade / prontidão |
| `LayerComparison` | Resultado | Comparação Sócios × Liderança × Time |
| `MisalignmentMatrix` | Resultado | Heatmap dimensão × camada |
| `ItemWeightChart` | Detalhe por dimensão | Barras horizontais com label curto + tooltip |
| `MisalignmentHighlight` | Detalhe por dimensão | Maior gap entre camadas |

Quando criar, **adicione à tabela acima** e mantenha o `mock-data.ts` coerente.

## Estados a cobrir

Cada componente que mostra dados precisa lidar com pelo menos:
- **Sem dado** (ex.: diagnóstico sem respostas, grupo sem respondentes)
- **Dado parcial** (ex.: respostas insuficientes para gerar resultado)
- **Dado completo**

Para o respondente (futuro), prever:
- Link inválido
- Link expirado
- Já respondeu

## Anti-padrões

- Importar `@base-ui/*` direto. Use sempre via `src/components/ui/`.
- Replicar `classifyScore` em vários lugares — está em `mock-data.ts`.
- Usar nomes técnicos como label visível.
- Pergunta Likert inteira em label de gráfico — vai em tooltip; label = `shortName`.
- Cards com sombra colorida ou gradiente.
- Cor única para representar valor numérico — use também posição (barra) e número.

## Quando o backend chegar

Os componentes desta pasta **não devem** mudar de forma. O que muda:
- Em vez de importar `mock-data.ts`, recebem dados via props ou via hook (`useDiagnostic(id)`).
- Estados `loading`/`error` ficam reais em vez de cosméticos.
- Tipos em `src/lib/types.ts` permanecem os mesmos.

Mantenha as fronteiras estáveis para essa transição ser uma troca de fonte, não um refactor.
