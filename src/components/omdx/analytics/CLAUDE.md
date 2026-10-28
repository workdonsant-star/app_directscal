# `src/components/omdx/analytics` — Analytics em níveis de valor

Antes de editar, releia o `AGENTS.md`, `src/components/CLAUDE.md` e `src/components/omdx/CLAUDE.md`.

## Propósito

### Regra vigente do C1 — 24/10/2026

O cabeçalho agora é Percepção e acompanhamento. `CollectionReading` substitui o veredito visível. Desde a revisão de 26/10/2026, mostra somente a média das percepções na escala visual de 1 a 5 e o volume de respostas de Fundador, Liderança e Time, com total. Nome repetido da coleta, período, instrumento e parágrafos metodológicos foram removidos desse bloco por decisão do usuário. A régua usa marcador e número, sem estágio de maturidade nem referência universal mínima; as barras por nível partem de zero e compartilham o maior volume como escala, sem representar percentual de adesão. Zero respostas é exibido como zero; ausência de coleta mantém Sem dados e nenhuma contagem inventada. O operacional seleciona uma coleta; `todos` fica restrito a exemplos explícitos e soma as contagens das opções exibidas. Não há classificação de tipos de crise implementada no modelo; não inferir nem inventar categorias na apresentação. Classificações de estado saíram das duas tabelas; dimensões/perguntas orientam aprofundamento humano. Consultas aos ativos ficam separadas de execução e resultados. Dados ausentes não viram zero ou estimativa. Os componentes antigos e os cálculos internos continuam disponíveis para compatibilidade; as descrições históricas abaixo não governam mais a apresentação operacional. A política de grupos pequenos ainda depende de A16 e não é implementada por esta mudança visual.

Composição da página `/omdx` (e de `/exemplos/analytics`) em seis níveis, do que mais vale para o cliente ao detalhe:

| Nível | Pergunta do cliente | Componente | Dado |
| --- | --- | --- | --- |
| 1 · Veredito | Onde estou e para onde vou? | `AnalyticsVerdict` | Real: maturidade média, estado (`classifyScore`), variação em pontos, mínimo recomendado (`maturityCutoff`), desalinhamento, dimensões críticas, consenso, adoção dos ativos. Hierarquia: pontuação média, estado, barra 1–5 com a marca `mínimo`, sem frase de distância. A nota grande e o estado vêm só da pesquisa. Ilustrativo: progresso pelas ações (`verdict.progress`), segmento em `--overview-chart-progress` depois do roxo, com legenda que traz o valor (`Progresso pelas ações +0,2`), sem linha de origem. A adoção pondera o avanço (adoção 0% = +0,0); sem action points ou sem medição de adoção o estado é `sem_base` e não há número. `/exemplos/analytics?progresso=sem-uso` e `?progresso=sem-base` simulam os outros estados. |
| 2 · O que atacar e como está andando | O que faço primeiro e está andando? | `AnalyticsLeverTable` | Colunas: Alavanca, Nota e progresso, Aderência dos ativos, Ativos criados e Estado (`classifyScore` da nota). Real: três dimensões mais críticas, estado e nota. Ilustrativo: ativo vinculado, ativos criados, aderência e progresso pelas ações (`lever.progress`, mesma regra do veredito: avanço ponderado pela aderência; sem ativo não há progresso). A coluna Nota e progresso usa `ScoreProgressBar`, a mesma barra roxo + verde do veredito. Sem prioridade e sem execução. |
| 3 · Onde está o gap | Qual dimensão pesa mais? | `AnalyticsDimensionGapChart` | Real: notas ordenadas, média anterior e mínimo 3,5. Ilustrativo: progresso pelas ações nas dimensões que são alavancas (`dimension.progress`, o mesmo número da tabela de alavancas), com traço e círculo vazado em `--overview-chart-progress` e o valor `+0,6` após a nota. Legenda: Nota da pesquisa, Progresso pelas ações, Mínimo. |
| 4 · Quem vê diferente | Fundador, Liderança e Time concordam? | `AnalyticsLayerPerceptionChart` | Real. Gap a partir de 1,2 ponto destacado. |
| 5 · Onde dói, pergunta a pergunta | Qual prática falha? | `AnalyticsQuestionTable` | Colunas: Pergunta, Dimensão, Nota e progresso (`ScoreProgressBar`), Divergência e Estado (`classifyScore`). Real: top 5 por menor nota, dimensão, divergência entre camadas e estado. Ilustrativo: progresso pelas ações, o mesmo da alavanca da dimensão (`row.progress`). |
| 6 · Execução e impacto | As ações estão funcionando? | `ProcessUsageSection` | aderência dos ativos real, aberta por um card compacto (Adoção em destaque, sem barra de progresso; Cobertura, Utilidade, perguntas e lacunas em grade 2 × 2). |

