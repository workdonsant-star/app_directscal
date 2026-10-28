# `src/lib/pdf` — Renderização de relatórios PDF

## Propósito

Esta pasta concentra documentos e helpers de geração de PDF do app. As responsabilidades atuais são o relatório executivo de Maturidade e o documento de action points RACI, ambos renderizados com `@react-pdf/renderer` a partir dos DTOs consolidados em `src/lib/data/`.

## Convenções

- Não buscar dados diretamente aqui. Receba objetos já consolidados pela camada `src/lib/data/`.
- Manter layout e copy em pt-BR, com tom consultivo e direto.
- Usar valores de marca Directscal como constantes locais do documento, já que PDF não consome os tokens CSS do app.
- Evitar HTML/CSS do navegador, Tailwind, DOM APIs, `window.print()` ou dependências de browser.
- O Route Handler decide status HTTP, nome de arquivo e headers. O documento decide apenas páginas, estrutura e conteúdo.


OmdxReportDocument aceita editorial com as seis seções publicadas; a rota real sempre fornece publication.report. ExecutiveReading usa report-findings para não inventar gargalo em base uniforme. O PDF de Action Points recebe buildPublishedActionPlan e recusa download antes da publicação.

C1: a análise editorial reserva 82pt no topo de cada página para o cabeçalho fixo. O título de seção solicita espaço para o início do texto; conteúdo longo pode continuar em páginas seguintes sem invadir cabeçalho/rodapé. Não usar apenas margem no primeiro bloco, pois ela não protege páginas de continuação.

## Relatório formatado e dados da pesquisa

`OmdxEditorialReportDocument` é o relatório de diagnóstico A4 retrato, baseado no modelo `Gerador de Diagnósticos/diagnostico-omdx-modelo-figma.html`: capa, coluna editorial, quatro gráficos de barras e duas matrizes. Consome as seis seções publicadas e `buildNativeReportCharts`; não copia textos, números, foto ou especialista fictícios do modelo. A paginação acompanha o texto, sem quantidade fixa de páginas. `OmdxReportDocument` preserva o documento anterior de dados detalhados.

`report-typography.ts` espelha `doc-title` 36/40px, `doc-h2` 24/32px e `doc-h3` 20/28px em pontos (px × 0,75), família Plus Jakarta Sans e peso 700. Corpo e gráficos usam Funnel Sans. Assets locais em `assets/`, incluídos no tracing de produção e no empacotamento da demo. PDF tem superfície branca de impressão nos dois temas do app. Capa tem altura A4 explícita; cabeçalho/rodapé usam posição superior explícita para não depender da medição de elementos absolutos pelo renderer.
