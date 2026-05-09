# `/docs` — Documentação do OMDx

Página autenticada de recurso para orientar o cliente administrador no uso do sistema.

## Propósito

- Funcionar como manual prático do produto, não como documentação técnica interna.
- Explicar onde cada área fica, para que serve e como operar o fluxo OMDx de ponta a ponta.
- Complementar `/metodologia`: metodologia explica o método; documentação explica o uso do sistema.

## Convenções

- Usar breadcrumb `Documentação`.
- Manter a página como Server Component; não usar `"use client"` sem interação real.
- Manter formato de página única com sumário lateral e âncoras internas.
- O sumário lateral pode usar `DocumentTableOfContents` como client component para rolagem suave e item ativo.
- Não criar rotas filhas nesta fase.
- Links finais podem apontar para `/omdx`, `/omdx/diagnosticos` e `/metodologia`.
