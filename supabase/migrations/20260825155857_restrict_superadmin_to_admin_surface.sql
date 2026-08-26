create or replace function app_private.is_org_member(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public, next_auth, pg_temp
as $$
  select not app_private.is_superadmin()
    and exists (
      select 1
      from public.organization_members om
      where om.organization_id = target_organization_id
        and om.user_id = next_auth.uid()
        and om.role in ('admin', 'cliente')
    )
$$;

create or replace function app_private.can_access_diagnostic(target_diagnostic_id uuid)
returns boolean
language sql
security definer
set search_path = public, next_auth, pg_temp
as $$
  select exists (
    select 1
    from public.diagnostics d
    where d.id = target_diagnostic_id
      and app_private.is_org_member(d.organization_id)
  )
$$;
