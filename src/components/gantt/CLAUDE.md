# `src/components/gantt` — Componentes de Action Points

## Propósito

Componentes da página Action Points (rota `/action-points`; a pasta e os contratos mantêm o nome histórico `gantt`). A superfície principal é uma lista gerencial em árvore, inspirada na lista de iniciativas do Linear: um pai agrega os filhos e o clique abre os detalhes e a execução. Os nomes `GanttTask` e `GanttWorkspaceData` do contrato continuam por compatibilidade, mas não devem aparecer na interface.

## `ActionPointsWorkspace`

Client Component. Recebe `tasks`, `diagnosticId`, `assignments`, `events`, `today` (YYYY-MM-DD, vindo do servidor), `sourceLabel`, `canEdit` e `slackStatus`. Usa helpers puros de `src/lib/data/action-points-list.ts` para juntar a seleção publicada às atribuições, marcar atrasos e agrupar.

- Abas `TabsList variant="selector"`, com contagem: Em andamento (Em implementação e Bloqueado), Planejados (Sem responsável e Atribuído), Concluídos e Todos.
- `Select` Agrupar por: Dimensão (padrão, menor nota primeiro), Responsável (quem não tem responsável por último) ou Prazo (mês do prazo). Agrupar por responsável mostra a carga de cada pessoa.
- `Table variant="operational"` com Nome, Responsável (avatar do Slack e nome), Progresso (barra e %), Prazo (com `Atrasado` quando vencido e não concluído), Etapa e Última interação (Hoje, Ontem, Há N dias ou a data). A prioridade fica no painel e na ordenação. A linha do grupo mostra nota (por dimensão), quantidade, progresso médio, próximo prazo, quantos estão em andamento e a última interação do grupo; é recolhível (`aria-expanded`). A linha filha mostra o título da ação do catálogo e a descrição como subtítulo.
- Estado vazio sem entrega publicada: texto simples, sem CTA.

## `ActionPointSheet` e `ExecutionForm`

Painel lateral de até 672px (padrão do `ProjectTaskSheet`). Abre com Responsável, Etapa, Prazo, Progresso, Última interação e Prioridade; logo abaixo vem a Atividade, o log da ação (`ActionPointTimeline`). Para quem edita, o formulário Execução reúne responsável (seletor do Slack), etapa, cadência, progresso (0 a 100% em passos de 5; concluir fecha em 100%), início, prazo (campos de data usam `onInput`) e uma nota opcional, com Salvar e Remover responsável. O formulário é remontado quando o responsável muda (`key`). Erros do servidor aparecem em texto no próprio formulário; após salvar, `router.refresh()` traz o estado novo.

Abaixo ficam Por que existe (leitura do especialista, ou o problema do diagnóstico, mais nota e gap), O que fazer, O que resolve, Como saber que funcionou e Prazo sugerido.

## `ActionPointTimeline`

Log vertical no estilo de feed de atividades: ícone circular por tipo, "**Autor** frase de ação", detalhe opcional, etiqueta do tipo (Responsável, Etapa, Prazo, Andamento, Nota, Resposta ao agente) e horário, do mais novo ao mais antigo. As etiquetas azuis usam `action-primary-highlight` para manter contraste no escuro. O tipo `resposta` já está previsto para as respostas do líder ao agente no Slack; nada o grava ainda, e hoje o autor dos registros é a pessoa que editou no app.

## `SlackUserPicker`

Busca `/api/action-points/slack-users` ao abrir, filtra por nome no cliente e devolve `{ userId, name, avatarUrl }`. O servidor repete a consulta do usuário no Slack ao salvar; nome e foto nunca vêm do navegador.

## `action-point-badges.tsx`

Etapa (ícone + rótulo), prioridade (ícone de sinal + rótulo), avatar e célula do responsável. O texto carrega o significado; a cor do ícone é só reforço (`text-primary`, `text-chart-negative`, `text-chart-positive`).

## `CalendarWorkspace` (fora de uso)

`calendar-workspace.tsx` é a agenda semanal anterior e não é mais renderizada. Posicionava os itens em horas fictícias porque o dado só tem data. Fica reservado como ponto de partida de uma visão Calendário futura, que deve ser refeita por dia e sem horas. Remova o arquivo se essa visão for descartada.

## Convenções locais

- Não importar `mock-data.ts`; os dados entram por props.
- O componente não decide o que entra: as ações vêm filtradas pela seleção publicada do gestor.
- Progresso e etapa são gravados pelo Superadmin da empresa; atraso é só um aviso calculado pelo prazo. Não apresente a etapa como andamento confirmado pela pessoa responsável enquanto o agente não registrar check-ins.
- Não reintroduzir barras, resize ou dependências do Gantt sem nova decisão explícita.
- Foco visível, botões semânticos, `cursor-pointer` e contraste em light e dark. Números alinháveis usam `tabular-nums`.

- Hovers usam cores neutras, nunca azul: texto `foreground` e superfícies `action-neutral-hover` com texto `action-neutral-foreground`. O sumário documental também mantém o item ativo em `foreground`, branco no escuro e escuro no claro.
