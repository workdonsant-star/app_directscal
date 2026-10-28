# `/relatorios/[id]` — Leitura de relatório

Esta rota autenticada abre um relatório selecionado na listagem de `/relatorios`.

## Convenções

- O parâmetro `id` identifica um diagnóstico autorizado que já possui base para análise e uma entrega publicada; ids ausentes, não publicados ou sem relatório retornam `notFound()`.
- O breadcrumb deve preservar o retorno para `Relatórios` e identificar o item pelo título obrigatório do diagnóstico.
- A leitura permanece nativa e contínua, com o mesmo grid dos ativos de gestão (220px + 40px + até 768px); índice sem borda e especialista abaixo das ações.
- A coluna esquerda inclui, abaixo do sumário, CTAs com largura baseada no conteúdo: `Action Points` direciona para a página autenticada em `/action-points`, e `Baixar PDF` baixa o relatório consolidado em `/omdx/[id]/relatorio`.
- `OmdxReportView` recebe o relatório consolidado autorizado e o conteúdo editorial persistido na publicação, usando os dados do diagnóstico em todos os gráficos.
- A publicação persistida é a porta de entrada da leitura e do download; a elegibilidade analítica isolada não torna o relatório visível ao cliente.

- Sumário lateral alinhado ao topo da coluna documental, sem padding superior; sticky usa `top-8` (32px), acompanhando o recuo do conteúdo no scroll interno do shell.


- Relatórios de maturidade oferecem somente Baixar PDF, abaixo do sumário e acima do artigo em larguras compactas. ReportPdfDownload usa attachment autenticado: /omdx/[id]/relatorio para reais e /relatorios/exemplo-acme/download para o exemplo, ambos com OmdxReportDocument. Ativos de gestão preservam Markdown.


A ação de Action Points inclui ?diagnostico=id, preservando o recorte da coleta. A leitura utiliza apenas o snapshot aprovado; revisões salvas permanecem privadas.


A11: contato usa exclusivamente specialistId da publicação autorizada, depois de confirmar empresa da publicação igual à do relatório. Nome, foto, título, localização e e-mail vêm do cadastro ativo. Não cai no principal atual nem em telefone fixo; cadastro indisponível produz mensagem explícita. Também é acessível na largura compacta.

A composição visual foi extraída para ReportWorkspace. A página preserva autorização, busca e vínculo da publicação e injeta os dados nesse componente compartilhado com a apresentação.
