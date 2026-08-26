# `/perfil` — Perfil

Página autenticada para editar dados básicos do usuário e da empresa.

## Propósito

- Iniciar o perfil com nome, e-mail e empresa vindos da sessão autenticada.
- Permitir ajuste local do nome do usuário nesta sessão.
- Exibir e-mail bloqueado.
- Simular alteração de senha sem backend.
- Exibir empresa bloqueada e permitir alteração da quantidade de funcionários.

## Convenções

- Usar breadcrumb `Perfil`.
- A página é Server Component, lê `getCurrentAuthSession()` e delega interatividade para `ProfileSettings`.
- A página pertence à aplicação do cliente; `superadmin` não recebe o atalho no menu e é redirecionado para `/admin/modulos` em acesso direto.
- Usar `AppPage` com o mesmo recuo horizontal de Dimensões e conteúdo em largura total.
- Persistência de edição continua mockada/local por usuário; não adicionar API ou escrita em backend nesta fase.
- O acesso principal fica no menu do usuário na sidebar, não como item de navegação principal.
