# `/omdx` — Dashboard executivo OMDx

## Propósito

Raiz executiva do módulo OMDx. Mostra leitura consolidada, KPIs e maturidade por dimensão sem virar área operacional.

## Convenções locais

- Não usar breadcrumb nesta rota.
- Não adicionar tabela completa, criação ou configuração de diagnóstico aqui; isso fica em `/omdx/diagnosticos`.
- A ação `Baixar relatório` aponta para o diagnóstico mais recente com relatório consolidável.
- A página pode ter CTA para relatório ou metodologia, mas não deve substituir os fluxos operacionais da sidebar.
