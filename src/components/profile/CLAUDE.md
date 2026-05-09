# `src/components/profile` — Perfil do usuário

Componentes da página `/perfil`, usados para configurar dados básicos da conta e da empresa no app autenticado.

## Propósito

- Manter o formulário de perfil como UI mockada até existir autenticação real.
- Permitir edição local do nome, foto de perfil e quantidade de funcionários.
- Exibir e-mail e empresa como campos bloqueados nesta fase.
- Simular troca de senha sem persistência ou chamada de API.
- Usar um único botão `Salvar alterações` para persistir todas as mudanças da sessão.
- Manter todas as informações do perfil dentro de um único box; seções internas usam divisórias, não cards separados.

## Convenções

- Componentes desta pasta podem ser client components quando controlarem formulários.
- Não adicionar autenticação, sessão real, API ou persistência.
- Usar primitives de `src/components/ui/`.
- Validações devem ser simples e visíveis no próprio formulário.
- Upload de foto usa `FileReader.readAsDataURL` e persiste em `localStorage` após `Salvar alterações`; não enviar arquivo para backend nesta fase.
- Overrides mockados de perfil ficam em `src/lib/profile-storage.ts` e atualizam o `NavUser` por evento client.
- Campos de senha são opcionais. Só valide senha quando algum campo de senha estiver preenchido.
