# `src/components/action-points` — Visão de aderência

## Propósito

Componentes da nova superfície de **Action Points por aderência** na rota `/action-points`.
A tela mostra, numa lista hierárquica inspirada na lista de iniciativas do Linear,
**como os ativos de gestão estão sendo mantidos pelos líderes**, em **duas camadas**:
Categoria (ativo de gestão) → Action point. Cada action point é um comportamento
recorrente (ritual, feedback, alinhamento) que mantém a prática viva, não uma tarefa
que se conclui uma vez.

Estado atual: **demonstração frontend com dados fictícios**. O backend do modelo
(vínculo ativo↔action point, aderência vinda do agente no Slack, frequências do
catálogo) ainda não existe — ver seção 18 de
`docs/experiencia-agentica-projetos-e-action-points.md`. O caminho de dados reais
anterior (`getPublishedActionPointsWorkspace`, `getActionPointExecution` e
`src/components/gantt/ActionPointsWorkspace`) continua preservado no repositório para
religar quando esse backend existir; não foi apagado.

## Arquivos

- `action-points-adherence-view.tsx` — Client Component principal. Recebe `board`
  (`AdherenceBoard`) por prop. Monta os cards de resumo (Em dia, Em atenção, Em risco,
  Aguardando resposta), o seletor de filtro (`TabsList variant="selector"`: Todos,
  Precisam de atenção, Aguardando resposta), a árvore de duas camadas em
  `Table variant="operational"` com expandir/recolher por categoria, e abre o painel de
  detalhe ao clicar num action point.
- **Linha de hierarquia (estilo Linear):** um trilho vertical desce do ícone da
  categoria e passa por todos os action points, com um cotovelo até cada item, na **cor
  da categoria** (`RAIL_LEFT` alinhado ao centro do ícone). **Sem hover de fundo** nas
  linhas e **sem divisória horizontal** entre itens — a tabela sobrescreve
  `[&_tbody_td]:border-b-0` e o realce de `has-[aria-expanded]`.
- `adherence-ui.tsx` — Server-safe. Peças de apresentação compartilhadas: `categoryMeta`
  (ícone e cor por categoria), `CategoryIcon`, `HealthBadge` (faixa de aderência + seta
  de tendência), `LeaderCell`, `DistributionDots`, `EvidenceCell` e `LastCheckInCell`.
- `adherence-sheet.tsx` — painel lateral (`Sheet`) com o detalhe de um action point:
  aderência atual, por que existe, ativo vinculado + versão, frequência/modo,
  responsável, evidência no período e o feed de check-ins.

Os dados e os helpers puros (`buildActionPointsAdherenceExample`, `rollupHealth`,
`countActionPoints`, `flattenActionPoints`, rótulos) ficam em
`src/lib/data/action-points-adherence-example.ts`.

## Convenções locais

- **Implantação ≠ manutenção.** A faixa representa **aderência/manutenção** (pode subir
  e cair), não progresso rumo a "concluído". Um action point de manutenção nunca fecha.
- **A frequência decide a medida.** Ritual periódico mostra `feito/total` no ciclo com
  barra; action point por evento (`Conforme ocorrência`, `Por entrega`, etc.) mostra um
  rótulo livre, **sem barra falsa**, porque não há denominador.
- **Estados próprios, nunca zero.** `Aguardando` (líder sem resposta) e `Parado` (sem
  responsável) são estados de aderência distintos; não contam como falha nem como 0%.
- **Honestidade do sinal.** A aderência é relato do líder ao agente, não verificação
  automática. O painel marca cada check-in como `Relato do líder` ou `Agente` e repete o
  aviso. Não apresentar relato como fato comprovado.
- **Cor por categoria é só reforço.** O ícone da categoria usa o token de cor
  (`text-ap-comunicacao`, `text-ap-pessoas`, `text-ap-processos`, `text-ap-governanca`,
  definidos nos dois temas em `globals.css`); nunca pintar fundo de bloco. Faixas de
  saúde usam os tokens de status da Maturidade (`--omdx-status-consistente`,
  `--omdx-status-atencao`, `--omdx-status-critico`) via `healthMeta`, conforme
  `src/components/omdx/CHART_COLOR_SYSTEM.md`: a cor fica só no ícone, no ponto, na barra
  e no anel do avatar (`tone`, `dot`, `bar`, `border`). Rótulos, contagens e percentuais
  usam `healthMeta[...].text` (`text-foreground`, ou `text-muted-foreground` em Aguardando e
  Parado). A aderência média por responsável usa `text-sm font-medium`, o mesmo peso
  visual do rótulo de status, e não um número de destaque.
