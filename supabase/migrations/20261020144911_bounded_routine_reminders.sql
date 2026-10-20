-- Um contato inicial e, somente sem retorno, no máximo um lembrete por ciclo.
alter table app_private.routine_contact_jobs add column purpose text not null default 'inicial' check(purpose in('inicial','lembrete'));
alter table app_private.routine_contact_jobs drop constraint routine_contact_jobs_cycle_id_key;
alter table app_private.routine_contact_jobs add constraint routine_contact_jobs_cycle_purpose_key unique(cycle_id,purpose);
create table app_private.routine_reminder_checks (
 cycle_id uuid primary key references app_private.asset_adherence_cycles(id),
 checked_at timestamptz not null default clock_timestamp(),last_error boolean not null default false
);
alter table app_private.routine_reminder_checks enable row level security;
revoke all on app_private.routine_reminder_checks from public,anon,authenticated,service_role;
grant select,insert,update on app_private.routine_reminder_checks to service_role;
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
 select job_id into v_job from app_private.routine_contact_jobs where cycle_id=v_cycle.id and purpose='inicial';
 if found then return v_job; end if;
 insert into app_private.slack_delivery_jobs(event_id,organization_id,team_id,question)
 values('routine:'||v_cycle.id::text,p_organization_id,v_rule.assignee_team_id,jsonb_build_object('kind','rotina','teamId',v_rule.assignee_team_id,'userId',v_rule.assignee_user_id,'channel','pendente','ts','0.0','cycleId',v_cycle.id)) returning id into v_job;
 insert into app_private.routine_contact_jobs(job_id,cycle_id,organization_id,team_id,user_id) values(v_job,v_cycle.id,p_organization_id,v_rule.assignee_team_id,v_rule.assignee_user_id);
 return v_job;
end $$;

create or replace function app_private.get_routine_contact_context(p_job_id uuid,p_lease_id uuid,p_reserve boolean default false) returns jsonb
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_job app_private.slack_delivery_jobs; v_contact app_private.routine_contact_jobs; v_policy app_private.routine_contact_policies;
 v_cycle app_private.asset_adherence_cycles; v_rule app_private.asset_adherence_rules; v_local timestamp; v_next timestamp; v_quota boolean; v_version text; v_asset text; v_initial_at timestamptz;v_initial_channel text;v_recent timestamptz;
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
 if v_contact.purpose='lembrete' then
   perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('adherence-cycle:'||v_cycle.id::text,0));
   if exists(select 1 from app_private.asset_adherence_facts where cycle_id=v_cycle.id and organization_id=v_job.organization_id and payload->>'kind'='execucao_relatada') or
     exists(select 1 from app_private.routine_reply_proposals where cycle_id=v_cycle.id and organization_id=v_job.organization_id) or
     exists(select 1 from app_private.routine_supervision_events where cycle_id=v_cycle.id and organization_id=v_job.organization_id) or
     v_cycle.due_at<clock_timestamp()-interval '30 days' then return '{"disposition":"cancelar"}'::jsonb;end if;
   select j.updated_at,j.reply->>'channel' into v_initial_at,v_initial_channel from app_private.routine_contact_jobs c join app_private.slack_delivery_jobs j on j.id=c.job_id
     where c.cycle_id=v_cycle.id and c.organization_id=v_job.organization_id and c.purpose='inicial' and j.delivered_ts is not null;
   if v_initial_at is null or v_initial_at>clock_timestamp()-interval '24 hours' then return '{"disposition":"cancelar"}'::jsonb;end if;
   select max(received_at) into v_recent from app_private.slack_delivery_jobs where organization_id=v_job.organization_id and team_id=v_contact.team_id
     and question->>'kind'='direct' and question->>'userId'=v_contact.user_id and question->>'channel'=v_initial_channel and received_at>v_initial_at;
   if v_recent>clock_timestamp()-interval '24 hours' then return jsonb_build_object('disposition','adiar','availableAt',v_recent+interval '24 hours');end if;
 end if;
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
 return jsonb_build_object('disposition','enviar','purpose',v_contact.purpose,'cycleId',v_cycle.id,'title',coalesce(v_rule.title,'Rotina acordada'),'expectation',v_rule.expectation,'successIndicator',coalesce(v_rule.success_indicator,'Evidência da execução acordada'),'assetTitle',v_asset,'assetVersion',v_version,'opensAt',v_cycle.opens_at,'dueAt',v_cycle.due_at);
end $$;

