# `/api/omdx/operational-members/[id]` — Gestão autenticada de pessoas

## Propósito

Route Handler autenticado para ações administrativas sobre pessoas já cadastradas no onboarding operacional.

## Convenções locais

- Exige sessão autenticada de cliente.
- Nunca confia apenas no id da URL; a mutação precisa validar a organização acessível pelo usuário atual.
- Não retorna dados internos além do necessário para confirmar a operação.
- O endpoint público de cadastro continua em `/api/omdx/operational-members`.
