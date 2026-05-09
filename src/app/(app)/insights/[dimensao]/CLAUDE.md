# `/insights/[dimensao]` — Dashboard de uma dimensão

## Propósito

Página dinâmica para visualizar o resumo agregado de uma dimensão do OMDx e filtrar por diagnóstico específico.

## Convenções locais

- Validar o parâmetro com `isDimensionId`.
- Se a dimensão for inválida, mostrar estado "Dimensão não encontrada" com retorno para `/insights/cultura`.
- Usar `DimensionInsightDashboard` para a interface principal.
- Não acessar backend; os dados vêm dos mocks agregados.
