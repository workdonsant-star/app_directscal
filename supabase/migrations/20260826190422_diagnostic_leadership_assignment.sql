alter table public.diagnostics
  add column if not exists created_by_user_id uuid
    references next_auth.users(id) on delete set null;

alter table public.diagnostics
  add constraint diagnostics_id_organization_id_key
  unique (id, organization_id);

-- Diagnósticos anteriores a esta migration não possuem autoria confiável.
-- Eles permanecem nulos e seguem a regra de compatibilidade em
-- app_private.can_view_diagnostic; somente novos diagnósticos registram o criador.

create index if not exists diagnostics_created_by_user_id_idx
  on public.diagnostics (created_by_user_id)
  where created_by_user_id is not null;

create table if not exists public.diagnostic_sector_scopes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  diagnostic_id uuid not null references public.diagnostics(id) on delete cascade,
  sector_id uuid not null references public.organization_sectors(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (diagnostic_id, organization_id)
    references public.diagnostics(id, organization_id) on delete cascade,
  foreign key (sector_id, organization_id)
    references public.organization_sectors(id, organization_id) on delete restrict,
  unique (id, organization_id),
  unique (diagnostic_id, sector_id)
);

create table if not exists public.diagnostic_leader_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  diagnostic_sector_scope_id uuid not null
    references public.diagnostic_sector_scopes(id) on delete cascade,
  person_id uuid not null references public.organization_people(id) on delete restrict,
  assigned_by_user_id uuid references next_auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (diagnostic_sector_scope_id, organization_id)
    references public.diagnostic_sector_scopes(id, organization_id) on delete cascade,
  foreign key (person_id, organization_id)
    references public.organization_people(id, organization_id) on delete restrict,
  unique (diagnostic_sector_scope_id, person_id)
);

create index if not exists diagnostic_sector_scopes_org_diagnostic_idx
  on public.diagnostic_sector_scopes (organization_id, diagnostic_id);

create index if not exists diagnostic_sector_scopes_sector_idx
  on public.diagnostic_sector_scopes (sector_id);

create index if not exists diagnostic_leader_assignments_org_scope_idx
  on public.diagnostic_leader_assignments (
    organization_id,
    diagnostic_sector_scope_id
  );

create index if not exists diagnostic_leader_assignments_person_idx
  on public.diagnostic_leader_assignments (person_id);

create index if not exists diagnostic_leader_assignments_assigned_by_idx
  on public.diagnostic_leader_assignments (assigned_by_user_id)
  where assigned_by_user_id is not null;

alter table public.diagnostic_share_links
  add column if not exists sector_id uuid
    references public.organization_sectors(id) on delete restrict;

alter table public.diagnostic_share_links
  drop constraint if exists diagnostic_share_links_diagnostic_id_group_id_key;

create unique index if not exists diagnostic_share_links_institutional_group_idx
  on public.diagnostic_share_links (diagnostic_id, group_id)
  where group_id in ('fundador', 'lideranca');

create unique index if not exists diagnostic_share_links_team_sector_idx
  on public.diagnostic_share_links (diagnostic_id, sector_id)
  where group_id = 'operacao' and sector_id is not null;

create index if not exists diagnostic_share_links_sector_id_idx
  on public.diagnostic_share_links (sector_id)
  where sector_id is not null;

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
      and member.user_id = next_auth.uid()
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
        or diagnostic.created_by_user_id = next_auth.uid()
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
            and person.auth_user_id = next_auth.uid()
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
        or diagnostic.created_by_user_id = next_auth.uid()
      )
  )
$$;

