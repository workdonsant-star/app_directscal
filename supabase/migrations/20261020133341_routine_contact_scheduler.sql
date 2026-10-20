create table app_private.routine_contact_policies (
 id uuid primary key, organization_id uuid not null references public.organizations(id) on delete cascade,
 revision integer not null check(revision>0), enabled boolean not null, sector_ids uuid[] not null,
 weekdays integer[] not null check(cardinality(weekdays) between 1 and 5 and weekdays<@array[1,2,3,4,5]),
 start_hour integer not null check(start_hour between 6 and 21), end_hour integer not null check(end_hour between 7 and 22 and end_hour>start_hour),
 time_zone text not null check(time_zone in('America/Sao_Paulo','America/Manaus','America/Rio_Branco','America/Fortaleza')),
 max_company_per_day integer not null check(max_company_per_day between 1 and 50), max_person_per_day integer not null check(max_person_per_day between 1 and 5 and max_person_per_day<=max_company_per_day),
 reason text not null check(length(trim(reason)) between 1 and 2000), created_by uuid not null references next_auth.users(id),
 created_at timestamptz not null default clock_timestamp(), enabled_at timestamptz, write_payload jsonb not null,
 unique(organization_id,revision),check(not enabled or (cardinality(sector_ids)>0 and enabled_at is not null))
);
create index routine_contact_policies_actor_idx on app_private.routine_contact_policies(created_by);
create table app_private.routine_contact_jobs (
 job_id uuid primary key references app_private.slack_delivery_jobs(id) on delete cascade,
 cycle_id uuid not null unique references app_private.asset_adherence_cycles(id), organization_id uuid not null references public.organizations(id) on delete cascade,
 team_id text not null, user_id text not null, created_at timestamptz not null default clock_timestamp()
);
create index routine_contact_jobs_org_idx on app_private.routine_contact_jobs(organization_id,created_at);
create table app_private.routine_contact_reservations (
 job_id uuid not null references app_private.routine_contact_jobs(job_id) on delete cascade,
 organization_id uuid not null references public.organizations(id) on delete cascade,
 local_date date not null, team_id text not null, user_id text not null, reserved_at timestamptz not null default clock_timestamp(),
 primary key(job_id,local_date)
);
create index routine_contact_reservations_daily_idx on app_private.routine_contact_reservations(organization_id,local_date,team_id,user_id);
alter table app_private.routine_contact_policies enable row level security;
alter table app_private.routine_contact_jobs enable row level security;
alter table app_private.routine_contact_reservations enable row level security;
revoke all on app_private.routine_contact_policies,app_private.routine_contact_jobs,app_private.routine_contact_reservations from public,anon,authenticated,service_role;
grant select,insert on app_private.routine_contact_policies,app_private.routine_contact_jobs,app_private.routine_contact_reservations to service_role;

create function app_private.save_routine_contact_policy(p_organization_id uuid,p_actor_user_id uuid,p_input jsonb) returns integer
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_existing app_private.routine_contact_policies; v_current app_private.routine_contact_policies; v_sectors uuid[]; v_days integer[]; v_revision integer; v_enabled boolean;
begin
 if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then raise exception using errcode='42501',message='Acesso restrito'; end if;
 perform 1 from public.organizations where id=p_organization_id;
 if not found then raise exception using errcode='PT404',message='Empresa indisponível'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('routine-policy:'||p_organization_id::text,0));
 select * into v_existing from app_private.routine_contact_policies where id=(p_input->>'id')::uuid;
 if found then
   if v_existing.organization_id=p_organization_id and v_existing.created_by=p_actor_user_id and v_existing.write_payload=p_input then return v_existing.revision; end if;
   raise exception using errcode='PT409',message='Tentativa divergente';
 end if;
 select * into v_current from app_private.routine_contact_policies where organization_id=p_organization_id order by revision desc limit 1;
 if coalesce(v_current.revision,0) is distinct from (p_input->>'expectedRevision')::integer then raise exception using errcode='PT409',message='Política mudou'; end if;
 select array_agg(x::uuid) into v_sectors from jsonb_array_elements_text(p_input->'sectorIds') x;
 select array_agg(x::integer) into v_days from jsonb_array_elements_text(p_input->'weekdays') x;
 v_sectors:=coalesce(v_sectors,'{}');v_enabled:=(p_input->>'enabled')::boolean;
 if cardinality(v_sectors)>200 or cardinality(v_sectors)<>(select count(distinct x) from unnest(v_sectors)x) or
   cardinality(v_days)<>(select count(distinct x) from unnest(v_days)x) or exists(select 1 from unnest(v_sectors)x where not exists(select 1 from public.organization_sectors where id=x and organization_id=p_organization_id and active)) then
   raise exception using errcode='PT400',message='Público inválido'; end if;
 if v_enabled and not exists(select 1 from app_private.slack_installations where organization_id=p_organization_id and revoked_at is null and
   string_to_array(coalesce(scope,''),',')@>array['users:read','im:write','chat:write']) then raise exception using errcode='PT409',message='Reconecte o Slack com as permissões necessárias'; end if;
 v_revision:=coalesce(v_current.revision,0)+1;
 insert into app_private.routine_contact_policies(id,organization_id,revision,enabled,sector_ids,weekdays,start_hour,end_hour,time_zone,max_company_per_day,max_person_per_day,reason,created_by,enabled_at,write_payload)
 values((p_input->>'id')::uuid,p_organization_id,v_revision,v_enabled,v_sectors,v_days,(p_input->>'startHour')::integer,(p_input->>'endHour')::integer,p_input->>'timeZone',(p_input->>'maxCompanyPerDay')::integer,(p_input->>'maxPersonPerDay')::integer,p_input->>'reason',p_actor_user_id,
 case when v_enabled then case when v_current.enabled then v_current.enabled_at else clock_timestamp() end else null end,p_input);
 return v_revision;
