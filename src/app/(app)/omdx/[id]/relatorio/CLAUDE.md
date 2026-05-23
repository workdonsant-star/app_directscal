# `/omdx/[id]/relatorio` — Download de relatório

## Propósito

Route Handler autenticado para baixar o relatório consolidado de um diagnóstico OMDx em PDF ou CSV.

## Convenções locais

- Não renderizar página visual nesta rota; o segmento expõe apenas `route.ts`.
- Usar runtime Node para suportar `@react-pdf/renderer` no PDF.
- Validar o cookie de sessão na própria rota, pois Route Handlers não herdam o layout autenticado.
- Resolver dados exclusivamente por `src/lib/data/omdx-data-source.ts`.
- Retornar `401` sem sessão, `404` quando o diagnóstico não existir e `409` quando existir, mas ainda não tiver resultado consolidável com base de Fundador.
- Sem query, retornar PDF como attachment direto, não preview HTML e não usar `window.print()`.
- Com `?formato=csv`, retornar CSV consolidado do relatório como attachment UTF-8 com BOM e separado por `;`.
- O CSV consolidado usa o DTO `DiagnosticReport`; não substitui `/omdx/[id]/respostas`, que permanece como exportação bruta anônima.
