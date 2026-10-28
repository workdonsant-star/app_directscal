# `/omdx` — Maturidade por camadas

## Propósito

C1/M04: a experiência operacional mostra Percepção e acompanhamento e seleciona a coleta mais recente por closedAt/createdAt. O parâmetro legado todos passa a selecionar a última coleta, sem consolidar instrumentos. Referências históricas exigem mesma empresa, instrumento e perguntas; a tela explicita limites de público/período. CollectionReading substitui o Veredito e consulta aos ativos fica distinta de execução. Estas regras substituem a descrição histórica abaixo.

Raiz executiva do módulo Maturidade. Desde 18/10/2026 a página segue seis níveis de valor para o cliente, montados por `AnalyticsOverview` (`src/components/omdx/analytics/`): 1 · Veredito, 2 · O que atacar e como está andando, 3 · Onde está o gap, 4 · Quem vê diferente, 5 · Onde dói, pergunta a pergunta e 6 · Execução e impacto, com a aderência dos ativos ao final do nível 6. Notas, camadas, perguntas e aderência vêm dos dados reais; execução das alavancas, uso do ativo, estimativa do agente e evolução são ilustrativos e identificados como tal (ver `docs/analytics-impacto.md`).

## Convenções locais

- Não usar breadcrumb nesta rota.
- Não adicionar tabela completa, criação ou configuração de diagnóstico aqui; isso fica em `/omdx/diagnosticos`.
- A ação `Baixar relatório` aponta para o diagnóstico mais recente com relatório consolidável e abre opções de PDF e CSV.
- O filtro de diagnóstico usa o query param `diagnostico`. Em `todos`, cards, barras e heatmaps consolidam todos os diagnósticos reportáveis: a base soma as respostas e as pontuações usam a média agregada, sem referência histórica separada. Ao selecionar um diagnóstico específico, todo o dashboard usa apenas esse diagnóstico e a referência considera somente os diagnósticos anteriores a ele.
- A ordem temporal usa `closedAt` quando disponível e `createdAt` como fallback. Mudanças posteriores em `updatedAt` não devem reordenar a série histórica.
- A composição visual antes servida em `/omdx/camadas` passa a ser a página principal em `/omdx`, sem breadcrumb. A URL antiga preserva o filtro e redireciona para a raiz.
- CTAs contextuais, como `Baixar relatório`, ficam na `AppTopbar` via `actions`, não no header do conteúdo.
- A topbar e o título de navegador de `/omdx` mostram `Analytics`; o cabeçalho dos resultados mostra `Resultado de coletas` e o texto introdutório da escala de 1 a 5. Não exibe legenda global. No filtro individual, as barras representam o diagnóstico selecionado e os traços neutros, identificados nos tooltips, representam a média dos anteriores; em `todos`, as barras são a consolidação integral e não exibem traços históricos.
- Os antigos cards `Maturidade geral`, `Risco` e `Base de respostas` deram lugar ao Veredito: maturidade geral em `text-ui-kpi`, variação em pontos contra a média dos anteriores (só no filtro individual com histórico), estado, mínimo recomendado 3,5 e as linhas Desalinhamento, Dimensões críticas, Consenso interno e Adoção dos ativos, que apontam para o bloco que as prova. Sem frase-resumo e sem impacto das ações.
- Os níveis não exibem rótulo nem divisória; o título fica só para leitores de tela.
- O módulo Pessoas foi removido da navegação e das rotas autenticadas. O Overview não deve redirecionar para `/pessoas`.
- A seção `Aderência dos ativos de gestão` fica no nível 6, depois da matriz de execução e da evolução. Um card de resumo no formato do veredito abre a seção (Adoção em destaque; Cobertura, Utilidade, perguntas e lacunas em linhas) e os dois charts vêm abaixo, sem repetir esses números. Ela não depende do filtro de diagnóstico. Falha na leitura desses dados não derruba o Overview: o nível 6 mostra só os charts de impacto e o veredito exibe "Sem base" na adoção.
- O cabeçalho do conteúdo mostra `Maturidade e execução` com o filtro de diagnóstico.

## Referência visual de 04/10/2026

Frame `252:545` do DirectScal App. AppPage mantém 40px nas laterais desktop e 32px na vertical; topbar alinhada ao conteúdo. Seções e grids usam 16px de intervalo. Charts de aderência em duas colunas, cards de 490px e chart semanal de 360px; maturidade em três colunas, cards de 490px e visualizações de 389px. Em larguras menores, os grids empilham; aderência mantém no mínimo 490px e cresce quando a descrição precisa de mais linhas. O filtro de diagnóstico aparece somente no cabeçalho dos resultados, usando o query param `diagnostico`; não modifica a aderência dos ativos. A topbar não duplica o seletor. A apresentação `distilled` do workspace admin permanece com seus cinco visuais anteriores.

O loading usa `bg-sidebar dark:bg-card`, acompanhando as superfícies de conteúdo do frame escuro `272:2` sem alterar o tema claro.

`/omdx?exemplo=uso` abre uma visualização autenticada para capturas, somente com a seção de aderência preenchida por `buildProcessUsageExample`. Reutiliza os componentes e temas reais; não consulta nem modifica métricas reais e não depende de diagnósticos disponíveis. A navegação normal `/omdx` mantém sua leitura original.

A visualização explícita `?exemplo=uso` também mostra o Analytics completo e mantém o filtro de diagnóstico sobre os dados fictícios.


Downloads por [id] exigem publicação: relatório recebe as seis seções editoriais aprovadas; Action Points usa o mesmo recorte deduplicado do painel e nega rascunhos. As rotas continuam autenticadas e bloqueiam superadmin global.