end $$;

create function app_private.get_routine_contact_policy(p_organization_id uuid,p_actor_user_id uuid) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then raise exception using errcode='42501',message='Acesso restrito'; end if;
 return (select to_jsonb(p)-'write_payload' from app_private.routine_contact_policies p where organization_id=p_organization_id order by revision desc limit 1);
end $$;

create function app_private.get_routine_contact_schedule() returns jsonb
language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('policyId',p.id,'enabledAt',p.enabled_at,'rule',to_jsonb(r)-'write_payload')),'[]'::jsonb)
 from(select distinct on(organization_id) * from app_private.routine_contact_policies order by organization_id,revision desc)p
 join(select distinct on(routine_id) * from app_private.asset_adherence_rules order by routine_id,revision desc)r on r.organization_id=p.organization_id
 where p.enabled and r.sector_id=any(p.sector_ids)
 and coalesce((select action<>'pausar' from app_private.asset_adherence_routine_events where routine_id=r.routine_id and organization_id=r.organization_id order by sequence desc limit 1),true)
 and exists(select 1 from public.organization_sectors where id=r.sector_id and organization_id=r.organization_id and active)
 and exists(select 1 from app_private.slack_installations where organization_id=r.organization_id and team_id=r.assignee_team_id and revoked_at is null);
$$;

