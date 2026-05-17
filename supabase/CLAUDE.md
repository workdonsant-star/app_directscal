# `supabase` — Migrations e configuração

## Propósito

Contém configuração local e migrations SQL para a base Supabase de produção do OMDx.

## Convenções

- Migrations devem ser versionadas, revisáveis e idempotentes quando possível.
- Toda tabela no schema `public` deve ter RLS habilitado.
- `next_auth` segue o schema esperado pelo Auth.js Supabase Adapter.
- Funções `security definer` ficam em schema privado, nunca em schema exposto.
- Seeds do OMDx v1 são imutáveis; mudanças futuras criam nova versão de template.
