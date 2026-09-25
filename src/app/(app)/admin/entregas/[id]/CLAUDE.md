# `/admin/entregas/[id]` — Workspace da entrega

Ambiente interno para interpretar dados consolidados, escrever o relatório, selecionar action points e revisar a publicação ao cliente.

## Convenções locais

- A entrega reúne relatório e action points em um único ciclo de publicação.
- Scores e gráficos são somente leitura; o especialista edita apenas a camada analítica.
- A aba Dados reutiliza a visão analítica do overview do cliente e acrescenta aprofundamento selecionável por dimensão, com critérios, camadas, gap e leitura editável do especialista.
- A aba Dados usa a apresentação destilada do dashboard: contexto e atribuição ficam em uma única faixa, KPIs repetidos são omitidos e os gráficos recebem títulos objetivos. A análise por dimensão usa navegação horizontal e conteúdo sem card externo.
- O contexto da entrega permite alternar entre diagnósticos da mesma empresa e baixar o PDF do relatório selecionado por uma rota exclusiva do superadmin.
- Action points do catálogo são sugestões. Somente itens selecionados entram na publicação.
- Relatório usa seções estruturadas para manter consistência entre especialistas e permitir exportação futura.
- Dados, scores e gráficos vêm do diagnóstico real consolidado no Supabase.
- Edição, leituras por dimensão, seleção de action points, atribuição e publicação são persistidas em `public.admin_deliveries`.
- Somente a ação explícita de publicação libera a listagem, leitura e download para os membros autorizados da empresa.
