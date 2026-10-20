# Relatório de exemplo — Acme

Rota estática autenticada `/relatorios/exemplo-acme`, exclusiva da superfície cliente. Reutiliza OmdxReportView e o sumário nativo, com dados fictícios explícitos e textos editoriais próprios. Sem consultas de diagnóstico, publicação, escrita no banco, especialista real ou vínculo com Action Points reais. A listagem inclui o exemplo separado pela identificação de empresa fictícia.

Segue o layout dos ativos de gestão: índice sem card, coluna de 220px, gap de 40px e artigo de até 768px. Identificação fictícia e data no cabeçalho compacto; sem banner separado.

- Sumário lateral alinhado ao topo da coluna documental, sem padding superior; sticky usa `top-8` (32px), acompanhando o recuo do conteúdo no scroll interno do shell.


- Relatórios de maturidade oferecem somente Baixar PDF, abaixo do sumário e acima do artigo em larguras compactas. ReportPdfDownload usa attachment autenticado: /omdx/[id]/relatorio para reais e /relatorios/exemplo-acme/download para o exemplo, ambos com OmdxReportDocument. Ativos de gestão preservam Markdown.