- `Table variant="operational"` e `TabsList variant="selector"`, sem Card em volta da
  tabela, `tabular-nums` em números, foco visível e contraste em claro e escuro.
- Não importar `mock-data.ts`; os dados vêm por prop a partir da fonte de exemplo.

## Listagem do Figma — 277:1550

`action-points-list-group.tsx` reúne as linhas do ativo e dos seus action points,
reutilizado pela tabela de aderência. O cabeçalho inteiro é o botão de expansão;
cada título de action point abre o painel existente. Mantém `aria-expanded`, foco
visível, ícone de 26px, texto de 14/20px e metadados de 12/16px. As linhas têm 53px
para preservar o ritmo dos conectores. O trilho fica no centro do ícone e termina
no último item visível após a filtragem. Comunicação usa os SVGs locais exportados
do Figma em `public/action-points`; outras categorias preservam seus tokens e ícones.
A mudança é visual, sem alterar a origem demonstrativa ou persistência dos dados.

Os conectores usam CSS em todas as categorias: trilho vertical contínuo pela altura real da célula, com sobreposição de 1px entre linhas e cotovelos independentes. Somente o último item encerra o trilho na curva. Não usar SVG de altura fixa para os ramos; títulos com quebra de linha e filtros devem preservar a continuidade.

O trilho do cabeçalho começa em 28px, após o círculo de 26px com margem superior de 2px, em todas as categorias. Não desenhar o trilho por trás do ícone: fundos translúcidos devem permanecer livres da linha.

A tabela mantém 16px de respiro entre o cabeçalho e o primeiro grupo, com linha espaçadora decorativa (`aria-hidden`) de cinco colunas. O espaço permanece ao filtrar, sem deslocar os conectores internos dos grupos.

A primeira célula dos grupos e subitens remove o padding esquerdo: a borda do ícone alinha com a borda externa esquerda do cabeçalho. Trilho em 13px e nós em 46px preservam a geometria interna, sem alterar as demais colunas.

Expansão usa Motion já instalado: AnimatePresence mantém as linhas durante a saída. O conteúdo inteiro de cada subitem (nó, título, frequência e todas as colunas) aparece em cascata de 60ms, com opacity/translateY de 4px e duração de 160ms; fechamento inverte a ordem. Conectores são CSS estático, sem desenho, escala ou recorte animados. Reduced motion zera duração, deslocamento e atrasos. Sem animar altura de tabela.

Cada grupo reserva 24px após suas linhas, com espaçador decorativo de cinco colunas. A separação vale aberto ou recolhido e não altera a distância entre subitens nem prolonga o trilho.

A página começa pelos indicadores, sem parágrafo introdutório acima deles. A origem declarativa da aderência continua informada no rodapé e no painel de detalhe.

Os quatro indicadores reutilizam `OverviewExecutiveCards` com `presentation="overview"`, o mesmo componente e apresentação de Analytics. Não manter cards locais duplicados; preservar contagens de aderência sem comparações fictícias.

Os indicadores mantêm pontos de 8px junto aos títulos pelo titleDotClassName do componente compartilhado: positivo, atenção, negativo e neutro, respectivamente.

O painel de detalhe ocupa 640px no desktop e a largura disponível no mobile. Overrides de largura usam o mesmo seletor data-side do Sheet para superar o limite padrão de 384px. Cabeçalho fixo com espaço para fechar, título de 20px, corpo rolável e nomes dos ativos sem truncamento.

No recolhimento, o trecho do trilho abaixo do ícone desaparece por opacidade no mesmo intervalo do primeiro subitem (o último a sair na cascata inversa). Não removê-lo abruptamente ao clicar nem mantê-lo visível após a saída do conteúdo. A altura de cada subitem diminui durante sua saída, deslocando os grupos seguintes progressivamente.