create or replace function app_private.can_access_diagnostic(
  target_diagnostic_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, next_auth, pg_temp
as $$
  select app_private.can_view_diagnostic(target_diagnostic_id)
$$;

create or replace function app_private.sync_diagnostic_leaders(
  p_diagnostic_id uuid,
  p_actor_user_id uuid,
  p_person_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public, next_auth, app_private, pg_temp
as $$
declare
  v_organization_id uuid;
  v_status public.diagnostic_status;
  v_requested_count integer;
  v_valid_count integer;
begin
  select diagnostic.organization_id, diagnostic.status
  into v_organization_id, v_status
  from public.diagnostics diagnostic
  where diagnostic.id = p_diagnostic_id;

  if v_organization_id is null then
    raise exception 'Diagnóstico não encontrado.' using errcode = 'P0002';
  end if;

  if v_status <> 'rascunho' then
    raise exception 'Somente rascunhos podem alterar responsáveis.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.diagnostics diagnostic
    where diagnostic.id = p_diagnostic_id
      and (
        diagnostic.created_by_user_id = p_actor_user_id
        or exists (
          select 1
          from public.organization_members member
          where member.organization_id = diagnostic.organization_id
            and member.user_id = p_actor_user_id
            and member.role = 'cliente'
        )
      )
  ) then
    raise exception 'Usuário sem permissão para configurar o diagnóstico.' using errcode = '42501';
  end if;

  select count(distinct requested.person_id)
  into v_requested_count
  from unnest(coalesce(p_person_ids, array[]::uuid[])) as requested(person_id);

  if v_requested_count = 0 then
    delete from public.diagnostic_sector_scopes
    where diagnostic_id = p_diagnostic_id;
    return;
  end if;

  select count(distinct person.id)
  into v_valid_count
  from public.organization_people person
  join public.organization_sector_memberships membership
    on membership.person_id = person.id
   and membership.organization_id = person.organization_id
   and membership.role = 'lideranca'
  join public.organization_sectors sector
    on sector.id = membership.sector_id
   and sector.organization_id = membership.organization_id
  where person.organization_id = v_organization_id
    and person.id = any(p_person_ids)
    and person.status = 'ativo'
    and person.auth_user_id is not null
    and sector.active;

  if v_valid_count <> v_requested_count then
    raise exception 'Uma ou mais lideranças não estão ativas nesta empresa.' using errcode = '22023';
  end if;

  delete from public.diagnostic_sector_scopes
  where diagnostic_id = p_diagnostic_id;

  insert into public.diagnostic_sector_scopes (
    organization_id,
    diagnostic_id,
    sector_id
  )
  select distinct
    v_organization_id,
    p_diagnostic_id,
    membership.sector_id
  from public.organization_sector_memberships membership
  where membership.organization_id = v_organization_id
    and membership.person_id = any(p_person_ids)
    and membership.role = 'lideranca';

  insert into public.diagnostic_leader_assignments (
    organization_id,
    diagnostic_sector_scope_id,
    person_id,
    assigned_by_user_id
  )
  select
    v_organization_id,
    scope.id,
    membership.person_id,
    p_actor_user_id
  from public.organization_sector_memberships membership
  join public.diagnostic_sector_scopes scope
    on scope.diagnostic_id = p_diagnostic_id
   and scope.sector_id = membership.sector_id
  where membership.organization_id = v_organization_id
    and membership.person_id = any(p_person_ids)
    and membership.role = 'lideranca';
end;
$$;

create or replace function app_private.activate_diagnostic_with_links(
  p_diagnostic_id uuid,
  p_actor_user_id uuid,
  p_activated_at timestamptz
)
returns table (
  diagnostic_id uuid,
  group_id public.respondent_group,
  sector_id uuid,
  token text
)
language plpgsql
security definer
set search_path = public, next_auth, app_private, pg_temp
as $$
declare
  v_organization_id uuid;
  v_status public.diagnostic_status;
begin
  select diagnostic.organization_id, diagnostic.status
  into v_organization_id, v_status
  from public.diagnostics diagnostic
  where diagnostic.id = p_diagnostic_id
  for update;

  if v_organization_id is null then
    raise exception 'Diagnóstico não encontrado.' using errcode = 'P0002';
  end if;

  if v_status <> 'rascunho' then
    raise exception 'Somente rascunhos podem ser ativados.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.diagnostics diagnostic
    where diagnostic.id = p_diagnostic_id
      and (
        diagnostic.created_by_user_id = p_actor_user_id
        or exists (
          select 1
          from public.organization_members member
          where member.organization_id = diagnostic.organization_id
            and member.user_id = p_actor_user_id
            and member.role = 'cliente'
        )
      )
  ) then
    raise exception 'Usuário sem permissão para ativar o diagnóstico.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.diagnostic_sector_scopes scope
    where scope.diagnostic_id = p_diagnostic_id
  ) then
    raise exception 'Selecione ao menos uma liderança antes de ativar.' using errcode = '22023';
  end if;

  delete from public.diagnostic_share_links share_link
  where share_link.diagnostic_id = p_diagnostic_id
    and share_link.group_id = 'operacao'
    and share_link.sector_id is null
    and not exists (
      select 1
      from public.response_sessions response_session
      where response_session.share_link_id = share_link.id
    );

  insert into public.diagnostic_share_links (diagnostic_id, group_id, token)
  values
    (p_diagnostic_id, 'fundador', p_diagnostic_id || '-fundador-' || gen_random_uuid()),
    (p_diagnostic_id, 'lideranca', p_diagnostic_id || '-lideranca-' || gen_random_uuid())
  on conflict do nothing;

  insert into public.diagnostic_share_links (
    diagnostic_id,
    group_id,
    sector_id,
    token
  )
  select
    p_diagnostic_id,
    'operacao',
    scope.sector_id,
    p_diagnostic_id || '-operacao-' || scope.sector_id || '-' || gen_random_uuid()
  from public.diagnostic_sector_scopes scope
  where scope.diagnostic_id = p_diagnostic_id
  on conflict do nothing;

  update public.diagnostics
  set activated_at = p_activated_at,
      status = 'ativo'
  where id = p_diagnostic_id;

  return query
  select
    share_link.diagnostic_id,
    share_link.group_id,
    share_link.sector_id,
    share_link.token
  from public.diagnostic_share_links share_link
  where share_link.diagnostic_id = p_diagnostic_id
  order by
    case share_link.group_id
      when 'fundador' then 1
      when 'lideranca' then 2
      else 3
    end,
    share_link.sector_id;
