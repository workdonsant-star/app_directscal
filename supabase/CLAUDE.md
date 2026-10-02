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
- Ativos de gestão: `management_asset_versions.review_status` guarda o estado editorial da versão; `management_assets.status` comunica o que o cliente enxerga. Um trigger impede alterar versões publicadas, e um índice único parcial garante um único rascunho por ativo.
- A busca dos ativos usa a configuração `public.pt_unaccent` (português sem acentos) e vetores `extensions.vector(768)` com o modelo gravado em `embedding_model`. `search_management_asset_chunks_for_organization` só é executável pela service role e filtra a organização antes do ranking.
- `app_private.slack_installations` guarda o token do bot por workspace e nunca recebe grant para `anon` ou `authenticated`.