O recolhimento sincroniza a cascata de conteúdo com a altura dos wrappers internos das cinco células (auto → 0, 220ms). Células de subitens usam altura automática, com conteúdo interno mínimo de 53px. Isso faz conectores e grupos seguintes subirem durante a saída; não esperar o fade completo para retirar a altura. A animação de altura é uma exceção solicitada para esse fluxo, sem desenho animado do trilho.

- Hovers usam cores neutras, nunca azul: texto `foreground` e superfícies `action-neutral-hover` com texto `action-neutral-foreground`. O sumário documental também mantém o item ativo em `foreground`, branco no escuro e escuro no claro.

## Versão 2 por responsável

`action-points-people-view.tsx` agrupa a mesma fonte por responsável, com fotos locais demonstrativas, anel de média dos ciclos e expansão diretamente nos action points. Reutiliza painel e células de aderência. Média aritmética de percentuais periódicos informados, sem eventos ou estados sem medição; limiares 80/50 e anel neutro sem média. Filtros preservam contexto completo do responsável. Padrão em `/action-points`, também disponível em `/action-points/v2`, sem gravações. Sem links de alternância de versão na interface; componente por ativo preservado.


Na visão por responsável, a expansão mostra uma lista contínua de action points diretamente sob a pessoa, com o início dos títulos e frequências alinhado ao nome da pessoa. Não exibe subcategorias, títulos de ativos, versões ou contagem de iniciativas no resumo da pessoa. O vínculo com o ativo permanece nos dados e no painel de detalhe ao abrir a ação. Sem cabeçalho visual interno; rótulos das colunas permanecem apenas para leitores de tela. Pessoa e action points usam uma única tabela e o mesmo colgroup (43/24/15/18%), com grupos tbody separados para expansão acessível. Não criar tabela interna: o recuo é aplicado somente ao conteúdo da primeira célula, nunca à grade inteira. As três colunas de dados compartilham os mesmos alinhamentos entre pessoa e ações. Divisórias dos títulos começam no mesmo recuo do texto; células numéricas preservam padding de 16px.

A frequência aparece como texto secundário de 12px logo abaixo do título de cada action point, na mesma célula. Não existe coluna separada de frequência; a expansão tem quatro colunas: ação/frequência, aderência, ciclo/evidência e último check-in.

Quando a pessoa está expandida, as quatro células do seu resumo não exibem borda inferior, ligando visualmente a pessoa às ações. A regra alcança somente as células diretas desse resumo; divisórias entre action points e entre responsáveis recolhidos permanecem.

A primeira célula expandida não tem padding próprio; o bloco interno recebe recuo e padding vertical, alinhando título e frequência ao início da divisória. O último action point não tem divisória própria; um espaçador de 24px separa a próxima pessoa.

O recuo dos action points é 78px em todas as larguras: 16px da célula + 50px do avatar com anel + gap de 12px. O avatar não encolhe. As setas de expansão foram removidas; o botão com perfil e nome continua expandindo/recolhendo com aria-expanded e teclado. O círculo do perfil alinha ao início do cabeçalho da coluna (padding de 16px). Nomes, títulos, frequências e início das divisórias compartilham esse alinhamento; as demais colunas permanecem na grade comum.

O anel do perfil tem 2px, diretamente junto à foto, sem padding entre ambos. A foto mede 46px e o conjunto permanece com 50px para preservar os alinhamentos. A borda neutra interna do Avatar é desativada somente nessa apresentação.

No resumo da pessoa, Distribuição mostra somente bolinhas e contagens por estado, sem HealthBadge ou alerta agregado acima. Os estados individuais dos action points e o anel da foto permanecem.

Cores de estado: um único mapa `healthMeta` (tokens `--omdx-status-*`) controla ícone, bolinha, barra e anel; textos, contagens e percentuais ficam neutros (ver Convenções locais e `CHART_COLOR_SYSTEM.md`). Não usar cores literais nos componentes.

## Timeline de atualizações

