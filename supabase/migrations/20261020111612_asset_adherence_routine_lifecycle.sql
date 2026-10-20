-- Pausar afeta novas oportunidades; ciclos e evidências anteriores permanecem.
create table app_private.asset_adherence_routine_events (
  id uuid primary key,
  sequence bigint generated always as identity unique,
  organization_id uuid not null references public.organizations(id),
  routine_id uuid not null,
  action text not null check(action in ('pausar','retomar')),
  reason text not null check(char_length(trim(reason)) between 1 and 2000),
  actor_user_id uuid not null references next_auth.users(id),
  recorded_at timestamptz not null default clock_timestamp()
);
create index asset_adherence_routine_events_org_idx on app_private.asset_adherence_routine_events(organization_id,routine_id,sequence desc);
create index asset_adherence_routine_events_actor_idx on app_private.asset_adherence_routine_events(actor_user_id);
alter table app_private.asset_adherence_routine_events enable row level security;
revoke all on app_private.asset_adherence_routine_events from public,anon,authenticated,service_role;
grant select,insert on app_private.asset_adherence_routine_events to service_role;
revoke all on sequence app_private.asset_adherence_routine_events_sequence_seq from public,anon,authenticated,service_role;
grant usage,select on sequence app_private.asset_adherence_routine_events_sequence_seq to service_role;

create function app_private.transition_asset_adherence_routine(
  p_organization_id uuid,p_routine_id uuid,p_actor_user_id uuid,p_id uuid,p_expected_event_id uuid,p_action text,p_reason text
) returns jsonb language plpgsql security invoker set search_path='' set lock_timeout='5s' as $$
declare
  v_last app_private.asset_adherence_routine_events;
  v_existing app_private.asset_adherence_routine_events;
  v_now timestamptz;
begin
  if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then
    raise exception 'Acesso restrito à operação DirectScal.' using errcode='42501'; end if;
  if p_action is null or p_action not in ('pausar','retomar') or p_reason is null or char_length(trim(p_reason)) not between 1 and 2000 then
    raise exception 'Registre a ação e a justificativa.' using errcode='PT400'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_routine_id::text,0));
  if not exists(select 1 from app_private.asset_adherence_rules where routine_id=p_routine_id and organization_id=p_organization_id) then
    raise exception 'Rotina indisponível.' using errcode='PT404'; end if;
  select * into v_existing from app_private.asset_adherence_routine_events where id=p_id;
  if found then
    if v_existing.organization_id=p_organization_id and v_existing.routine_id=p_routine_id and v_existing.actor_user_id=p_actor_user_id
      and v_existing.action=p_action and v_existing.reason=trim(p_reason) then
      return jsonb_build_object('paused',v_existing.action='pausar','eventId',v_existing.id,'recordedAt',v_existing.recorded_at);
    end if;
    raise exception 'Tentativa já utilizada.' using errcode='PT409'; end if;
  select * into v_last from app_private.asset_adherence_routine_events where organization_id=p_organization_id and routine_id=p_routine_id order by sequence desc limit 1;
  if v_last.id is distinct from p_expected_event_id then
    raise exception 'A situação da rotina mudou em outra sessão.' using errcode='PT409'; end if;
  if coalesce(v_last.action,'retomar')=p_action then
    raise exception 'A rotina já está nessa situação.' using errcode='PT409'; end if;
  insert into app_private.asset_adherence_routine_events(id,organization_id,routine_id,action,reason,actor_user_id)
    values(p_id,p_organization_id,p_routine_id,p_action,trim(p_reason),p_actor_user_id) returning recorded_at into v_now;
  return jsonb_build_object('paused',p_action='pausar','eventId',p_id,'recordedAt',v_now);
end;
$$;
revoke all on function app_private.transition_asset_adherence_routine(uuid,uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function app_private.transition_asset_adherence_routine(uuid,uuid,uuid,uuid,uuid,text,text) to service_role;

create or replace function app_private.validate_asset_adherence_cycle() returns trigger
language plpgsql security invoker set search_path='' set lock_timeout='5s' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.routine_id::text,0));
  if exists(select 1 from app_private.asset_adherence_rules where id=new.rule_id and organization_id<>new.organization_id) then
    raise exception 'Acordo pertence a outra empresa.' using errcode='42501'; end if;
  if new.rule_id is distinct from (select id from app_private.asset_adherence_rules
    where routine_id=new.routine_id and organization_id=new.organization_id order by revision desc limit 1) then
    raise exception 'Use o acordo vigente para novas oportunidades.' using errcode='PT409'; end if;
  if (select action from app_private.asset_adherence_routine_events where organization_id=new.organization_id and routine_id=new.routine_id order by sequence desc limit 1)='pausar' then
    raise exception 'A rotina está pausada. Retome antes de abrir outra oportunidade.' using errcode='PT409'; end if;
  return new;
end;
$$;
