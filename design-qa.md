# Design QA

## Fonte visual e evidências

- Referência enviada pelo usuário: `/var/folders/lc/z_tkz2qd17nbgkzjxdqx91l80000gn/T/TemporaryItems/NSIRD_screencaptureui_JQuH35/Captura de Tela 2026-08-01 às 20.15.49.png` (`486 × 310` px).
- Implementação focada: `/private/tmp/directscal-dimension-score-card-light.png` (`1029 × 534` px).
- Visão completa em tema claro: `/private/tmp/directscal-camadas-dimensoes-light.png` (`1350 × 1315` px).
- Visão completa em tema escuro: `/private/tmp/directscal-camadas-dimensoes-dark.png` (`1350 × 1315` px).
- Comparação lado a lado: `/private/tmp/directscal-dimensoes-comparison.png` (`1100 × 380` px).
- Viewport validado: `1365 × 900` CSS px, densidade `1×`, estado `Todos os diagnósticos`.

## Superfícies de fidelidade

- Tipografia: identificação `Gráfico 2`, síntese em destaque, valores tabulares e rótulos compactos preservam a hierarquia da referência.
- Espaçamento e geometria: card com borda de `1px`, sem sombra; plotagem ampla, linhas horizontais e barras verticais sem radius interno.
- Cores: barras usam o cinza frio do conjunto canônico de dimensões; fundo, borda e texto usam tokens do produto em light e dark.
- Conteúdo: exibe Cultura, Visão, Comunicação, Processos, Liderança e Performance, em escala real de `0` a `5`, com síntese calculada a partir do filtro ativo.
- Assets: a referência não contém imagens ou ilustrações; nenhum asset visual precisou ser criado ou substituído.

## Interações e estados

- O filtro abre e apresenta `Todos os diagnósticos` e os dois diagnósticos disponíveis no ambiente local.
- Os dois gráficos ECharts renderizam em canvas, permanecem dentro do viewport e respondem à troca de tema.
- Navegação e conteúdo foram verificados em light e dark; não houve erro no console do navegador.

## Histórico de comparação

1. Primeira captura: os nomes completos das dimensões se sobrepunham no eixo X, classificado como P1.
2. Correção: o gráfico passou a consumir os nomes curtos canônicos das dimensões.
3. Nova comparação combinada: rótulos, valores, barras, síntese e espaçamento ficaram legíveis e coerentes com a referência.

final result: passed
