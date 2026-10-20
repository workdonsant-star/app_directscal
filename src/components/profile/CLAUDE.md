# `src/components/profile` — Perfil do usuário

Componentes da página `/perfil`, usados para configurar os dados pessoais da conta autenticada.

## Propósito

- Persistir nome e avatar via PUT /api/profile, com identidade derivada da sessão.
- Exibir nome e e-mail iniciados a partir da sessão autenticada.
- Permitir edição compartilhada do nome e da foto de perfil.
- Exibir o e-mail em estado desabilitado, sem texto auxiliar abaixo do campo.
- Permitir edição de `Posição na empresa` junto de nome e e-mail, embora sua persistência continue no lead de aquisição.
- Trocar senha existente pela API autenticada, quando habilitada pelo servidor.
- Usar um único botão `Salvar alterações` na topbar, antes do sino, via `AppTopbarActionsPortal`: nome e avatar são enviados ao banco, enquanto a posição alterada é enviada por `PATCH /api/profile`.
- Manter todas as informações do perfil dentro de um único box; seções internas usam divisórias, não cards separados.
- Não exibir um cabeçalho interno `Informações de perfil` nem o título `Dados pessoais`; o card começa diretamente pelo bloco da foto.
- Não renderizar dados cadastrais ou comerciais da empresa; eles pertencem a `src/components/settings/` e `/configuracoes`.

## Convenções

- Componentes desta pasta podem ser client components quando controlarem formulários.
- Não buscar sessão, Supabase ou persistência de backend dentro dos componentes de perfil; a página injeta os dados iniciais.
- A autenticação mockada vive em `src/lib/auth` e `/api/auth/*`.
- Usar primitives de `src/components/ui/`.
- Validações devem ser simples e visíveis no próprio formulário.
- Upload de foto aceita JPG, PNG ou WebP de até 15 MB. Após a seleção, `AvatarCropDialog` abre uma modal circular para reposicionar a imagem por arraste e ajustar o zoom; a confirmação gera um avatar circular WebP de 512 × 512 px antes de persistir o raster base64 no banco após `Salvar alterações`.
- Falhas de leitura, formato, tamanho e cota do navegador devem permanecer visíveis no formulário; não limpe o draft quando a persistência falhar.
- Nome e foto iniciais vêm exclusivamente da identidade resolvida no servidor, inclusive antes da primeira gravação em account_profiles. Dados locais legados nunca preenchem o formulário nem são transferidos automaticamente ao banco. Edições deliberadas ficam no draft até salvar.
- Logout preserva nome e avatar no banco. Um novo login Google não substitui as escolhas do perfil.
- Campos de senha são opcionais. Só valide senha quando algum campo de senha estiver preenchido.
- Durante o salvamento, bloquear o CTA da topbar e exibir `Salvando`; erros da API permanecem visíveis no final do formulário.

A09: SlackIdentitySection é seção interna do box do perfil. Dados iniciais vêm do servidor; geração de código, consulta de confirmação e desvinculação própria usam API sem campos de empresa/pessoa. Código fica apenas em memória da tela, com instrução de envio em DM pelo próprio usuário, validade de dez minutos e limite de geração. Desvinculação tem confirmação explícita e preserva conversas. Sem envio automático, localStorage ou token do bot no cliente.


A14: troca de senha é real somente quando passwordEnabled vem do servidor. Google-only não vê campos simulados. Senha atual obrigatória; novo valor/confirmacão 12–128. Perfil salvo e falha de senha são explicitamente separados; sucesso de senha encerra sessão. Nenhuma senha em armazenamento local.