create function app_private.enqueue_routine_contact(p_organization_id uuid,p_policy_id uuid,p_rule_id uuid,p_opportunity_key text,p_opens_at timestamptz,p_due_at timestamptz) returns uuid
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_policy app_private.routine_contact_policies; v_rule app_private.asset_adherence_rules; v_cycle app_private.asset_adherence_cycles; v_job uuid;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('routine-policy:'||p_organization_id::text,0));
 select * into v_policy from app_private.routine_contact_policies where organization_id=p_organization_id order by revision desc limit 1;
 if v_policy.id is distinct from p_policy_id or not v_policy.enabled then return null; end if;
 select * into v_rule from app_private.asset_adherence_rules where id=p_rule_id and organization_id=p_organization_id;
 if not found or not v_rule.sector_id=any(v_policy.sector_ids) then return null; end if;
 perform 1 from public.diagnostics where id=v_rule.diagnostic_id and organization_id=p_organization_id for update;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_rule.routine_id::text,0));
 if p_rule_id is distinct from (select id from app_private.asset_adherence_rules where routine_id=v_rule.routine_id order by revision desc limit 1) then return null; end if;
 if p_opportunity_key not like 'calendario:'||(v_rule.schedule->>'cadence')||':%' or v_rule.schedule->>'kind'<>'periodica'
   or p_opens_at<date_trunc('milliseconds',greatest(v_policy.enabled_at,v_rule.created_at)) or p_opens_at>clock_timestamp() or p_due_at<p_opens_at or p_due_at>clock_timestamp()+interval '370 days' then
   raise exception using errcode='PT400',message='Oportunidade inválida'; end if;
 if (select action from app_private.asset_adherence_routine_events where organization_id=p_organization_id and routine_id=v_rule.routine_id order by sequence desc limit 1)='pausar' then return null; end if;
 if not exists(select 1 from public.organization_sectors where id=v_rule.sector_id and organization_id=p_organization_id and active) or
 not exists(select 1 from public.admin_deliveries where organization_id=p_organization_id and diagnostic_id=v_rule.diagnostic_id and status='publicada' and v_rule.action_point_id=any(selected_action_point_ids)) or
 not exists(select 1 from public.action_point_assignments where organization_id=p_organization_id and diagnostic_id=v_rule.diagnostic_id and action_point_id=v_rule.action_point_id and assignee_team_id=v_rule.assignee_team_id and assignee_slack_user_id=v_rule.assignee_user_id) then return null; end if;
 p_opens_at:=greatest(p_opens_at,v_policy.enabled_at,v_rule.created_at);
 select * into v_cycle from app_private.asset_adherence_cycles where routine_id=v_rule.routine_id and opportunity_key=p_opportunity_key;
 if not found then
   insert into app_private.asset_adherence_cycles(organization_id,rule_id,routine_id,opportunity_key,opens_at,due_at) values(p_organization_id,p_rule_id,v_rule.routine_id,p_opportunity_key,p_opens_at,p_due_at) returning * into v_cycle;
 end if;
 if v_cycle.organization_id<>p_organization_id or v_cycle.rule_id<>p_rule_id then return null; end if;
 select job_id into v_job from app_private.routine_contact_jobs where cycle_id=v_cycle.id;
 if found then return v_job; end if;
 insert into app_private.slack_delivery_jobs(event_id,organization_id,team_id,question)
 values('routine:'||v_cycle.id::text,p_organization_id,v_rule.assignee_team_id,jsonb_build_object('kind','rotina','teamId',v_rule.assignee_team_id,'userId',v_rule.assignee_user_id,'channel','pendente','ts','0.0','cycleId',v_cycle.id)) returning id into v_job;
 insert into app_private.routine_contact_jobs(job_id,cycle_id,organization_id,team_id,user_id) values(v_job,v_cycle.id,p_organization_id,v_rule.assignee_team_id,v_rule.assignee_user_id);
 return v_job;
end $$;

create function app_private.get_routine_contact_context(p_job_id uuid,p_lease_id uuid,p_reserve boolean default false) returns jsonb
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_job app_private.slack_delivery_jobs; v_contact app_private.routine_contact_jobs; v_policy app_private.routine_contact_policies;
 v_cycle app_private.asset_adherence_cycles; v_rule app_private.asset_adherence_rules; v_local timestamp; v_next timestamp; v_quota boolean; v_version text; v_asset text;
