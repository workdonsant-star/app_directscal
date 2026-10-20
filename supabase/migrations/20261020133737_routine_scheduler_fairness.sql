create table app_private.routine_schedule_positions (
 routine_id uuid primary key,organization_id uuid not null references public.organizations(id) on delete cascade,
 rule_id uuid not null references app_private.asset_adherence_rules(id),checked_at timestamptz not null default clock_timestamp(),last_error boolean not null default false
);
create index routine_schedule_positions_org_idx on app_private.routine_schedule_positions(organization_id);
create index routine_schedule_positions_rule_idx on app_private.routine_schedule_positions(rule_id);
alter table app_private.routine_schedule_positions enable row level security;
revoke all on app_private.routine_schedule_positions from public,anon,authenticated,service_role;
grant select,insert,update on app_private.routine_schedule_positions to service_role;
create function app_private.touch_routine_contact_schedule(p_rule_id uuid,p_error boolean) returns void
language sql security invoker set search_path='' as $$
 insert into app_private.routine_schedule_positions(routine_id,organization_id,rule_id,last_error)
 select routine_id,organization_id,id,p_error from app_private.asset_adherence_rules where id=p_rule_id
 on conflict(routine_id) do update set rule_id=excluded.rule_id,checked_at=clock_timestamp(),last_error=excluded.last_error;
$$;
revoke all on function app_private.touch_routine_contact_schedule(uuid,boolean) from public,anon,authenticated;
grant execute on function app_private.touch_routine_contact_schedule(uuid,boolean) to service_role;
create or replace function app_private.get_routine_contact_schedule() returns jsonb
language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(source.payload),'[]'::jsonb) from (
 select jsonb_build_object('policyId',p.id,'enabledAt',p.enabled_at,'rule',to_jsonb(r)-'write_payload') as payload
 from(select distinct on(organization_id) * from app_private.routine_contact_policies order by organization_id,revision desc)p
 join(select distinct on(routine_id) * from app_private.asset_adherence_rules order by routine_id,revision desc)r on r.organization_id=p.organization_id
 left join app_private.routine_schedule_positions pos on pos.routine_id=r.routine_id
 where p.enabled and r.sector_id=any(p.sector_ids)
 and coalesce((select action<>'pausar' from app_private.asset_adherence_routine_events where routine_id=r.routine_id and organization_id=r.organization_id order by sequence desc limit 1),true)
 and exists(select 1 from public.organization_sectors where id=r.sector_id and organization_id=r.organization_id and active)
 and exists(select 1 from app_private.slack_installations where organization_id=r.organization_id and team_id=r.assignee_team_id and revoked_at is null)
 order by pos.checked_at nulls first,r.routine_id limit 25)source;
$$;

notify pgrst,'reload schema';
