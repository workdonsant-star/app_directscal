# `/omdx` — Overview

## Propósito

Raiz executiva do módulo OMDx. A página aparece na UI como `Overview` e mostra leitura consolidada, KPIs e maturidade por dimensão sem virar área operacional.

## Convenções locais

- Não usar breadcrumb nesta rota.
- Não adicionar tabela completa, criação ou configuração de diagnóstico aqui; isso fica em `/omdx/diagnosticos`.
- A ação `Baixar relatório` aponta para o diagnóstico mais recente com relatório consolidável, liberado a partir de uma resposta de Fundador.
- O filtro de diagnóstico usa o query param `diagnostico`, com `todos` como consolidação dos diagnósticos reportáveis.
- CTAs contextuais, como `Baixar relatório`, ficam na `AppTopbar` via `actions`, não no header do conteúdo.
