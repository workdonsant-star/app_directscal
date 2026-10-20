# `src/components/reports` — Relatórios no app

Esta pasta contém a listagem e as experiências de leitura de relatórios dentro do produto.

## Convenções

- Relatórios são páginas nativas do app, não visualizadores de PDF ou HTML em `iframe`.
- `ReportsList` apresenta um card por diagnóstico analisável cuja entrega foi publicada. O card inteiro é um link acessível, mostra título, avatar e nome do responsável pela criação, e usa `closedAt ?? updatedAt` como data do relatório. Registros históricos sem autoria exibem um fallback explícito, sem atribuição inventada.
- Conteúdo deve herdar os tokens semânticos, a tipografia e os temas claro/escuro do sistema.
- Use fluxo contínuo e responsivo. Não reproduza folhas A4, paginação fixa, rodapés repetidos ou posicionamento absoluto de documentos exportáveis.
- A leitura segue os ativos de gestão: grid de até 1028px, índice de 220px, gap de 40px e artigo de até 768px a partir de lg; sem card ao redor do índice. Título 36/40px, H2 28/36px, H3 18/28px, corpo 15/25px e seções com 32px de respiro.
- O cabeçalho não usa eyebrow; o título principal vem sempre de `report.diagnostic.name`, preservando o nome mapeado do diagnóstico selecionado.
- Os seis gráficos do relatório usam ECharts: quatro barras em escala fixa de 0 a 5 e duas matrizes heatmap. Todos oferecem hover com tooltip, ênfase visual do item, cores dinâmicas por tema e descrição acessível; as matrizes mantêm também uma tabela somente para leitores de tela.
- Em `/relatorios/[id]`, ações e identificação do especialista ficam abaixo do índice, preservando a coluna documental.
- `OmdxReportView` recebe o `DiagnosticReport` autorizado e o conteúdo editorial da publicação. Deriva os seis gráficos do diagnóstico selecionado e aplica à leitura as seis seções salvas pelo especialista. Pontuações, camadas, dimensões, perguntas, mínimo recomendado, prioridades e textos editoriais publicados não podem voltar a datasets locais fixos.

- O card `exemplo-acme` identifica explicitamente a empresa fictícia e o relatório de exemplo. A leitura reutiliza OmdxReportView com DTO e editorial dedicados, sem atribuir autoria ou especialista real.

- Cards de Diagnósticos seguem o padrão de ManagementAssetsLibrary: altura mínima de 277px, raio de 5px, superfície bg-sidebar/dark:bg-card sem ring, badge acima do título e autoria/data abaixo da divisória. Preservam identificação explícita do exemplo e fallback de autoria.


- Relatórios de maturidade oferecem somente Baixar PDF, abaixo do sumário e acima do artigo em larguras compactas. ReportPdfDownload usa attachment autenticado: /omdx/[id]/relatorio para reais e /relatorios/exemplo-acme/download para o exemplo, ambos com OmdxReportDocument. Ativos de gestão preservam Markdown.


Fechamento A08: listas fixas de desafios, causas e cronologia foram removidas. report-findings compara pontuações reais, distingue base uniforme e aponta prioridades sem afirmar causalidade. As seis seções editoriais aprovadas também entram no PDF. O link de Action Points conserva a coleta.


A11: SpecialistContactCard recebe contato mínimo resolvido pelo specialistId publicado; não tem identidade, experiência, local ou telefone fixos. Usa e-mail de trabalho cadastrado. Ausência de atribuição ou especialista arquivado/inativo/excluído não inventa substituto. A leitura mobile oferece o mesmo contato.
