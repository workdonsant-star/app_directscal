# Iniciativas — navegação e workspace

`InitiativeNavigation` mostra as iniciativas do usuário/empresa na sidebar, com ícones Lucide distintos por tipo. A lista `InitiativesWorkspace` oferece busca e criação em Dialog. `InitiativeForm` é compartilhado com a edição do projeto; mantém o contrato e o armazenamento local existentes. Falhas de gravação permanecem visíveis e não fecham o formulário.

## Projeto — opção 2

`InitiativeProjectPage` resolve o registro no escopo autenticado, compõe a topbar com o nome do projeto e preserva edição dos metadados. ID inexistente oferece retorno para a lista. `ProjectWorkspace` abre em Precisam de atenção com duas tabelas: Situações que precisam de você reúne decisões e bloqueios; Em produção reúne as demais tarefas não concluídas. As demais abas são Todas as tarefas (com busca), Atividade e Ativos relacionados. As tabelas usam `Table variant="operational"`, sem contorno externo ou Card; as abas usam `TabsList variant="selector"`. São os componentes `252:438`, `252:523` e `252:79` do frame `252:2` do Figma aprovado em 04/10/2026; ver `docs/padroes-de-tabelas-e-seletores.md`. Os nomes das colunas e a lógica das tarefas permanecem próprios do projeto.

Ambas as tabelas reutilizam `TaskTable`, com nome acessível, executor, prazo e acompanhamento. O clique na tarefa abre Progresso, com contexto da pendência e acesso a Tomada de decisão. Tarefas suspensas ficam em Todas as tarefas, fora das tabelas de atenção/produção. A primeira tabela mantém seu cabeçalho e uma mensagem específica quando não há pendências. Há 20px entre a descrição e a tabela e 40px entre as seções, conforme a nova referência.

A coluna Executor mostra avatar circular de 32px e nome, com gap de 8px, nas duas tabelas e em Todas as tarefas. Reutiliza `Avatar`, `AvatarImage` e `AvatarFallback`; foto ausente ou indisponível mostra as iniciais. O nome textual identifica a pessoa para leitores de tela; o avatar é decorativo. As fotos locais são ilustrativas dos executores fictícios, sem vínculo com contas reais ou busca externa em tempo de execução. Tarefas novas sem foto usam o mesmo fallback.

`ProjectTaskSheet` abre em Progresso, com Tomada de decisão e Detalhes no seletor compartilhado. O painel tem até 672px no desktop e largura integral no mobile. Usa `bg-background` para preservar contraste dos textos em ambos os temas, sem alterar o primitive global. `TaskProgressTimeline` mostra conector fino, ícone, autor, ação, contexto, categoria, origem e horário. Pendências mostram contexto e CTA para decidir; a aba usa vermelho, ícone e texto. Detalhes mantém status, prazo e resultado esperado. Aprovar exige conferir os critérios e conclui a tarefa; resolver bloqueio exige uma descrição e mantém a execução. Ambas as ações ficam em Tomada de decisão. Ajustes preservam o prazo original e retiram a confirmação anterior. Campos de data/hora usam `onInput`.

O botão Consultar agente abre uma prévia contextual, derivada das tarefas visíveis; não chama um modelo de IA. Ativos relacionados oferece um estado vazio e acesso à biblioteca publicada, sem inventar vínculos ou documentos.

## Limites e aparência

Esta é uma interface de demonstração escolhida pelo usuário, com cinco tarefas fictícias exclusivamente no projeto `novo-website`. Tarefas novas, decisões, comentários e prazos ficam em estado React e reiniciam ao recarregar ou navegar para outro projeto. Outros projetos começam sem tarefas. Não há integração, sincronização, API, envio ao Slack, escrita em tarefa externa nem execução periódica do agente. O rodapé e os painéis informam esses limites. Metadados da iniciativa continuam persistidos no navegador por usuário/empresa.

`project-workspace.css` define apenas tokens semânticos locais para confirmações e pendências, nos dois temas. No escuro, o azul de texto usa o highlight existente do design system para contraste AA. Shell, navegação, fontes e primitives existentes são preservados. Ícones não recebem fundos ornamentais, conforme AGENTS.md. Links compostos com Button usam `nativeButton={false}` e `render` do Base UI.

A especificação funcional e o acompanhamento proativo futuro estão em `docs/experiencia-agentica-projetos-e-action-points.md`. A comparação visual da opção 2 está em `design-qa.md` na raiz.

## Decisão do líder

`TaskDecisionPanel` oferece orientação, adiamento, suspensão e solicitação de call. O líder escolhe a ação e escreve a instrução. A resposta é determinística, sem modelo de IA. Preparar decisão não altera a tarefa; confirmar registra a decisão e dois eventos de comunicação preparados, marcados como Prévia / Não enviado na tarefa e na Atividade. Alterações não salvas em Detalhes impedem a preparação da decisão.

Adiar exige prazo posterior ao atual, preserva o prazo original e retira a confirmação anterior. Adiar, orientar e solicitar call conservam o impedimento ou a aprovação pendente. Solicitar call não cria reunião. Suspender mantém prazo e impedimento, retira a tarefa das duas tabelas de atenção/produção e conserva sua linha em Todas as tarefas. Retomar em Detalhes reapresenta a pendência preservada. Aprovação e resolução são ações locais, sem envio externo.

Critérios não substituem acesso à evidência da entrega, que dependerá da integração. Decisão registrada e mensagem preparada não significam aceite do executor, desbloqueio ou sincronização. Ver seção 17 do documento funcional.

- Todas as tabelas visíveis usam o padrão das Dimensões de 06/10/2026 via `Table`: cabeçalho neutro de 44px com raio de 5px, padding horizontal de 16px, linhas de pelo menos 55px e divisórias de 0,5px entre linhas, sem borda externa nem fundo no hover. Conteúdo documental pode ampliar a altura; o editor preserva a indicação de células selecionadas.
