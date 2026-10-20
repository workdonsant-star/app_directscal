-- Referências de liderança; nomes, fotos, e-mails e o diretório ficam no Slack.
create table if not exists app_private.organization_sector_slack_leaders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sector_id uuid not null unique,
  slack_team_id text not null check (slack_team_id ~ '^T[A-Z0-9]+$'),
  slack_user_id text not null check (slack_user_id ~ '^[UW][A-Z0-9]+$'),
  position_override text check (char_length(position_override) <= 120),
  created_by uuid references next_auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (sector_id, organization_id)
    references public.organization_sectors(id, organization_id) on delete cascade
);
create index if not exists organization_sector_slack_leaders_org_idx
  on app_private.organization_sector_slack_leaders(organization_id);
create index if not exists organization_sector_slack_leaders_created_by_idx
  on app_private.organization_sector_slack_leaders(created_by);

create table if not exists app_private.diagnostic_slack_leader_assignments (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  diagnostic_sector_scope_id uuid not null,
  slack_leader_id uuid not null,
  primary key (diagnostic_sector_scope_id, slack_leader_id),
  foreign key (diagnostic_sector_scope_id, organization_id)
    references public.diagnostic_sector_scopes(id, organization_id) on delete cascade,
  foreign key (slack_leader_id, organization_id)
    references app_private.organization_sector_slack_leaders(id, organization_id) on delete restrict
);
create index if not exists diagnostic_slack_leader_assignments_org_idx
  on app_private.diagnostic_slack_leader_assignments(organization_id);
create index if not exists diagnostic_slack_leader_assignments_leader_idx
  on app_private.diagnostic_slack_leader_assignments(slack_leader_id);

alter table app_private.organization_sector_slack_leaders enable row level security;
alter table app_private.diagnostic_slack_leader_assignments enable row level security;
revoke all on app_private.organization_sector_slack_leaders,
  app_private.diagnostic_slack_leader_assignments from public, anon, authenticated;
grant select, insert, update, delete on app_private.organization_sector_slack_leaders,
  app_private.diagnostic_slack_leader_assignments to service_role;

create or replace function app_private.create_slack_sector_leader(
  p_organization_id uuid, p_created_by uuid, p_sector_name text,
  p_slack_team_id text, p_slack_user_id text, p_position_override text default null
) returns jsonb language plpgsql security definer
set search_path = public, next_auth, app_private, pg_temp as $$
declare
  v_sector_id uuid;
  v_leader_id uuid;
begin
  if not exists (select 1 from public.organization_members
      where organization_id = p_organization_id and user_id = p_created_by and role = 'cliente')
    or exists (select 1 from public.organization_members where user_id = p_created_by and role = 'superadmin') then
    raise exception 'Apenas o dono da empresa pode configurar lideranças.' using errcode = '42501';
  end if;
  perform 1 from app_private.slack_installations where organization_id = p_organization_id
    and team_id = p_slack_team_id and revoked_at is null for share;
  if not found then
    raise exception 'Conecte o Slack da empresa antes de escolher lideranças.' using errcode = '22023';
  end if;
  if char_length(trim(p_sector_name)) not between 2 and 120 then
    raise exception 'Informe o setor da liderança.' using errcode = '22023';
  end if;
  insert into public.organization_sectors(organization_id, name)
    values (p_organization_id, trim(p_sector_name)) returning id into v_sector_id;
  insert into app_private.organization_sector_slack_leaders
    (organization_id, sector_id, slack_team_id, slack_user_id, position_override, created_by)
    values (p_organization_id, v_sector_id, p_slack_team_id, p_slack_user_id, p_position_override, p_created_by)
    returning id into v_leader_id;
  return jsonb_build_object('sectorId', v_sector_id, 'leaderId', v_leader_id);
end;
$$;

-- Mantém o caminho legado de convites sem duplicar suas regras ou dados.
do $$ begin
  if to_regprocedure('app_private.sync_diagnostic_leaders_legacy(uuid,uuid,uuid[])') is null then
    alter function app_private.sync_diagnostic_leaders(uuid,uuid,uuid[])
      rename to sync_diagnostic_leaders_legacy;
  end if;
end $$;

create or replace function app_private.sync_diagnostic_leaders(
  p_diagnostic_id uuid, p_actor_user_id uuid, p_person_ids uuid[]
) returns void language plpgsql security definer
set search_path = public, next_auth, app_private, pg_temp as $$
declare
  v_organization_id uuid;
  v_slack_ids uuid[];
  v_legacy_ids uuid[];
begin
  select organization_id into v_organization_id from public.diagnostics
    where id = p_diagnostic_id for update;
  if not exists (select 1 from public.organization_members where organization_id = v_organization_id
      and user_id = p_actor_user_id and role in ('cliente', 'admin'))
    or exists (select 1 from public.organization_members where user_id = p_actor_user_id and role = 'superadmin') then
    raise exception 'Usuário sem permissão para configurar o diagnóstico.' using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct leader.id), array[]::uuid[]) into v_slack_ids
    from app_private.organization_sector_slack_leaders leader
    join public.organization_sectors sector on sector.id = leader.sector_id and sector.organization_id = leader.organization_id
    join app_private.slack_installations installation on installation.organization_id = leader.organization_id
      and installation.team_id = leader.slack_team_id and installation.revoked_at is null
    where leader.organization_id = v_organization_id and leader.id = any(p_person_ids) and sector.active;
  select coalesce(array_agg(distinct requested.id), array[]::uuid[]) into v_legacy_ids
    from unnest(coalesce(p_person_ids, array[]::uuid[])) requested(id)
    where not (requested.id = any(v_slack_ids));

  perform app_private.sync_diagnostic_leaders_legacy(p_diagnostic_id, p_actor_user_id, v_legacy_ids);

  insert into public.diagnostic_sector_scopes(organization_id, diagnostic_id, sector_id)
    select v_organization_id, p_diagnostic_id, leader.sector_id
    from app_private.organization_sector_slack_leaders leader where leader.id = any(v_slack_ids)
    on conflict (diagnostic_id, sector_id) do nothing;
  insert into app_private.diagnostic_slack_leader_assignments
    (organization_id, diagnostic_sector_scope_id, slack_leader_id)
    select v_organization_id, scope.id, leader.id
    from app_private.organization_sector_slack_leaders leader
    join public.diagnostic_sector_scopes scope on scope.diagnostic_id = p_diagnostic_id and scope.sector_id = leader.sector_id
    where leader.id = any(v_slack_ids);
end;
$$;
revoke all on function app_private.create_slack_sector_leader(uuid,uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function app_private.create_slack_sector_leader(uuid,uuid,text,text,text,text) to service_role;
revoke all on function app_private.sync_diagnostic_leaders_legacy(uuid,uuid,uuid[]) from public, anon, authenticated;
revoke all on function app_private.sync_diagnostic_leaders(uuid,uuid,uuid[]) from public, anon, authenticated;
grant execute on function app_private.sync_diagnostic_leaders(uuid,uuid,uuid[]) to service_role;
