# `/omdx/camadas` — Maturidade de Gestão por camadas

## Propósito

Dashboard autenticado que compara a pontuação consolidada de Fundador, Liderança e Operação e a pontuação das seis dimensões em escala de 1 a 5. A composição segue o frame Figma `OMDX / Camadas / Desktop / Dark` (`142:619`): três gráficos de barras no topo e duas matrizes analíticas abaixo.

## Convenções locais

- Consumir `getOmdxOverviewPageData()` e os campos preparados em `analytics`; não calcular médias, classificações ou prioridades na página.
- O filtro de diagnóstico fica na `AppTopbar` e usa o query param `diagnostico`, com `todos` como consolidação.
- O breadcrumb é `Maturidade / Camadas`.
- Os três primeiros gráficos usam ECharts e preservam a geometria, a ordem de categorias e a paleta medida no Figma: lima `#A8E017`, lima profundo `#6E9C11` e roxo `#7E21FF`. Os dados continuam respeitando a escala real do diagnóstico.
- A matriz de vulnerabilidades consolida as cinco perguntas de cada dimensão e usa `classifyScore()`; a matriz de alavancas mostra urgência de maturidade, alinhamento, consenso e prioridade para as quatro dimensões mais críticas.
- As matrizes podem rolar horizontalmente quando a largura não comportar as células; não comprimir labels até ficarem ilegíveis.
- Cobrir base vazia, base parcial e as três camadas completas sem inventar pontuações.
- A rota `/docs` permanece fora da sidebar e não é alterada por esta página.
