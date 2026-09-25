# `/relatorios/[id]` — Leitura de relatório

Esta rota autenticada abre um relatório selecionado na listagem de `/relatorios`.

## Convenções

- O parâmetro `id` identifica um diagnóstico autorizado que já possui base para análise e uma entrega publicada; ids ausentes, não publicados ou sem relatório retornam `notFound()`.
- O breadcrumb deve preservar o retorno para `Relatórios` e identificar o item pelo título obrigatório do diagnóstico.
- A leitura permanece nativa e contínua, com sumário lateral e um card compacto de especialista na coluna direita nos breakpoints já definidos.
- A coluna esquerda inclui, abaixo do sumário, CTAs com largura baseada no conteúdo: `Action Points` direciona para a agenda autenticada em `/gantt`, e `Baixar PDF` baixa o relatório consolidado em `/omdx/[id]/relatorio`.
- `OmdxReportView` recebe o relatório consolidado autorizado e o conteúdo editorial persistido na publicação, usando os dados do diagnóstico em todos os gráficos.
- A publicação persistida é a porta de entrada da leitura e do download; a elegibilidade analítica isolada não torna o relatório visível ao cliente.