begin
 select * into v_job from app_private.slack_delivery_jobs where id=p_job_id for update;
 if not found or v_job.status<>'processando' or v_job.lease_id is distinct from p_lease_id or v_job.lease_until<clock_timestamp() then raise exception using errcode='PT409',message='Reserva desatualizada'; end if;
 select * into v_contact from app_private.routine_contact_jobs where job_id=p_job_id and organization_id=v_job.organization_id;
 if not found then raise exception using errcode='PT404',message='Contato indisponível'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('routine-policy:'||v_job.organization_id::text,0));
 select * into v_policy from app_private.routine_contact_policies where organization_id=v_job.organization_id order by revision desc limit 1;
 select * into v_cycle from app_private.asset_adherence_cycles where id=v_contact.cycle_id and organization_id=v_job.organization_id;
 select * into v_rule from app_private.asset_adherence_rules where id=v_cycle.rule_id;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_rule.routine_id::text,0));
 if not coalesce(v_policy.enabled,false) or not v_rule.sector_id=any(v_policy.sector_ids) or
 (select action from app_private.asset_adherence_routine_events where routine_id=v_rule.routine_id and organization_id=v_job.organization_id order by sequence desc limit 1)='pausar' or
 not exists(select 1 from public.organization_sectors where id=v_rule.sector_id and organization_id=v_job.organization_id and active) or
 not exists(select 1 from public.admin_deliveries where organization_id=v_job.organization_id and diagnostic_id=v_rule.diagnostic_id and status='publicada' and v_rule.action_point_id=any(selected_action_point_ids)) or
 not exists(select 1 from public.action_point_assignments where organization_id=v_job.organization_id and diagnostic_id=v_rule.diagnostic_id and action_point_id=v_rule.action_point_id and assignee_team_id=v_contact.team_id and assignee_slack_user_id=v_contact.user_id) or
 not exists(select 1 from app_private.slack_installations where organization_id=v_job.organization_id and team_id=v_contact.team_id and revoked_at is null) then return '{"disposition":"cancelar"}'::jsonb; end if;
 select a.title,v.version_number into v_asset,v_version from public.management_assets a join public.management_asset_versions v on v.id=v_rule.asset_version_id and v.asset_id=a.id and v.organization_id=a.organization_id
 where a.id=v_rule.asset_id and a.organization_id=v_job.organization_id and a.status='publicado' and v.review_status='publicado';
 if not found then return '{"disposition":"cancelar"}'::jsonb; end if;
 v_local:=clock_timestamp() at time zone v_policy.time_zone;
 v_quota:=not exists(select 1 from app_private.routine_contact_reservations where job_id=p_job_id and local_date=v_local::date) and
 ((select count(*) from app_private.routine_contact_reservations where organization_id=v_job.organization_id and local_date=v_local::date)>=v_policy.max_company_per_day or
 (select count(*) from app_private.routine_contact_reservations where organization_id=v_job.organization_id and local_date=v_local::date and team_id=v_contact.team_id and user_id=v_contact.user_id)>=v_policy.max_person_per_day);
 if extract(isodow from v_local)::integer<>all(v_policy.weekdays) or extract(hour from v_local)<v_policy.start_hour or extract(hour from v_local)>=v_policy.end_hour or v_quota then
   v_next:=v_local::date+make_time(v_policy.start_hour,0,0);
   if v_local>=v_next or v_quota then v_next:=v_next+interval '1 day'; end if;
   for i in 0..7 loop
     if extract(isodow from v_next)::integer=any(v_policy.weekdays) then return jsonb_build_object('disposition','adiar','availableAt',v_next at time zone v_policy.time_zone); end if;
     v_next:=v_next+interval '1 day';
   end loop;
   raise exception using errcode='PT409',message='Janela indisponível';
 end if;
 if p_reserve then insert into app_private.routine_contact_reservations(job_id,organization_id,local_date,team_id,user_id) values(p_job_id,v_job.organization_id,v_local::date,v_contact.team_id,v_contact.user_id) on conflict do nothing; end if;
 return jsonb_build_object('disposition','enviar','cycleId',v_cycle.id,'title',coalesce(v_rule.title,'Rotina acordada'),'expectation',v_rule.expectation,'successIndicator',coalesce(v_rule.success_indicator,'Evidência da execução acordada'),'assetTitle',v_asset,'assetVersion',v_version,'opensAt',v_cycle.opens_at,'dueAt',v_cycle.due_at);
end $$;

create function app_private.defer_slack_delivery(p_id uuid,p_lease_id uuid,p_available_at timestamptz) returns void
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
begin
 if p_available_at<=clock_timestamp() or p_available_at>clock_timestamp()+interval '8 days' then raise exception using errcode='PT400',message='Adiamento inválido'; end if;
 update app_private.slack_delivery_jobs set status='recebido',attempts=greatest(attempts-1,0),available_at=p_available_at,lease_id=null,lease_until=null,updated_at=clock_timestamp()
 where id=p_id and status='processando' and lease_id=p_lease_id and lease_until>=clock_timestamp() and send_started_at is null;
 if not found then raise exception using errcode='PT409',message='Reserva desatualizada'; end if;
end $$;
revoke all on function app_private.save_routine_contact_policy(uuid,uuid,jsonb),app_private.get_routine_contact_policy(uuid,uuid),app_private.get_routine_contact_schedule(),app_private.enqueue_routine_contact(uuid,uuid,uuid,text,timestamptz,timestamptz),app_private.get_routine_contact_context(uuid,uuid,boolean),app_private.defer_slack_delivery(uuid,uuid,timestamptz) from public,anon,authenticated;
grant execute on function app_private.save_routine_contact_policy(uuid,uuid,jsonb),app_private.get_routine_contact_policy(uuid,uuid),app_private.get_routine_contact_schedule(),app_private.enqueue_routine_contact(uuid,uuid,uuid,text,timestamptz,timestamptz),app_private.get_routine_contact_context(uuid,uuid,boolean),app_private.defer_slack_delivery(uuid,uuid,timestamptz) to service_role;
notify pgrst,'reload schema';
