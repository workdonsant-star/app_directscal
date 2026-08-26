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
- O filtro de diagnóstico usa o query param `diagnostico`. Em `todos`, o dashboard mostra o diagnóstico reportável mais recente e compara os três charts superiores com a média de todos os anteriores. Ao selecionar um diagnóstico específico, a referência considera apenas os diagnósticos anteriores a ele.
- A ordem temporal usa `closedAt` quando disponível e `createdAt` como fallback. Mudanças posteriores em `updatedAt` não devem reordenar a série histórica.
- A composição visual antes servida em `/omdx/camadas` passa a ser a página principal em `/omdx`, sem breadcrumb. A URL antiga preserva o filtro e redireciona para a raiz.
- CTAs contextuais, como `Baixar relatório`, ficam na `AppTopbar` via `actions`, não no header do conteúdo.
- O módulo Pessoas foi removido da navegação e das rotas autenticadas. O Overview não deve redirecionar para `/pessoas`.
