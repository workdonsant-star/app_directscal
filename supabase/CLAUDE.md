# `supabase` — Migrations e configuração

## Propósito

Contém configuração local e migrations SQL para a base Supabase de produção do OMDx.

## Convenções

- Migrations devem ser versionadas, revisáveis e idempotentes quando possível.
- Toda tabela no schema `public` deve ter RLS habilitado.
- `next_auth` segue o schema esperado pelo Auth.js Supabase Adapter.
- `next_auth.users.email` é a fonte de unicidade de conta; migrations novas devem preservar a unicidade normalizada por `lower(trim(email))` sem apagar dados históricos.
- Funções `security definer` ficam em schema privado, nunca em schema exposto.
- Seeds do OMDx v1 são imutáveis; mudanças futuras criam nova versão de template.
