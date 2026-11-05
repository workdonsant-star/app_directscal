# `/insights/[dimensao]` — Dashboard de uma dimensão

Esta rota é apenas compatibilidade: redireciona para `/omdx?dimensao=<id>#nivel-perguntas`, preservando `diagnostico` quando informado. Dimensão inválida volta à aba Cultura.

## Propósito

Página dinâmica para visualizar o resumo agregado de uma dimensão de Maturidade e filtrar por diagnóstico específico.

## Convenções locais

- Validar o parâmetro com `isDimensionId`.
- Se a dimensão for inválida, mostrar estado "Dimensão não encontrada" com retorno para `/insights/cultura`.
- Usar `DimensionInsightDashboard` para a interface principal.
- Não acessar backend; os dados vêm dos mocks agregados.
