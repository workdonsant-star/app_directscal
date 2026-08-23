# `/omdx` — Overview

## Propósito

Raiz executiva do módulo Maturidade. A página aparece na UI como `Overview` e mostra leitura consolidada, KPIs, gráficos e uma tabela compacta de resultado por dimensão sem virar área operacional.

## Convenções locais

- Não usar breadcrumb nesta rota.
<<<<<<< Updated upstream
- Não adicionar tabela operacional completa, criação ou configuração de diagnóstico aqui; isso fica em `/omdx/diagnosticos`. A tabela compacta do Overview deve ficar restrita a dimensão, pontuação, status e gap.
- A ação `Baixar relatório` aponta para o diagnóstico mais recente com relatório consolidável, liberado a partir de uma resposta de Fundador.
=======
- Não adicionar tabela completa, criação ou configuração de diagnóstico aqui; isso fica em `/omdx/diagnosticos`.
- A ação `Baixar relatório` aponta para o diagnóstico mais recente com relatório consolidável e abre opções de PDF e CSV.
>>>>>>> Stashed changes
- O filtro de diagnóstico usa o query param `diagnostico`, com `todos` como consolidação dos diagnósticos reportáveis.
- `/omdx/camadas` é o dashboard complementar para comparar Fundador, Liderança e Time. A rota reutiliza o mesmo filtro e a mesma camada de analytics do Overview, com breadcrumb `Maturidade / Camadas`.
- CTAs contextuais, como `Baixar relatório`, ficam na `AppTopbar` via `actions`, não no header do conteúdo.
- O módulo Pessoas foi removido da navegação e das rotas autenticadas. O Overview não deve redirecionar para `/pessoas`.