create or replace function app_private.get_routine_reply_contexts(p_job_id uuid,p_lease_id uuid,p_cycle_id uuid default null)
returns jsonb language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_job app_private.slack_delivery_jobs;
begin
 select * into v_job from app_private.slack_delivery_jobs where id=p_job_id;
 if not found or v_job.status<>'processando' or v_job.lease_id is distinct from p_lease_id or v_job.lease_until<clock_timestamp() then
   raise exception using errcode='PT409',message='Reserva desatualizada'; end if;
 if v_job.question->>'kind'<>'direct' or v_job.question->>'channel' not like 'D%' or not exists(
   select 1 from app_private.slack_installations where team_id=v_job.team_id and organization_id=v_job.organization_id and revoked_at is null) then return '[]'::jsonb; end if;
 return coalesce((select jsonb_agg(x.context order by x.due_at desc,x.id) from (
 select c.id,c.due_at,jsonb_build_object('cycleId',c.id,'ruleId',r.id,'title',coalesce(r.title,'Rotina acordada'),
   'assetTitle',a.title,'assetVersion',v.version_number::text,'opensAt',c.opens_at,'dueAt',c.due_at) context
 from app_private.asset_adherence_cycles c
 join app_private.asset_adherence_rules r on r.id=c.rule_id and r.organization_id=c.organization_id
 join public.action_point_assignments ap on ap.diagnostic_id=r.diagnostic_id and ap.action_point_id=r.action_point_id and ap.organization_id=r.organization_id
 join public.admin_deliveries d on d.diagnostic_id=r.diagnostic_id and d.organization_id=r.organization_id and d.status='publicada' and r.action_point_id=any(d.selected_action_point_ids)
 join public.management_assets a on a.id=r.asset_id and a.organization_id=r.organization_id
 join public.management_asset_versions v on v.id=r.asset_version_id and v.asset_id=a.id and v.organization_id=r.organization_id
 join app_private.routine_contact_jobs contact on contact.cycle_id=c.id and contact.organization_id=c.organization_id
 join app_private.slack_delivery_jobs outbound on outbound.id=contact.job_id and outbound.organization_id=c.organization_id
 where contact.purpose='inicial' and c.organization_id=v_job.organization_id and c.opens_at<=clock_timestamp()
 and r.assignee_team_id=v_job.team_id and r.assignee_user_id=v_job.question->>'userId'
 and ap.assignee_team_id=r.assignee_team_id and ap.assignee_slack_user_id=r.assignee_user_id
 and contact.team_id=r.assignee_team_id and contact.user_id=r.assignee_user_id
 and outbound.delivered_ts is not null and outbound.reply->>'channel'=v_job.question->>'channel'
 and (p_cycle_id is null or c.id=p_cycle_id)
 and (p_cycle_id is not null or v_job.question->>'threadTs' is null or outbound.delivered_ts=v_job.question->>'threadTs'
   or exists(select 1 from app_private.routine_contact_jobs rem join app_private.slack_delivery_jobs rem_job on rem_job.id=rem.job_id where rem.cycle_id=c.id and rem.organization_id=c.organization_id and rem.team_id=v_job.team_id and rem.user_id=v_job.question->>'userId' and rem_job.delivered_ts=v_job.question->>'threadTs' and rem_job.reply->>'channel'=v_job.question->>'channel')
   or exists(select 1 from app_private.routine_reply_proposals p join app_private.slack_delivery_jobs j on j.id=p.source_job_id
     where p.cycle_id=c.id and p.organization_id=c.organization_id and p.team_id=v_job.team_id and p.user_id=v_job.question->>'userId'
     and p.channel_id=v_job.question->>'channel' and j.delivered_ts=v_job.question->>'threadTs'))
 order by c.due_at desc,c.id limit 21) x),'[]'::jsonb);
end $$;

create or replace function app_private.get_admin_routine_cycles(p_organization_id uuid,p_actor_user_id uuid,p_before_at timestamptz default null,p_before_id uuid default null)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then raise exception using errcode='42501',message='Acesso restrito à operação';end if;
 if not exists(select 1 from public.organizations where id=p_organization_id) then raise exception using errcode='PT404',message='Empresa indisponível';end if;
 if (p_before_at is null)<>(p_before_id is null) then raise exception using errcode='PT400',message='Cursor inválido';end if;
 return (with page as materialized (
   select * from app_private.asset_adherence_cycles where organization_id=p_organization_id and opens_at<=now() and
     (p_before_at is null or (created_at,id)<(p_before_at,p_before_id)) order by created_at desc,id desc limit 100
 ) select jsonb_build_object(
   'cycles',coalesce((select jsonb_agg(to_jsonb(c) order by created_at desc,id desc) from page c),'[]'::jsonb),
   'rules',coalesce((select jsonb_agg(to_jsonb(r)) from app_private.asset_adherence_rules r where r.id in(select rule_id from page)),'[]'::jsonb),
   'facts',coalesce((select jsonb_agg(to_jsonb(f) order by sequence) from app_private.asset_adherence_facts f where f.organization_id=p_organization_id and f.cycle_id in(select id from page)),'[]'::jsonb),
   'proposals',coalesce((select jsonb_agg(to_jsonb(p) order by created_at,id) from app_private.routine_reply_proposals p where p.organization_id=p_organization_id and p.cycle_id in(select id from page)),'[]'::jsonb),
   'reviews',coalesce((select jsonb_agg(to_jsonb(e)||jsonb_build_object('actorName',coalesce(u.name,'Operação DirectScal')) order by e.sequence) from app_private.routine_supervision_events e
      join next_auth.users u on u.id=e.actor_user_id where e.organization_id=p_organization_id and e.cycle_id in(select id from page)),'[]'::jsonb),
   'contacts',coalesce((select jsonb_agg(jsonb_build_object('cycleId',c.cycle_id,'deliveredAt',case when j.delivered_ts is not null then j.updated_at else null end,'status',j.status))
      from app_private.routine_contact_jobs c join app_private.slack_delivery_jobs j on j.id=c.job_id where c.organization_id=p_organization_id and c.purpose='inicial' and c.cycle_id in(select id from page)),'[]'::jsonb)
 ));
