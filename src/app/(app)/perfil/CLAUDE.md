# `/perfil` — Perfil

Página autenticada para editar os dados pessoais do usuário.

## Propósito

- Iniciar o perfil com nome e e-mail vindos da sessão autenticada.
- Permitir ajuste local do nome do usuário nesta sessão.
- Exibir e-mail bloqueado.
- Exibir `Posição na empresa` na seção Dados pessoais, preservando sua edição persistida no lead de aquisição.
- O card não repete o título da rota nem exibe o cabeçalho `Dados pessoais`; começa diretamente pelo bloco da foto.
- Simular alteração de senha sem backend.
- Não exibir nome fantasia, CNPJ, dados cadastrais ou informações comerciais; esses campos pertencem a `/configuracoes`.

## Convenções

- Como página raiz aberta pelo menu do usuário, não exibir breadcrumb.
- A página é Server Component, lê `getCurrentAuthSession()`, resolve `getProfileSettingsData()` no servidor e delega interatividade para `ProfileSettings`.
- A página pertence à aplicação do cliente; `superadmin` não recebe o atalho no menu e é redirecionado para `/admin/operacao` em acesso direto.
- Usar `AppPage` com o mesmo recuo horizontal de Dimensões e conteúdo em largura total.
- Nome e avatar continuam com persistência local por usuário; senha permanece simulada. A posição é lida do perfil empresarial e persiste por `PATCH /api/profile`, sem service role no navegador.
- O CTA `Salvar alterações` fica na topbar, imediatamente antes do sino; o card não repete a ação no rodapé.
- O acesso principal fica no menu do usuário na sidebar, não como item de navegação principal.