O painel compartilhado mostra cabeçalho com ativo/versão e action point, status e frequência compactos, seguido pela conversa. Lista sem cards, com trilho de 1px, autor, mensagem, horário e rótulo textual. Agente usa primary no ícone/rótulo e ap-comunicacao no tema escuro para contraste; respostas usam tons neutros. Não reconstruir perguntas no componente: cada entrada vem de checkIns, mantendo a ordem da fonte. Contexto extenso, evidência agregada e chips redundantes saem do painel. Estado vazio explícito; rodapé mantém a origem declarativa do sinal. Continua demonstração frontend, sem nova integração Slack.

Na lista por pessoa, os status dos action points não exibem setas ou traços de tendência. O ícone de estado e o rótulo permanecem; tendência continua disponível no painel de detalhe.

O resumo da aderência média mostra somente o percentual ou Sem média. Não exibe contagem de itens com ciclo informado nem subtítulo abaixo do valor.

As superfícies por pessoa, por ativo e o painel compartilham HealthBadge, EvidenceCell e DistributionDots. Indicadores da visão por ativo também usam ap-positive/ap-attention/ap-negative. Dados descritivos (nome, título, frequência, horário e conversa) preservam seus tokens neutros; azul da autoria do agente é uma função distinta.

Timeline segue a densidade do audit log: círculos de 36px com borda neutra e bg-popover (mesma superfície do painel), autor semibold e mensagem neutra na mesma linha com quebra natural. Rótulo e horário juntos na segunda linha, intervalo de 24px entre entradas e trilho central de 1px. Azul distingue pergunta do agente por ícone e rótulo; autoria continua neutra. Sem divisor extra entre status e timeline.


## Cascata por responsável

A visão por pessoa usa Motion já instalado. AnimatePresence mantém o tbody de ações durante a saída; abertura em ordem crescente e fechamento na ordem inversa, com intervalo de 40ms e duração de 180ms por item. As quatro células animam juntas, com fade/deslocamento de 4px e altura dos wrappers internos (não do tr), para os responsáveis seguintes se moverem gradualmente. Essa animação de altura segue a exceção de disclosure já usada na lista por ativo. Grade, cores e recuo de 78px permanecem. O resumo não recupera a divisória enquanto seu tbody de ações ainda está saindo. useIsPresent torna os itens em saída inert e aria-hidden; reduced motion zera duração, atrasos e deslocamento. Reabrir durante saída reutiliza a mesma chave e reverte a transição. Não há dependência nova nem mudança nos dados.

## Evolução Figma 282:1322

Painel segue status/frequência → título → resumo contextual (why) → atualizações, sem cabeçalho duplicado de ativo ou rodapé visível. Título de 20px bold limitado a 371px; resumo de 14/20px limitado a 531px. Status sem tendência. Agente usa círculo azul de 36px com símbolo branco original em public/action-points/agent-mark.svg (21,445 × 13px, extraído do frame); pessoa usa UserRound neutro. Autoria acima da mensagem, mantendo respostas curtas na mesma linha. Resumo descreve a prática e sua importância operacional para a empresa; vem da fonte, sem inferência no componente.

As respostas na timeline usam a mesma foto local da listagem por responsável, em Avatar de 36px; sem foto disponível, mostram iniciais. O mapa demonstrativo adherenceLeaderPhotos fica na fonte de dados e é compartilhado entre as duas superfícies. O agente conserva o símbolo DirectScal no círculo azul.

Todos os blocos de mensagem da timeline, do agente ou da pessoa, têm max-width de 460px. A mesma regra vale para a primeira entrada e para respostas curtas; em telas estreitas, o bloco encolhe com a área disponível.

A visão por responsável não exibe mais o seletor Todos / Precisam de atenção / Aguardando resposta. Todos os grupos são sempre apresentados, incluindo Sem responsável. Expansão e painel de conversa permanecem disponíveis.


## Versão 3 por liderança (18/10/2026)

Substitui as regras anteriores da visão por responsável onde houver conflito (recuo de 78px, anel no avatar, frequência sob o título, colgroup 43/24/15/18).