end;
$$;

revoke all on function app_private.sync_diagnostic_leaders(uuid, uuid, uuid[])
  from public, anon, authenticated;
revoke all on function app_private.activate_diagnostic_with_links(uuid, uuid, timestamptz)
  from public, anon, authenticated;
grant execute on function app_private.sync_diagnostic_leaders(uuid, uuid, uuid[])
  to service_role;
grant execute on function app_private.activate_diagnostic_with_links(uuid, uuid, timestamptz)
  to service_role;

revoke all on function app_private.is_company_owner(uuid)
  from public, anon;
revoke all on function app_private.can_view_diagnostic(uuid)
  from public, anon;
revoke all on function app_private.can_manage_diagnostic(uuid)
  from public, anon;
grant execute on function app_private.is_company_owner(uuid)
  to authenticated, service_role;
grant execute on function app_private.can_view_diagnostic(uuid)
  to authenticated, service_role;
grant execute on function app_private.can_manage_diagnostic(uuid)
  to authenticated, service_role;

alter table public.diagnostic_sector_scopes enable row level security;
alter table public.diagnostic_leader_assignments enable row level security;

grant select, insert, update, delete on
  public.diagnostic_sector_scopes,
  public.diagnostic_leader_assignments
to authenticated;
grant all on
  public.diagnostic_sector_scopes,
  public.diagnostic_leader_assignments
to service_role;

drop policy if exists diagnostics_member_select on public.diagnostics;
drop policy if exists diagnostics_member_insert on public.diagnostics;
drop policy if exists diagnostics_member_update on public.diagnostics;
drop policy if exists diagnostics_member_delete on public.diagnostics;

create policy diagnostics_scoped_select on public.diagnostics
for select to authenticated
using (app_private.can_view_diagnostic(id));

create policy diagnostics_scoped_insert on public.diagnostics
for insert to authenticated
with check (
  app_private.is_org_member(organization_id)
  and created_by_user_id = next_auth.uid()
);

create policy diagnostics_scoped_update on public.diagnostics
for update to authenticated
using (app_private.can_manage_diagnostic(id))
with check (
  app_private.is_org_member(organization_id)
  and (
    created_by_user_id = next_auth.uid()
    or app_private.is_company_owner(organization_id)
  )
);

create policy diagnostics_scoped_delete on public.diagnostics
for delete to authenticated
using (app_private.can_manage_diagnostic(id));

