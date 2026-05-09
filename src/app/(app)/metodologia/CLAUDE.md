# `/metodologia` — Metodologia OMDx

Página autenticada de recurso para explicar o método OMDx em linguagem executiva.

## Propósito

- Explicar como o diagnóstico funciona em formato documental, como artigo de referência.
- Apresentar dimensões, camadas de percepção, escala Likert e leitura dos resultados.
- Servir como referência consultiva para o cliente administrador antes de criar ou interpretar diagnósticos.

## Convenções

- Usar breadcrumb `Metodologia`.
- Manter a página como Server Component; não usar `"use client"` sem interação real.
- O sumário lateral pode usar `DocumentTableOfContents` como client component para rolagem suave e item ativo.
- Ler dimensões, grupos e escala pela camada `src/lib/data/omdx-data-source.ts`. Não importar `mock-data.ts` na página.
- Não detalhar fórmulas de cálculo nesta primeira versão.
- Evitar layout de dashboard ou grid de cards; priorizar leitura contínua, sumário lateral e seções textuais.
- O CTA final pode apontar para `/omdx/diagnosticos`, mas a página não deve virar fluxo operacional.
