# `/docs` — Documentação de Maturidade

Página autenticada de recurso para orientar o cliente administrador no uso do sistema.

## Propósito

- Funcionar como manual prático do produto, não como documentação técnica interna.
- Explicar onde cada área fica, para que serve e como operar o fluxo Maturidade de ponta a ponta.
- Consolidar orientação operacional e conceitual de Maturidade em uma única página de documentação.

## Convenções

- Usar breadcrumb `Documentação`.
- Manter a página como Server Component; não usar `"use client"` sem interação real.
- A página pertence à aplicação do cliente e redireciona `superadmin` para `/admin/modulos`.
- Manter formato de página única com sumário lateral e âncoras internas.
- O sumário lateral pode usar `DocumentTableOfContents` como client component para rolagem suave e item ativo.
- Não criar rotas filhas nesta fase.
- Links finais podem apontar para `/omdx`, `/omdx/diagnosticos` e páginas de insights.