create policy diagnostic_sector_scopes_select on public.diagnostic_sector_scopes
for select to authenticated
using (app_private.can_view_diagnostic(diagnostic_id));

create policy diagnostic_sector_scopes_insert on public.diagnostic_sector_scopes
for insert to authenticated
with check (app_private.can_manage_diagnostic(diagnostic_id));

create policy diagnostic_sector_scopes_update on public.diagnostic_sector_scopes
for update to authenticated
using (app_private.can_manage_diagnostic(diagnostic_id))
with check (app_private.can_manage_diagnostic(diagnostic_id));

create policy diagnostic_sector_scopes_delete on public.diagnostic_sector_scopes
for delete to authenticated
using (app_private.can_manage_diagnostic(diagnostic_id));

create policy diagnostic_leader_assignments_select
on public.diagnostic_leader_assignments
for select to authenticated
using (
  exists (
    select 1
    from public.diagnostic_sector_scopes scope
    where scope.id = diagnostic_sector_scope_id
      and app_private.can_view_diagnostic(scope.diagnostic_id)
  )
);

create policy diagnostic_leader_assignments_insert
on public.diagnostic_leader_assignments
for insert to authenticated
with check (
  exists (
    select 1
    from public.diagnostic_sector_scopes scope
    where scope.id = diagnostic_sector_scope_id
      and app_private.can_manage_diagnostic(scope.diagnostic_id)
  )
);

create policy diagnostic_leader_assignments_update
on public.diagnostic_leader_assignments
for update to authenticated
using (
  exists (
    select 1
    from public.diagnostic_sector_scopes scope
    where scope.id = diagnostic_sector_scope_id
      and app_private.can_manage_diagnostic(scope.diagnostic_id)
  )
)
with check (
  exists (
    select 1
    from public.diagnostic_sector_scopes scope
    where scope.id = diagnostic_sector_scope_id
      and app_private.can_manage_diagnostic(scope.diagnostic_id)
  )
);

create policy diagnostic_leader_assignments_delete
on public.diagnostic_leader_assignments
for delete to authenticated
using (
  exists (
    select 1
    from public.diagnostic_sector_scopes scope
    where scope.id = diagnostic_sector_scope_id
      and app_private.can_manage_diagnostic(scope.diagnostic_id)
  )
);

drop policy if exists diagnostic_share_links_member_select
  on public.diagnostic_share_links;
drop policy if exists diagnostic_share_links_member_insert
  on public.diagnostic_share_links;
drop policy if exists diagnostic_share_links_member_update
  on public.diagnostic_share_links;
drop policy if exists diagnostic_share_links_member_delete
  on public.diagnostic_share_links;

create policy diagnostic_share_links_scoped_select
on public.diagnostic_share_links
for select to authenticated
using (
  app_private.can_view_diagnostic(diagnostic_id)
  and (
    (
      group_id = 'fundador'
      and exists (
        select 1
        from public.diagnostics diagnostic
        where diagnostic.id = diagnostic_share_links.diagnostic_id
          and app_private.is_company_owner(diagnostic.organization_id)
      )
    )
    or group_id = 'lideranca'
    or (
      group_id = 'operacao'
      and (
        app_private.can_manage_diagnostic(diagnostic_id)
        or exists (
          select 1
          from public.diagnostic_sector_scopes scope
          join public.diagnostic_leader_assignments assignment
            on assignment.diagnostic_sector_scope_id = scope.id
          join public.organization_people person
            on person.id = assignment.person_id
          where scope.diagnostic_id = diagnostic_share_links.diagnostic_id
            and scope.sector_id = diagnostic_share_links.sector_id
            and person.auth_user_id = next_auth.uid()
        )
      )
    )
  )
);

create policy diagnostic_share_links_scoped_insert
on public.diagnostic_share_links
for insert to authenticated
with check (app_private.can_manage_diagnostic(diagnostic_id));

create policy diagnostic_share_links_scoped_update
on public.diagnostic_share_links
for update to authenticated
using (app_private.can_manage_diagnostic(diagnostic_id))
with check (app_private.can_manage_diagnostic(diagnostic_id));

create policy diagnostic_share_links_scoped_delete
on public.diagnostic_share_links
for delete to authenticated
using (app_private.can_manage_diagnostic(diagnostic_id));
