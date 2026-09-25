create or replace function app_private.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public, next_auth, pg_temp
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.user_id = (select next_auth.uid())
      and member.role = 'superadmin'
  )
$$;

create or replace function app_private.is_org_member(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, next_auth, pg_temp
as $$
  select not (select app_private.is_superadmin())
    and exists (
      select 1
      from public.organization_members member
      where member.organization_id = target_organization_id
        and member.user_id = (select next_auth.uid())
        and member.role in ('admin', 'cliente')
    )
$$;

create or replace function app_private.is_company_owner(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, next_auth, pg_temp
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.organization_id = target_organization_id
      and member.user_id = (select next_auth.uid())
      and member.role = 'cliente'
  )
$$;

create or replace function app_private.can_view_diagnostic(
  target_diagnostic_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, next_auth, pg_temp
as $$
  select exists (
    select 1
    from public.diagnostics diagnostic
    where diagnostic.id = target_diagnostic_id
      and (
        app_private.is_company_owner(diagnostic.organization_id)
        or diagnostic.created_by_user_id = (select next_auth.uid())
        or (
          diagnostic.created_by_user_id is null
          and app_private.is_org_member(diagnostic.organization_id)
        )
        or exists (
          select 1
          from public.diagnostic_sector_scopes scope
          join public.diagnostic_leader_assignments assignment
            on assignment.diagnostic_sector_scope_id = scope.id
          join public.organization_people person
            on person.id = assignment.person_id
          where scope.diagnostic_id = diagnostic.id
            and person.auth_user_id = (select next_auth.uid())
            and person.status = 'ativo'
        )
      )
  )
$$;

create or replace function app_private.can_manage_diagnostic(
  target_diagnostic_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, next_auth, pg_temp
as $$
  select exists (
    select 1
    from public.diagnostics diagnostic
    where diagnostic.id = target_diagnostic_id
      and (
        app_private.is_company_owner(diagnostic.organization_id)
        or diagnostic.created_by_user_id = (select next_auth.uid())
      )
  )
$$;
