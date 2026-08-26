# `/gantt` — Cronograma

## Propósito

Tela autenticada para visualizar os action points do cronograma em um calendário semanal. A funcionalidade aparece na sidebar dentro do módulo `Maturidade` e preserva `/gantt` como rota própria por compatibilidade.

## Convenções locais

- A rota é interface de cronograma nesta fase; não persiste edição local em API ou banco e não chama API de IA.
- A rota pertence à aplicação do cliente e redireciona `superadmin` para `/admin/modulos`.
- Mantenha `Cronograma` como item de `Maturidade`; não promova para módulo próprio sem nova decisão explícita.
- Quando houver diagnóstico Maturidade consolidável, use `getLatestActionPlanGanttWorkspace()` como fonte temporária e converta os subitens da frente `Action points` em eventos do calendário.
- Use o mock dentro do componente de domínio apenas como fallback quando não houver plano de ação disponível.
- Mantenha a linguagem operacional: cronograma, action points, responsáveis, estados e prazos.
- A visualização deve priorizar a agenda semanal, com segunda a domingo no eixo horizontal e horários no eixo vertical.
- A grade destaca o dia e o horário atuais, diferencia fins de semana e abre os detalhes do action point ao selecionar um evento. Detalhes de implementação ficam em `src/components/gantt/CLAUDE.md`.
- Preserve o padrão de página autenticada com `AppTopbar`, mas use largura quase total para a grade ocupar mais espaço.
- Não envolver o calendário principal em `Card`; use a grade direta com overflow próprio.
- A página deve limitar o workspace a `calc(100svh - 4rem)`, altura restante abaixo da `AppTopbar` padrão, para a rolagem vertical e horizontal acontecer dentro do calendário.
