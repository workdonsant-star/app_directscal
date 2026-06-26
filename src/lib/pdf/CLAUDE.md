# `src/lib/pdf` — Renderização de relatórios PDF

## Propósito

Esta pasta concentra documentos e helpers de geração de PDF do app. As responsabilidades atuais são o relatório executivo de Maturidade e o documento de action points RACI, ambos renderizados com `@react-pdf/renderer` a partir dos DTOs consolidados em `src/lib/data/`.

## Convenções

- Não buscar dados diretamente aqui. Receba objetos já consolidados pela camada `src/lib/data/`.
- Manter layout e copy em pt-BR, com tom consultivo e direto.
- Usar valores de marca Directscal como constantes locais do documento, já que PDF não consome os tokens CSS do app.
- Evitar HTML/CSS do navegador, Tailwind, DOM APIs, `window.print()` ou dependências de browser.
- O Route Handler decide status HTTP, nome de arquivo e headers. O documento decide apenas páginas, estrutura e conteúdo.
