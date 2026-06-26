create table if not exists public.organization_module_access (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_id text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, module_id)
);

create index if not exists organization_module_access_module_enabled_idx
  on public.organization_module_access (module_id, enabled);

drop trigger if exists organization_module_access_touch_updated_at
  on public.organization_module_access;
create trigger organization_module_access_touch_updated_at
before update on public.organization_module_access
for each row execute function app_private.touch_updated_at();

alter table public.organization_module_access enable row level security;

grant select, insert, update, delete on
  public.organization_module_access
to authenticated;

grant all on
  public.organization_module_access
to service_role;

drop policy if exists organization_module_access_superadmin_select
  on public.organization_module_access;
create policy organization_module_access_superadmin_select
on public.organization_module_access
for select to authenticated
using (app_private.is_superadmin());

drop policy if exists organization_module_access_superadmin_insert
  on public.organization_module_access;
create policy organization_module_access_superadmin_insert
on public.organization_module_access
for insert to authenticated
with check (app_private.is_superadmin());

drop policy if exists organization_module_access_superadmin_update
  on public.organization_module_access;
create policy organization_module_access_superadmin_update
on public.organization_module_access
for update to authenticated
using (app_private.is_superadmin())
with check (app_private.is_superadmin());

drop policy if exists organization_module_access_superadmin_delete
  on public.organization_module_access;
create policy organization_module_access_superadmin_delete
on public.organization_module_access
for delete to authenticated
using (app_private.is_superadmin());

drop policy if exists organization_module_access_member_select
  on public.organization_module_access;
create policy organization_module_access_member_select
on public.organization_module_access
for select to authenticated
using (
  exists (
    select 1
    from public.organization_members member
    where member.organization_id = organization_module_access.organization_id
      and member.user_id = next_auth.uid()
  )
);
