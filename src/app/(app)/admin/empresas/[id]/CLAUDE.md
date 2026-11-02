# `/admin/empresas/[id]` — Detalhe operacional da empresa

Página dedicada para visualizar contexto da empresa, especialista principal, entregas e acessos.

O cabeçalho oferece `Visão geral`, `Arquivos` e `Action points` para empresas com organização. A visão geral espelha os componentes e cálculos do Analytics do cliente, com relatórios e consultas filtrados pela organização da URL e leitura administrativa autorizada. Pastas, uploads em modal e o editor anterior ficam em Arquivos, sempre com organização fixa. Action points lê as ações publicadas e a revisão vigente das rotinas, agrupadas por responsável. As rotas antigas de Operação e Rotinas permanecem acessíveis por URL, sem abas no cabeçalho.

O breadcrumb de todas as páginas sob esta empresa termina no nome da empresa. As abas e os títulos internos mostram a seção atual.

Visão geral e Arquivos usam o mesmo intervalo de 32 px entre o título da empresa e `AdminCompanyTabs`. A primeira aba reserva largura estável para que a troca do peso da fonte não desloque Arquivos.

Na visão administrativa, o nome da empresa não recebe subtítulo explicativo. O Analytics usa `concise`: títulos e dados permanecem, sem parágrafos introdutórios ou descrições redundantes dos gráficos. A apresentação do cliente mantém o texto próprio.

A visão geral resolve a empresa sem consultar a RPC de entregas; essa leitura pertence apenas à aba Operação. Assim um erro da operação não impede ver os dados analíticos.

## Convenções locais

- A empresa possui um especialista principal nesta primeira versão.
- A atribuição persiste pelo PATCH administrativo com versão esperada. O especialista principal sugere novas entregas sem reatribuir publicações antigas.
- Diagnósticos encerrados aparecem como entregas na aba Operação e levam ao workspace de análise.
- O controle de acesso a módulos pertence ao detalhe da empresa, não à navegação principal do admin.

C2: Entregas no Slack usa SlackDeliveriesPanel com a API por empresa. Falha confirmada pode ser recuperada após confirmação; Incerto exige revisão humana sem reenvio. Guia de operação abre /admin/guia.

Contexto e diretório de especialistas são carregados em paralelo após autorização. SpecialistsProvider evita que o seletor e o nome atribuído comecem vazios.
