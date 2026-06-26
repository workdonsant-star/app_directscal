# `/gantt` — Cronograma

## Propósito

Tela autenticada para visualizar um cronograma operacional em formato Gantt. A funcionalidade aparece na sidebar dentro do módulo `Maturidade` e usa `/gantt` como rota própria.

## Convenções locais

- A rota é interface de cronograma nesta fase; não persiste edição local em API ou banco e não chama API de IA.
- Mantenha `Cronograma` como item de `Maturidade`; não promova para módulo próprio sem nova decisão explícita.
- Quando houver diagnóstico Maturidade consolidável, use `getLatestActionPlanGanttWorkspace()` para renderizar uma frente única `Action points`; cada action point gerado pelo motor quantitativo entra como subitem direto dessa frente.
- Use o mock dentro do componente de domínio apenas como fallback quando não houver plano de ação disponível.
- Mantenha a linguagem operacional: cronograma, frentes, responsáveis, marcos e prazos.
- A visualização deve priorizar leitura por semana e mês, com dias visíveis no eixo horizontal.
- A grade marca o dia atual com uma linha vertical de "Hoje", sombreia fins de semana e mostra progresso como preenchimento das barras (não só número). Detalhes de implementação ficam em `src/components/gantt/CLAUDE.md`.
- Preserve o padrão de página autenticada com `AppTopbar`, mas use largura quase total para a grade ocupar mais espaço.
- Não envolver a linha do tempo principal em `Card`; use wrapper direto com borda e overflow horizontal.
- A página deve limitar o workspace a `calc(100svh - 4rem)`, altura restante abaixo da `AppTopbar` padrão, para a rolagem acontecer dentro do cronograma e manter o footer `Adicionar frente` fixo no rodapé da área.