Ordem visual: veredito; Dimensões gerenciais e Percepção por camada lado a lado; tabela de alavancas; vulnerabilidades por pergunta; aderência dos ativos.

`AnalyticsOverview` monta a página a partir de `buildAnalyticsOverview()` (`src/lib/data/omdx-analytics-overview.ts`). Os componentes só aplicam apresentação.

## Convenções

- Descrições dos gráficos em `AnalyticsCard` usam `text-balance` (`text-wrap: balance`), alinhadas à esquerda, para distribuir o texto de modo equilibrado entre as linhas, como o Balance do Figma. Não limitar a largura a 60%; essa tentativa foi substituída após esclarecimento do usuário. Títulos e área de plotagem preservam sua largura.

- **Dado ilustrativo é identificado nos charts e tabelas** pela tag `Ilustrativo`. A estimativa usa o token `--overview-chart-estimate`, forma vazada e traço tracejado; a coleta usa forma cheia. Retire a identificação apenas quando o dado vier do agente em produção.
- **Sem conversa do agente na interface.** A estimativa nasce das conversas no Slack, mas a página mostra só números e charts.
- **Os níveis não têm rótulo visível.** `AnalyticsLevel` mantém o título só para leitores de tela (`sr-only`) e a âncora; a ordem dos blocos comunica a hierarquia.
- **Um número aparece uma vez.** O veredito resume e aponta para o bloco que prova o número ("Ver"). Na aderência, os indicadores ficam no card de resumo; os charts abaixo não os repetem.
- **Tipografia por tokens.** Rótulo de métrica em `font-label text-ui-label`; título de card e tabela em `text-ui-title`; número de destaque em `text-ui-kpi`; corpo `text-sm`; legendas, eixos e descrições `text-xs`. Charts novos usam HTML posicionado ou SVG sem texto para que a fonte não distorça.
- **Cores.** Camadas usam `--overview-chart-founder/leadership/tactical`; dimensões `--overview-chart-dimensions`; estimativa `--overview-chart-estimate`; na matriz "Onde as ações estão dando resultado" o quadrante é lido pela posição e o ponto, em `--overview-chart-progress`, é cheio (ativo publicado, com sinal) ou vazado (sem ativo publicado ou sinal insuficiente). A legenda de pontos cheios/vazados fica imediatamente abaixo do parágrafo explicativo e antes do gráfico. Ver `../CHART_COLOR_SYSTEM.md`.
- Superfícies seguem `bg-sidebar dark:bg-card`, raio de 10px, sem borda nem sombra. Tabelas usam `Table variant="operational"`.
- Âncoras: `nivel-veredito`, `nivel-alavancas`, `nivel-gap`, `nivel-camadas`, `nivel-perguntas`, `nivel-execucao` e `aderencia-ativos`.

## Estados

- Sem dimensões: veredito vazio com orientação; alavancas, gap, camadas e perguntas mostram mensagens próprias; evolução sem série.
- Menos de duas camadas: percepção por camada pede mais respostas.
- Sem perguntas ao agente: aderência mostra "Nenhuma pergunta registrada".
- Alavanca sem sinal: "sinal insuficiente" e ponto vazado na matriz.

- Os gráficos "Onde as ações estão dando resultado" e "Evolução das perguntas tratadas" não são exibidos no Analytics nem no exemplo. A tabela de alavancas é seguida diretamente pelas vulnerabilidades por pergunta.


Desde 19/10/2026, o Analytics operacional não usa impacto ilustrativo: prioridades/notas reais permanecem e contagens/aderência/progresso sem evidência mostram Sem base. Apenas AnalyticsExampleDashboard passa illustrativeImpact. A separação de identidade app/Slack segue pendente em A09.

`/demo` também opta explicitamente pelo cenário ilustrativo. `AnalyticsOverview.actionPointsHref` permite manter a navegação dentro da demo; o padrão operacional continua `/action-points`.
