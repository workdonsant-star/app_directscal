# `supabase` — Migrations e configuração

## Propósito

Contém configuração local e migrations SQL para a base Supabase de produção do Maturidade.

## Convenções

- Migrations devem ser versionadas, revisáveis e idempotentes quando possível.
- Toda tabela no schema `public` deve ter RLS habilitado.
- `next_auth` segue o schema esperado pelo Auth.js Supabase Adapter.
- `next_auth.users.email` é a fonte de unicidade de conta; migrations novas devem preservar a unicidade normalizada por `lower(trim(email))` sem apagar dados históricos.
- Funções `security definer` ficam em schema privado, nunca em schema exposto.
- `app_private.is_org_member()` e `app_private.can_access_diagnostic()` devem negar identidades que possuam papel `superadmin`; esse papel usa apenas policies e handlers administrativos explícitos.
- Seeds do Maturidade v1 são imutáveis; mudanças futuras criam nova versão de template.
- Campos adicionais do onboarding de aquisição ficam em `acquisition_campaign_fields` e suas respostas em `acquisition_leads.field_values`; não criar coluna dedicada para cada campo configurável.
