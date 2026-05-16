# `/omdx/[id]/relatorio` — Download de relatório PDF

## Propósito

Route Handler autenticado para baixar o relatório PDF consolidado de um diagnóstico OMDx.

## Convenções locais

- Não renderizar página visual nesta rota; o segmento expõe apenas `route.ts`.
- Usar runtime Node para suportar `@react-pdf/renderer`.
- Validar o cookie de sessão na própria rota, pois Route Handlers não herdam o layout autenticado.
- Resolver dados exclusivamente por `src/lib/data/omdx-data-source.ts`.
- Retornar `401` sem sessão, `404` quando o diagnóstico não existir e `409` quando existir, mas ainda não tiver resultado consolidável.
- O PDF é attachment direto, não preview HTML e não usa `window.print()`.
