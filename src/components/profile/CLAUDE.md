# `src/components/profile` — Perfil do usuário

Componentes da página `/perfil`, usados para configurar os dados pessoais da conta autenticada.

## Propósito

- Manter a edição de dados pessoais como UI local-only enquanto o backend completo de perfil não entra no escopo.
- Exibir nome e e-mail iniciados a partir da sessão autenticada.
- Permitir edição local do nome e da foto de perfil.
- Exibir o e-mail em estado desabilitado, sem texto auxiliar abaixo do campo.
- Permitir edição de `Posição na empresa` junto de nome e e-mail, embora sua persistência continue no lead de aquisição.
- Simular troca de senha sem persistência real.
- Usar um único botão `Salvar alterações` na topbar, antes do sino, via `AppTopbarActionsPortal`: nome e avatar permanecem locais, enquanto a posição alterada é enviada por `PATCH /api/profile`.
- Manter todas as informações do perfil dentro de um único box; seções internas usam divisórias, não cards separados.
- Não exibir um cabeçalho interno `Informações de perfil` nem o título `Dados pessoais`; o card começa diretamente pelo bloco da foto.
- Não renderizar dados cadastrais ou comerciais da empresa; eles pertencem a `src/components/settings/` e `/configuracoes`.

## Convenções

- Componentes desta pasta podem ser client components quando controlarem formulários.
- Não buscar sessão, Supabase ou persistência de backend dentro dos componentes de perfil; a página injeta os dados iniciais.
- A autenticação mockada vive em `src/lib/auth` e `/api/auth/*`.
- Usar primitives de `src/components/ui/`.
- Validações devem ser simples e visíveis no próprio formulário.
- Upload de foto aceita JPG, PNG ou WebP de até 15 MB. Após a seleção, `AvatarCropDialog` abre uma modal circular para reposicionar a imagem por arraste e ajustar o zoom; a confirmação gera um avatar circular WebP de 512 × 512 px antes de persistir em `localStorage` após `Salvar alterações`. Não enviar arquivo para backend nesta fase.
- Falhas de leitura, formato, tamanho e cota do navegador devem permanecer visíveis no formulário; não limpe o draft quando a persistência falhar.
- Overrides mockados de perfil ficam em `src/lib/profile-storage.ts`, são escopados por `user.id` e atualizam o `NavUser` por evento client.
- O logout não remove os overrides escopados por usuário; nome e avatar permanecem disponíveis para o mesmo `user.id` neste navegador.
- Campos de senha são opcionais. Só valide senha quando algum campo de senha estiver preenchido.
- Durante o salvamento, bloquear o CTA da topbar e exibir `Salvando`; erros da API permanecem visíveis no final do formulário.