end $$;

create function app_private.enqueue_routine_reminders() returns jsonb
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_entry record;v_policy app_private.routine_contact_policies;v_job uuid;v_checked integer:=0;v_ensured integer:=0;v_failed integer:=0;v_error boolean;
begin
 for v_entry in
   select c.cycle_id,c.organization_id,c.team_id,c.user_id,cy.due_at,j.updated_at delivered_at
   from app_private.routine_contact_jobs c join app_private.slack_delivery_jobs j on j.id=c.job_id
   join app_private.asset_adherence_cycles cy on cy.id=c.cycle_id and cy.organization_id=c.organization_id
   join lateral(select * from app_private.routine_contact_policies where organization_id=c.organization_id order by revision desc limit 1) policy on policy.enabled
   left join app_private.routine_reminder_checks checked on checked.cycle_id=c.cycle_id
   where c.purpose='inicial' and j.delivered_ts is not null and j.updated_at<=clock_timestamp()-interval '24 hours'
     and cy.due_at>=clock_timestamp()-interval '30 days' and cy.created_at>=policy.enabled_at
     and not exists(select 1 from app_private.routine_contact_jobs r where r.cycle_id=c.cycle_id and r.purpose='lembrete')
     and not exists(select 1 from app_private.asset_adherence_facts f where f.cycle_id=c.cycle_id and f.organization_id=c.organization_id and f.payload->>'kind'='execucao_relatada')
     and not exists(select 1 from app_private.routine_reply_proposals p where p.cycle_id=c.cycle_id and p.organization_id=c.organization_id)
     and not exists(select 1 from app_private.routine_supervision_events e where e.cycle_id=c.cycle_id and e.organization_id=c.organization_id)
   order by checked.checked_at asc nulls first,c.cycle_id limit 25
 loop
   v_checked:=v_checked+1;v_error:=false;
   begin
     perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('routine-policy:'||v_entry.organization_id::text,0));
     select * into v_policy from app_private.routine_contact_policies where organization_id=v_entry.organization_id order by revision desc limit 1;
     if v_policy.enabled and not exists(select 1 from app_private.routine_contact_jobs where cycle_id=v_entry.cycle_id and purpose='lembrete') then
       insert into app_private.slack_delivery_jobs(event_id,organization_id,team_id,question)
       values('routine-reminder:'||v_entry.cycle_id,v_entry.organization_id,v_entry.team_id,jsonb_build_object('kind','rotina','teamId',v_entry.team_id,'userId',v_entry.user_id,'channel','pendente','ts','0.0','cycleId',v_entry.cycle_id)) returning id into v_job;
       insert into app_private.routine_contact_jobs(job_id,cycle_id,organization_id,team_id,user_id,purpose)
       values(v_job,v_entry.cycle_id,v_entry.organization_id,v_entry.team_id,v_entry.user_id,'lembrete');
       v_ensured:=v_ensured+1;
     end if;
   exception when others then v_error:=true;v_failed:=v_failed+1;
   end;
   insert into app_private.routine_reminder_checks(cycle_id,checked_at,last_error) values(v_entry.cycle_id,clock_timestamp(),v_error)
     on conflict(cycle_id) do update set checked_at=excluded.checked_at,last_error=excluded.last_error;
 end loop;
 return jsonb_build_object('checked',v_checked,'ensured',v_ensured,'failed',v_failed);
end $$;
revoke all on function app_private.enqueue_routine_reminders() from public,anon,authenticated;
grant execute on function app_private.enqueue_routine_reminders() to service_role;
notify pgrst,'reload schema';

