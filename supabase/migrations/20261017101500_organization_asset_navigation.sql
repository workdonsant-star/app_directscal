create table if not exists public.organization_asset_navigation (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  preferences jsonb not null default '{"order":[],"icons":{}}'::jsonb
    check (jsonb_typeof(preferences) = 'object'),
  updated_by uuid references next_auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.organization_asset_navigation enable row level security;
revoke all on public.organization_asset_navigation from anon, authenticated;
grant select, insert, update on public.organization_asset_navigation to service_role;
