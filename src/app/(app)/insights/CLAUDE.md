# `/insights` — Insights por dimensão

## Propósito

Seção autenticada para analisar dados agregados de Maturidade por dimensão, cruzando todos os diagnósticos com opção de filtro por diagnóstico individual.

## Convenções locais

- `/insights` redireciona para `/insights/cultura`.
- `/insights/[dimensao]` usa breadcrumb `Insights / Nome da dimensão`.
- A navegação lateral lista as seis dimensões como seção própria `Insights`.
- O estado de carregamento acompanha o leiaute atual em largura total: quatro KPIs numéricos sem gauge e tabela aberta de quatro colunas, sem card ou wrapper externo.
- Nesta fase, todos os dados são mockados e consumidos por `src/lib/data/omdx-data-source.ts`, com contratos em `src/lib/contracts/`.
- Não adicionar recomendações profundas ou análise por item no MVP; manter dashboard compacto.