- **Abertura:** título `Action points` e uma frase gerada dos dados ("N de M action points em dia" e, se houver, a liderança que concentra itens em risco).
- **Resumo de aderência geral** (`AdherenceSummary`, `bg-card`, sem borda): número principal em `text-ui-kpi`, meta de 80% (`ADHERENCE_TARGET`) e uma barra de distribuição única (consistente, atenção, em risco, aguardando) com legenda e contagens. É o único número de destaque da tela.
- **Tabela de quatro colunas, as mesmas nos dois níveis** (colgroup 40/26/18/16):
  - Liderança: chevron, avatar de 32px, nome, setor e quantidade. No subitem, o nome do action point, alinhado ao nome da pessoa (recuo de 88px), que abre o painel.
  - Aderência: barra com a meta tracejada e o percentual (`AdherenceBar`). No subitem, quadrados por ciclo esperado preenchidos quando cumpridos e "x de y" (`CycleCell`). Eventos mostram o rótulo, sem barra falsa.
  - Situação: `DistributionDots` na pessoa; ponto e rótulo de status (`HealthLabel`) no subitem.
  - Último relato: o relato mais recente entre os itens da pessoa (`checkInAgeHours` escolhe pelos rótulos relativos da demonstração); no item, o próprio.
- **Ordem:** lideranças da menor para a maior aderência; sem medida e "Sem responsável" ao fim.
- **Sem linha de tendência em tabela.** Frequência, ativo e versão ficam no painel de detalhe.
- Helpers puros em `src/lib/data/action-points-adherence-example.ts`: `ADHERENCE_TARGET`, `cycleRatio`, `averageAdherence`, `checkInAgeHours`.


Desde 19/10/2026, /action-points e /action-points/v2 recebem buildPublishedActionPointsBoard; exemplos permanecem isolados. Responsáveis reais agrupam por team ID + user ID, com nome/foto da atribuição. Progresso de implantação não vira aderência; ciclos e conversas permanecem vazios até existir evidência recorrente. O download preserva a coleta da publicação.


A distribuição separa Parado/Sem responsável de Em risco. Ausência de atribuição ou medição não equivale a falha de rotina. A tela operacional não mostra uma meta como se já houvesse aferição recorrente.

A04: routine-agreements.tsx é componente servidor adicional abaixo da lista existente. Mostra título, responsável, situação, origem, expectativa, cadência, setor, indicador e versão acordada do ativo. Link explicita que abre a publicação vigente. Não apresenta acordo como execução medida nem carrega payload administrativo.

A05: acordo diário é rotulado Diária, de segunda a sexta, refletindo o calendário concreto. Isso não acrescenta relato, cumprimento ou aderência ao painel sem evidência.


A06: dados operacionais agora incluem contagens reais por oportunidade e conversa registrada. Resumo usa Execução relatada em janela de trinta dias; exemplo conserva sua média e meta. Alvo de 80% não é aplicado à operação. Painel existente não usa fotos demonstrativas para pessoas reais e distingue mensagem recebida de mensagem entregue do agente. routine-execution-records, servidor dentro do acordo, preserva histórico completo, proposta pendente/cancelada/confirmada, evidências HTTPS, revisões e total histórico do acordo. Não apresenta leitura/progresso como execução validada. Revisão visual desta mudança permanece pendente por falha na conexão do navegador.


A07: detalhe do ciclo inclui decisões humanas autorizadas, com ator/motivo/data e prazo de retorno separado do prazo original. Validação/exceção continuam nos fatos de origem. Não apresentar orientação gravada no app como mensagem entregue no Slack.

O download da visão por liderança passa pela resolução de URLs de AppRuntimeProvider, identidade por padrão. Na apresentação, source e dados de rotina vêm do cenário fictício; o componente visual é o mesmo do produto.

C1/A01: Sem medição é uma ausência de base, separada da situação Sem responsável. Por decisão de 26/10/2026, o retorno ao relatório foi removido da abertura. `ActionPointsDownload` aparece exclusivamente nas actions da AppTopbar, com o diagnosticId da fonte publicada e URL resolvida pelo runtime. Sem fonte publicada, não há botão de download.


C1: o detalhe recebe a descrição recomendada da ação publicada, idêntica à fonte do PDF de Action Points. A leitura do consultor permanece separada como contexto; exemplos sem descrição mantêm o resumo existente.

O detalhe operacional também mostra responsável, etapa, prazo acordado e andamento da implantação. Prazo sugerido da publicação permanece identificado como sugestão; percentual de implantação não representa execução recorrente. Sem atribuição, prazo/andamento são ausentes, nunca zero inventado.
