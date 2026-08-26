# `src/components/gantt` — Componentes do cronograma

## Propósito

Componentes específicos da funcionalidade Cronograma. A rota histórica continua em `/gantt`, mas a superfície principal é um calendário semanal de action points, não uma visualização Gantt.

## `CalendarWorkspace`

Componente client-side que recebe as tarefas produzidas por `getLatestActionPlanGanttWorkspace()`, achata a frente raiz `Action points` e posiciona cada subitem na data de início. O contrato de dados ainda preserva os nomes `GanttTask` e `GanttWorkspaceData` enquanto a fonte do cronograma não for migrada; esses nomes não devem aparecer na interface.

### Estrutura do calendário

- Cabeçalho livre com título, origem do plano, botão `Hoje`, navegação semanal, intervalo do período e filtro por estado.
- Semana de segunda a domingo no eixo horizontal e faixa de `08:00` a `18:00` no eixo vertical.
- Cabeçalho dos dias e coluna de horários ficam sticky dentro do scroller do calendário.
- Fins de semana usam apenas fundo neutro sutil; dia e horário atuais usam o token `primary`.
- Cada action point vira um botão acessível. A seleção abre um `Dialog` com contexto, impacto esperado, indicador de sucesso, prioridade e prazo sugerido quando esses metadados existirem.
- Como o contrato atual registra apenas datas, o componente distribui deterministicamente os itens do mesmo dia em blocos sequenciais. Essa posição horária é somente da interface e não deve ser gravada ou tratada como agenda persistida.
- O fallback local existe apenas quando não há plano consolidável e deve usar datas relativas à semana atual.

## Convenções locais

- Não importar `mock-data.ts`; dados reais entram por props e o fallback de apresentação fica próximo do componente.
- Não reintroduzir barras, resize, dependências, frentes expansíveis ou ações de edição próprias do Gantt sem nova decisão explícita.
- Não envolver a grade em `Card`; o próprio calendário fornece borda, alinhamento e overflow.
- Use tokens semânticos para estado e preserve significado além da cor por meio dos rótulos no filtro e no diálogo.
- O calendário deve tolerar overflow horizontal no próprio wrapper sem criar scroll horizontal no documento.
- Preserve foco visível, botões semânticos, labels acessíveis em ações de ícone e contraste em light e dark.
