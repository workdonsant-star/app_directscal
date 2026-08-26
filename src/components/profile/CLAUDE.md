# `src/components/profile` — Perfil do usuário

Componentes da página `/perfil`, usados para configurar dados básicos da conta e da empresa no app autenticado.

## Propósito

- Manter o formulário de perfil como UI local-only enquanto o backend real de perfil não entra no escopo.
- Exibir nome, e-mail e empresa iniciados a partir da sessão autenticada.
- Permitir edição local do nome, foto de perfil e quantidade de funcionários.
- Exibir e-mail e empresa como campos bloqueados nesta fase.
- Simular troca de senha sem persistência real.
- Usar um único botão `Salvar alterações` para persistir todas as mudanças da sessão.
- Manter todas as informações do perfil dentro de um único box; seções internas usam divisórias, não cards separados.

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
