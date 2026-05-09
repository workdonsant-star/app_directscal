# `/perfil` — Perfil

Página autenticada para editar dados básicos do usuário e da empresa.

## Propósito

- Permitir ajuste local do nome do usuário.
- Exibir e-mail bloqueado.
- Simular alteração de senha sem backend.
- Exibir empresa bloqueada e permitir alteração da quantidade de funcionários.

## Convenções

- Usar breadcrumb `Perfil`.
- A página pode ser Server Component e delegar interatividade para `ProfileSettings`.
- Tudo é mockado nesta fase; não adicionar autenticação real, API, sessão ou persistência.
- O acesso principal fica no menu do usuário na sidebar, não como item de navegação principal.
