# `/omdx/[id]/action-points` — Download de action points PDF

## Propósito

Route Handler autenticado para baixar o PDF A4 retrato com plano de ação RACI do diagnóstico OMDx.

## Convenções locais

- Não renderizar página visual nesta rota; o segmento expõe apenas `route.ts`.
- Usar runtime Node para suportar `@react-pdf/renderer`.
- Validar o cookie de sessão na própria rota, pois Route Handlers não herdam o layout autenticado.
- Resolver dados exclusivamente por `getDiagnosticActionPlan()` em `src/lib/data/omdx-data-source.ts`.
- Retornar `401` sem sessão, `404` quando o diagnóstico não existir e `409` quando não houver dados consolidáveis com base de Fundador.
