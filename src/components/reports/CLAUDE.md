# `src/components/reports` — Relatórios no app

Esta pasta contém a listagem e as experiências de leitura de relatórios dentro do produto.

## Convenções

- Relatórios são páginas nativas do app, não visualizadores de PDF ou HTML em `iframe`.
- `ReportsList` apresenta um card por diagnóstico analisável cuja entrega foi publicada. O card inteiro é um link acessível, mostra título, avatar e nome do responsável pela criação, e usa `closedAt ?? updatedAt` como data do relatório. Registros históricos sem autoria exibem um fallback explícito, sem atribuição inventada.
- Conteúdo deve herdar os tokens semânticos, a tipografia e os temas claro/escuro do sistema.
- Use fluxo contínuo e responsivo. Não reproduza folhas A4, paginação fixa, rodapés repetidos ou posicionamento absoluto de documentos exportáveis.
- O corpo do relatório acompanha toda a largura do seu contêiner, dimensionado em 80% da coluna central no desktop amplo; use sumário lateral apenas em desktop.
- O cabeçalho não usa eyebrow; o título principal vem sempre de `report.diagnostic.name`, preservando o nome mapeado do diagnóstico selecionado.
- Os seis gráficos do relatório usam ECharts: quatro barras em escala fixa de 0 a 5 e duas matrizes heatmap. Todos oferecem hover com tooltip, ênfase visual do item, cores dinâmicas por tema e descrição acessível; as matrizes mantêm também uma tabela somente para leitores de tela.
- A leitura de `/relatorios/[id]` exibe a identificação do especialista em um card compacto na coluna direita, com largura e densidade menores que o card de navegação.
- `OmdxReportView` recebe o `DiagnosticReport` autorizado e o conteúdo editorial da publicação. Deriva os seis gráficos do diagnóstico selecionado e aplica à leitura as seis seções salvas pelo especialista. Pontuações, camadas, dimensões, perguntas, mínimo recomendado, prioridades e textos editoriais publicados não podem voltar a datasets locais fixos.
