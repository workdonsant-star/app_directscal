# /iniciativas/[id]

Detalhe de iniciativa local convertido no workspace de projeto da opção 2 escolhida pelo usuário. Mantém a autorização existente e parâmetros assíncronos do Next 16. O servidor fornece ID, escopo e nome de exibição da sessão, sem transportar e-mail ou dados de integração.

`InitiativeProjectPage` resolve o registro no navegador e compõe AppTopbar com breadcrumb Iniciativas / Nome do projeto, fora de AppPage. O conteúdo mantém as margens e o shell Symbach. Edição dos metadados reutiliza o armazenamento existente. ID inexistente mostra retorno para a lista e não cria registro.

Tarefas e acompanhamento são demonstrações frontend, com exemplos somente em `novo-website`; outros projetos têm estado vazio. Nenhuma integração, persistência de tarefas ou execução proativa foi introduzida. Ver os limites em `src/components/initiatives/CLAUDE.md` e a especificação em `docs/experiencia-agentica-projetos-e-action-points.md`.
