# Entregas — workspace da empresa em Operação

## Interface

- `/admin/entregas/[id]` mantém o menu de abas Dados, Relatório, Action points, Criação dos ativos e Publicação.
- Criação dos ativos usa a organização do diagnóstico aberto; trocar diagnóstico dentro da mesma empresa mantém o vínculo dos ativos por organização.
- `?aba=ativos` abre a produção; `&ativo=<id>` abre o editor dentro da mesma aba; `&perguntas=1` abre as perguntas da empresa, sem abandonar o menu.
- A empresa fica bloqueada no drawer e é enviada pelo contexto da instância. O servidor filtra ativos/auditorias e recusa editor de outra empresa com 404.
- Os componentes editoriais usam `embedded` para reutilizar a topbar e o recuo da instância. As ações de relatório/publicação da entrega ficam ocultas na aba de ativos, que apresenta as próprias ações.
- Relatório e action points preservam seus fluxos existentes e não são alterados pela publicação de um ativo.
