# `/omdx` — Maturidade por camadas

## Propósito

Raiz executiva do módulo Maturidade. A página mostra a comparação consolidada entre Fundador, Liderança e Operação, com três gráficos e duas matrizes analíticas, sem virar área operacional.

## Convenções locais

- Não usar breadcrumb nesta rota.
<<<<<<< Updated upstream
- Não adicionar tabela operacional completa, criação ou configuração de diagnóstico aqui; isso fica em `/omdx/diagnosticos`. A tabela compacta do Overview deve ficar restrita a dimensão, pontuação, status e gap.
- A ação `Baixar relatório` aponta para o diagnóstico mais recente com relatório consolidável, liberado a partir de uma resposta de Fundador.
=======
- Não adicionar tabela completa, criação ou configuração de diagnóstico aqui; isso fica em `/omdx/diagnosticos`.
- A ação `Baixar relatório` aponta para o diagnóstico mais recente com relatório consolidável e abre opções de PDF e CSV.
>>>>>>> Stashed changes
- O filtro de diagnóstico usa o query param `diagnostico`. Em `todos`, cards, barras e heatmaps consolidam todos os diagnósticos reportáveis: a base soma as respostas e as pontuações usam a média agregada, sem referência histórica separada. Ao selecionar um diagnóstico específico, todo o dashboard usa apenas esse diagnóstico e a referência considera somente os diagnósticos anteriores a ele.
- A ordem temporal usa `closedAt` quando disponível e `createdAt` como fallback. Mudanças posteriores em `updatedAt` não devem reordenar a série histórica.
- A composição visual antes servida em `/omdx/camadas` passa a ser a página principal em `/omdx`, sem breadcrumb. A URL antiga preserva o filtro e redireciona para a raiz.
- CTAs contextuais, como `Baixar relatório`, ficam na `AppTopbar` via `actions`, não no header do conteúdo.
- O cabeçalho de `/omdx` mostra `Overview` e o texto introdutório da escala de 1 a 5. Não exibe legenda global. No filtro individual, as barras representam o diagnóstico selecionado e os traços neutros, identificados nos tooltips, representam a média dos anteriores; em `todos`, as barras são a consolidação integral e não exibem traços históricos.
- Três cards numéricos aparecem antes dos charts, com o mesmo design das páginas de dimensão: `Base de respostas`, `Maturidade geral` e `Gap médio`. No filtro individual, havendo histórico anterior, exibem a variação percentual contra essa média. Em `todos`, preservam o valor consolidado e indicam a variação do relatório mais recente contra o imediatamente anterior. Queda do gap é positiva.
- O módulo Pessoas foi removido da navegação e das rotas autenticadas. O Overview não deve redirecionar para `/pessoas`.
