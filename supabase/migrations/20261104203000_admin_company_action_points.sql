-- Action points elaborados pelo consultor na aba da empresa.
-- O acompanhamento do agente permanece separado e não é ativado por esta tabela.
create table if not exists app_private.admin_company_action_points (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null references public.management_assets(id) on delete restrict,
  asset_version_id uuid not null references public.management_asset_versions(id) on delete restrict,
  slack_team_id text not null,
  slack_user_id text not null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  deadline date,
  frequency text check (frequency in ('diaria', 'semanal', 'quinzenal', 'mensal')),
  reason text not null check (char_length(btrim(reason)) between 1 and 2000),
  action text not null check (char_length(btrim(action)) between 1 and 2000),
  continuity text not null check (char_length(btrim(continuity)) between 1 and 2000),
  created_by uuid not null references next_auth.users(id),
  updated_by uuid not null references next_auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_company_action_points_organization_idx
  on app_private.admin_company_action_points (organization_id, created_at desc);

alter table app_private.admin_company_action_points enable row level security;
revoke all on app_private.admin_company_action_points from public, anon, authenticated;
grant select, insert, update on app_private.admin_company_action_points to service_role;

comment on table app_private.admin_company_action_points is
  'Ações manuais da operação Directscal por empresa; não ativam contato ou agente.';
