# `src/app/api/admin` — APIs do superadmin

## Propósito

Route Handlers privados para a visão de superadmin. Servem snapshots e mutações administrativas usando Supabase no servidor.

## Convenções

- Exigir sessão `superadmin` antes de qualquer leitura ou escrita.
- Usar DTOs de `src/lib/contracts/` em camelCase na fronteira HTTP.
- Service role fica restrita a `src/lib/data/`; handlers não expõem detalhes de banco.
- Respostas de erro devem ser curtas e em pt-BR.
