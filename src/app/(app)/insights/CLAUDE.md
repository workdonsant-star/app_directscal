# `/insights` — Insights por dimensão

## Propósito

Seção autenticada para analisar dados agregados de Maturidade por dimensão, cruzando todos os diagnósticos com opção de filtro por diagnóstico individual.

## Convenções locais

- `/insights` redireciona para `/insights/cultura`.
- As dimensões são raízes abertas diretamente pela sidebar e não exibem breadcrumb.
- A navegação lateral lista as seis dimensões como seção própria `Insights`.
- O estado de carregamento acompanha o leiaute atual em largura total: três KPIs numéricos sem gauge e tabela aberta de quatro colunas, sem card ou wrapper externo.
- O estado de conteúdo usa três métricas numéricas em grid com 16px de espaçamento, seguidas por uma tabela sem superfície própria, cabeçalho em `muted`, linhas de 55px e divisores inferiores de 0,5px nas quatro primeiras linhas; não há alternância de fundos.
- Nesta fase, todos os dados são mockados e consumidos por `src/lib/data/omdx-data-source.ts`, com contratos em `src/lib/contracts/`.
- Não adicionar recomendações profundas ou análise por item no MVP; manter dashboard compacto.

- Todas as tabelas visíveis usam o padrão das Dimensões de 06/10/2026 via `Table`: cabeçalho neutro de 44px com raio de 5px, padding horizontal de 16px, linhas de pelo menos 55px e divisórias de 0,5px entre linhas, sem borda externa nem fundo no hover. Conteúdo documental pode ampliar a altura; o editor preserva a indicação de células selecionadas.
