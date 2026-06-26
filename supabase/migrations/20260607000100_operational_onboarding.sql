do $$
begin
  create type public.operational_member_status as enum (
    'aprovado',
    'pendente_aprovacao',
    'rejeitado'
  );
exception
  when duplicate_object then null;
end;
$$;

alter table public.organizations
  add column if not exists operational_onboarding_required boolean not null default false,
  add column if not exists operational_onboarding_completed_at timestamptz;

create table if not exists public.operational_onboarding_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  token text not null unique,
  created_by uuid references next_auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

create unique index if not exists operational_onboarding_links_active_org_idx
  on public.operational_onboarding_links (organization_id)
  where disabled_at is null;

create index if not exists operational_onboarding_links_token_idx
  on public.operational_onboarding_links (token)
  where disabled_at is null;

create table if not exists public.operational_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  onboarding_link_id uuid references public.operational_onboarding_links(id) on delete set null,
  name text not null,
  email text not null,
  normalized_email text generated always as (lower(trim(email))) stored,
  area text not null,
  operational_role text not null,
  perceived_responsibilities text not null,
  participates_in_area_decisions boolean not null,
  status public.operational_member_status not null default 'aprovado',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references next_auth.users(id) on delete set null,
  rejection_reason text,
  unique (organization_id, normalized_email)
);

create index if not exists operational_members_organization_status_idx
  on public.operational_members (organization_id, status, submitted_at desc);

drop trigger if exists operational_onboarding_links_touch_updated_at
  on public.operational_onboarding_links;

drop trigger if exists operational_members_touch_updated_at
  on public.operational_members;

alter table public.operational_onboarding_links enable row level security;
alter table public.operational_members enable row level security;

grant select, insert, update, delete on
  public.operational_onboarding_links,
  public.operational_members
to authenticated;

grant all on
  public.operational_onboarding_links,
  public.operational_members
to service_role;

drop policy if exists operational_onboarding_links_member_select
  on public.operational_onboarding_links;
create policy operational_onboarding_links_member_select
on public.operational_onboarding_links
for select to authenticated
using (app_private.is_org_member(organization_id));

drop policy if exists operational_onboarding_links_member_insert
  on public.operational_onboarding_links;
create policy operational_onboarding_links_member_insert
on public.operational_onboarding_links
for insert to authenticated
with check (app_private.is_org_member(organization_id));

drop policy if exists operational_onboarding_links_member_update
  on public.operational_onboarding_links;
create policy operational_onboarding_links_member_update
on public.operational_onboarding_links
for update to authenticated
using (app_private.is_org_member(organization_id))
with check (app_private.is_org_member(organization_id));

drop policy if exists operational_members_member_select
  on public.operational_members;
create policy operational_members_member_select
on public.operational_members
for select to authenticated
using (app_private.is_org_member(organization_id));

drop policy if exists operational_members_member_update
  on public.operational_members;
create policy operational_members_member_update
on public.operational_members
for update to authenticated
using (app_private.is_org_member(organization_id))
with check (app_private.is_org_member(organization_id));
