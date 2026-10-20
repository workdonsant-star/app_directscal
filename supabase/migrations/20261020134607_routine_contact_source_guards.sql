-- Novas oportunidades e contatos exigem a versão acordada ainda vigente.
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
 and exists(select 1 from public.management_assets where id=r.asset_id and organization_id=r.organization_id and status='publicado' and current_published_version_id=r.asset_version_id)
 and exists(select 1 from app_private.slack_installations where organization_id=r.organization_id and team_id=r.assignee_team_id and revoked_at is null)
 order by pos.checked_at nulls first,r.routine_id limit 25)source;
$$;


create or replace function app_private.enqueue_routine_contact(p_organization_id uuid,p_policy_id uuid,p_rule_id uuid,p_opportunity_key text,p_opens_at timestamptz,p_due_at timestamptz) returns uuid
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
 if not exists(select 1 from public.management_assets where id=v_rule.asset_id and organization_id=p_organization_id and status='publicado' and current_published_version_id=v_rule.asset_version_id) or
 not exists(select 1 from app_private.slack_installations where organization_id=p_organization_id and team_id=v_rule.assignee_team_id and revoked_at is null) or
 not exists(select 1 from public.organization_sectors where id=v_rule.sector_id and organization_id=p_organization_id and active) or
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

create or replace function app_private.get_routine_contact_context(p_job_id uuid,p_lease_id uuid,p_reserve boolean default false) returns jsonb
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
 where a.id=v_rule.asset_id and a.organization_id=v_job.organization_id and a.status='publicado' and a.current_published_version_id=v_rule.asset_version_id and v.review_status='publicado';
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

notify pgrst,'reload schema';
