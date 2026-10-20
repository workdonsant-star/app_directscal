-- Relatos do Slack exigem proposta e confirmação da mesma pessoa na mesma DM.
alter table app_private.asset_adherence_facts alter column actor_user_id drop not null;
alter table app_private.asset_adherence_facts
 add column origin text not null default 'manual',
 add column slack_team_id text,
 add column slack_user_id text,
 add column slack_event_job_id uuid references app_private.slack_delivery_jobs(id),
 add constraint asset_adherence_fact_origin_check check (
 (origin='manual' and actor_user_id is not null and slack_team_id is null and slack_user_id is null and slack_event_job_id is null) or
 (origin='slack' and actor_user_id is null and slack_team_id is not null and slack_user_id is not null and slack_event_job_id is not null));
create index asset_adherence_facts_slack_job_idx on app_private.asset_adherence_facts(slack_event_job_id);

create table app_private.routine_reply_proposals (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 cycle_id uuid not null,
 source_job_id uuid not null unique references app_private.slack_delivery_jobs(id),
 team_id text not null, user_id text not null, channel_id text not null check(channel_id like 'D%'),
 actor_name text not null check(char_length(trim(actor_name)) between 1 and 160),
 operation jsonb not null check(jsonb_typeof(operation)='object'),
 context jsonb not null,
 expected_fact_id uuid references app_private.asset_adherence_facts(id),
 expected_assignment_updated_at timestamptz not null,
 status text not null default 'pendente' check(status in('pendente','confirmada','cancelada')),
 created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null default clock_timestamp()+interval '30 minutes',
 resolution_job_id uuid unique references app_private.slack_delivery_jobs(id),
 resolved_at timestamptz,
 fact_id uuid unique references app_private.asset_adherence_facts(id),
 event_id uuid unique references public.action_point_events(id),
 foreign key(cycle_id,organization_id) references app_private.asset_adherence_cycles(id,organization_id),
 check((status='pendente')=(resolved_at is null)),
 check((resolution_job_id is null)=(resolved_at is null))
);
create index routine_reply_proposals_org_idx on app_private.routine_reply_proposals(organization_id,created_at,id);
create index routine_reply_proposals_cycle_idx on app_private.routine_reply_proposals(cycle_id,organization_id);
create index routine_reply_proposals_expected_fact_idx on app_private.routine_reply_proposals(expected_fact_id);
alter table app_private.routine_reply_proposals enable row level security;
revoke all on app_private.routine_reply_proposals from public,anon,authenticated,service_role;
grant select,insert,update on app_private.routine_reply_proposals to service_role;

-- Sem referência explícita, mais de um ciclo elegível exige esclarecimento.
-- Uma thread só resolve ciclos da própria conversa que já receberam contato.
create function app_private.get_routine_reply_contexts(p_job_id uuid,p_lease_id uuid,p_cycle_id uuid default null)
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
 where c.organization_id=v_job.organization_id and c.opens_at<=clock_timestamp()
 and r.assignee_team_id=v_job.team_id and r.assignee_user_id=v_job.question->>'userId'
 and ap.assignee_team_id=r.assignee_team_id and ap.assignee_slack_user_id=r.assignee_user_id
 and contact.team_id=r.assignee_team_id and contact.user_id=r.assignee_user_id
 and outbound.delivered_ts is not null and outbound.reply->>'channel'=v_job.question->>'channel'
 and (p_cycle_id is null or c.id=p_cycle_id)
 and (p_cycle_id is not null or v_job.question->>'threadTs' is null or outbound.delivered_ts=v_job.question->>'threadTs'
   or exists(select 1 from app_private.routine_reply_proposals p join app_private.slack_delivery_jobs j on j.id=p.source_job_id
     where p.cycle_id=c.id and p.organization_id=c.organization_id and p.team_id=v_job.team_id and p.user_id=v_job.question->>'userId'
     and p.channel_id=v_job.question->>'channel' and j.delivered_ts=v_job.question->>'threadTs'))
 order by c.due_at desc,c.id limit 21) x),'[]'::jsonb);
end $$;

create function app_private.propose_routine_reply(p_job_id uuid,p_lease_id uuid,p_cycle_id uuid,p_actor_name text,p_operation jsonb)
returns jsonb language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_job app_private.slack_delivery_jobs; v_context jsonb; v_rule app_private.asset_adherence_rules;
 v_assignment public.action_point_assignments; v_proposal app_private.routine_reply_proposals;
 v_kind text:=p_operation->>'kind'; v_fact uuid; v_diagnostic uuid;
begin
 select * into v_job from app_private.slack_delivery_jobs where id=p_job_id for update;
 if not found or v_job.status<>'processando' or v_job.lease_id is distinct from p_lease_id or v_job.lease_until<clock_timestamp() then
   raise exception using errcode='PT409',message='Reserva desatualizada'; end if;
 select * into v_proposal from app_private.routine_reply_proposals where source_job_id=p_job_id;
 if found then
   if v_proposal.cycle_id<>p_cycle_id or v_proposal.operation<>p_operation then raise exception using errcode='PT409',message='Proposta divergente'; end if;
   return jsonb_build_object('id',v_proposal.id,'status',v_proposal.status,'expiresAt',v_proposal.expires_at,'operation',v_proposal.operation,'context',v_proposal.context);
 end if;
 if jsonb_typeof(p_operation) is distinct from 'object' or coalesce(v_kind,'') not in('execucao','bloqueio','excecao','progresso','leitura') or
   coalesce(char_length(trim(p_actor_name)),0) not between 1 and 160 then raise exception using errcode='PT400',message='Relato inválido'; end if;
 if p_operation-(case v_kind when 'execucao' then array['kind','performed','evidence','description']
   when 'progresso' then array['kind','value','reason'] when 'leitura' then array['kind'] else array['kind','reason'] end)<>'{}'::jsonb then
   raise exception using errcode='PT400',message='Campos desconhecidos'; end if;
 if v_kind in('bloqueio','excecao','progresso') and (jsonb_typeof(p_operation->'reason') is distinct from 'string' or
   coalesce(char_length(trim(p_operation->>'reason')),0) not between 1 and 2000) then raise exception using errcode='PT400',message='Justifique o relato'; end if;
 if v_kind='progresso' then
   if jsonb_typeof(p_operation->'value') is distinct from 'number' or (p_operation->>'value')::numeric not between 0 and 100 or
      trunc((p_operation->>'value')::numeric)<>(p_operation->>'value')::numeric then raise exception using errcode='PT400',message='Progresso inválido'; end if;
 end if;
 if v_kind='execucao' then
   if jsonb_typeof(p_operation->'performed') is distinct from 'boolean' or jsonb_typeof(p_operation->'evidence') is distinct from 'array' or
      jsonb_typeof(p_operation->'description') is distinct from 'string' or coalesce(char_length(trim(p_operation->>'description')),0) not between 1 and 2000 then
     raise exception using errcode='PT400',message='Execução inválida'; end if;
   if jsonb_array_length(p_operation->'evidence')>20 or exists(select 1 from jsonb_array_elements(p_operation->'evidence') e
      where jsonb_typeof(e)<>'string' or e#>>'{}' !~ '^https://[^[:space:]]+$' or char_length(e#>>'{}')>2000) then
     raise exception using errcode='PT400',message='Evidência inválida'; end if;
 end if;
 select r.diagnostic_id into v_diagnostic from app_private.asset_adherence_cycles c join app_private.asset_adherence_rules r on r.id=c.rule_id where c.id=p_cycle_id and c.organization_id=v_job.organization_id;
 perform 1 from public.diagnostics where id=v_diagnostic for update;
 select r.* into v_rule from app_private.asset_adherence_cycles c join app_private.asset_adherence_rules r on r.id=c.rule_id where c.id=p_cycle_id and c.organization_id=v_job.organization_id;
 if not found then return null; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_rule.routine_id::text,0));
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('adherence-cycle:'||p_cycle_id::text,0));
 v_context:=app_private.get_routine_reply_contexts(p_job_id,p_lease_id,p_cycle_id)->0;
 if v_context is null then return null; end if;
 select * into v_assignment from public.action_point_assignments where organization_id=v_job.organization_id and diagnostic_id=v_rule.diagnostic_id and action_point_id=v_rule.action_point_id for update;
 select id into v_fact from app_private.asset_adherence_facts where cycle_id=p_cycle_id and organization_id=v_job.organization_id and payload->>'kind'=
   case when v_kind in('execucao','bloqueio') then 'execucao_relatada' when v_kind='excecao' then 'excecao_solicitada' else '' end order by sequence desc limit 1;
 insert into app_private.routine_reply_proposals(organization_id,cycle_id,source_job_id,team_id,user_id,channel_id,actor_name,operation,context,expected_fact_id,expected_assignment_updated_at)
 values(v_job.organization_id,p_cycle_id,p_job_id,v_job.team_id,v_job.question->>'userId',v_job.question->>'channel',trim(p_actor_name),p_operation,v_context,v_fact,v_assignment.updated_at)
 returning * into v_proposal;
 return jsonb_build_object('id',v_proposal.id,'status',v_proposal.status,'expiresAt',v_proposal.expires_at,'operation',v_proposal.operation,'context',v_proposal.context);
end $$;

create function app_private.resolve_routine_reply(p_job_id uuid,p_lease_id uuid,p_proposal_id uuid,p_confirm boolean)
returns jsonb language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_job app_private.slack_delivery_jobs; v_proposal app_private.routine_reply_proposals;
 v_rule app_private.asset_adherence_rules; v_assignment public.action_point_assignments; v_kind text; v_latest uuid;
 v_payload jsonb; v_fact uuid; v_event uuid; v_body text; v_diagnostic uuid;
begin
 if p_confirm is null then raise exception using errcode='PT400',message='Decisão inválida'; end if;
 select * into v_job from app_private.slack_delivery_jobs where id=p_job_id for update;
 if not found or v_job.status<>'processando' or v_job.lease_id is distinct from p_lease_id or v_job.lease_until<clock_timestamp() then
   raise exception using errcode='PT409',message='Reserva desatualizada'; end if;
 if lower(trim(v_job.question->>'text')) is distinct from (case when p_confirm then 'confirmar ' else 'cancelar ' end)||p_proposal_id::text then
   return jsonb_build_object('status','indisponivel'); end if;
 select * into v_proposal from app_private.routine_reply_proposals where id=p_proposal_id for update;
 if not found or v_job.question->>'kind'<>'direct' or v_proposal.organization_id<>v_job.organization_id or v_proposal.team_id<>v_job.team_id or
   v_proposal.user_id is distinct from v_job.question->>'userId' or v_proposal.channel_id is distinct from v_job.question->>'channel' or
   not exists(select 1 from app_private.slack_installations where team_id=v_job.team_id and organization_id=v_job.organization_id and revoked_at is null) then
   return jsonb_build_object('status','indisponivel'); end if;
 if v_proposal.status<>'pendente' then return jsonb_build_object('status',v_proposal.status,'id',v_proposal.id); end if;
 if v_proposal.expires_at<clock_timestamp() then return jsonb_build_object('status','expirou'); end if;
 if not p_confirm then
   update app_private.routine_reply_proposals set status='cancelada',resolution_job_id=p_job_id,resolved_at=clock_timestamp() where id=v_proposal.id;
   return jsonb_build_object('status','cancelada','id',v_proposal.id);
 end if;
 select r.diagnostic_id into v_diagnostic from app_private.asset_adherence_cycles c join app_private.asset_adherence_rules r on r.id=c.rule_id where c.id=v_proposal.cycle_id;
 perform 1 from public.diagnostics where id=v_diagnostic for update;
 select r.* into v_rule from app_private.asset_adherence_cycles c join app_private.asset_adherence_rules r on r.id=c.rule_id where c.id=v_proposal.cycle_id and c.organization_id=v_job.organization_id;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_rule.routine_id::text,0));
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('adherence-cycle:'||v_proposal.cycle_id::text,0));
 if app_private.get_routine_reply_contexts(p_job_id,p_lease_id,v_proposal.cycle_id)->0 is null then return jsonb_build_object('status','indisponivel'); end if;
 select * into v_assignment from public.action_point_assignments where organization_id=v_job.organization_id and diagnostic_id=v_rule.diagnostic_id and action_point_id=v_rule.action_point_id for update;
 v_kind:=v_proposal.operation->>'kind';
 if v_kind='progresso' and v_assignment.updated_at is distinct from v_proposal.expected_assignment_updated_at then return jsonb_build_object('status','mudou'); end if;
 select id into v_latest from app_private.asset_adherence_facts where cycle_id=v_proposal.cycle_id and organization_id=v_job.organization_id and payload->>'kind'=
   case when v_kind in('execucao','bloqueio') then 'execucao_relatada' when v_kind='excecao' then 'excecao_solicitada' else '' end order by sequence desc limit 1;
 if v_kind in('execucao','bloqueio','excecao') and v_latest is distinct from v_proposal.expected_fact_id then return jsonb_build_object('status','mudou'); end if;
 v_payload:=case v_kind
   when 'execucao' then jsonb_build_object('kind','execucao_relatada','performed',v_proposal.operation->'performed','evidence',v_proposal.operation->'evidence')
   when 'bloqueio' then jsonb_build_object('kind','execucao_relatada','performed',false,'evidence','[]'::jsonb)
   when 'excecao' then jsonb_build_object('kind','excecao_solicitada','reason',v_proposal.operation->>'reason')
   when 'leitura' then jsonb_build_object('kind','leitura_confirmada') else null end;
 if v_payload is not null then
   v_fact:=gen_random_uuid();
   insert into app_private.asset_adherence_facts(id,organization_id,cycle_id,actor_user_id,payload,origin,slack_team_id,slack_user_id,slack_event_job_id)
   values(v_fact,v_job.organization_id,v_proposal.cycle_id,null,v_payload,'slack',v_job.team_id,v_job.question->>'userId',p_job_id);
 else
   update public.action_point_assignments set progress=(v_proposal.operation->>'value')::smallint,updated_at=clock_timestamp()
     where diagnostic_id=v_rule.diagnostic_id and action_point_id=v_rule.action_point_id and organization_id=v_job.organization_id;
 end if;
 v_body:=case v_kind when 'execucao' then case when (v_proposal.operation->>'performed')::boolean then 'Relatou a execução da rotina' else 'Relatou a não execução da rotina' end
   when 'bloqueio' then 'Relatou um bloqueio na rotina' when 'excecao' then 'Solicitou revisão de exceção da rotina'
   when 'leitura' then 'Confirmou a leitura do ativo' else 'Atualizou o progresso de implantação para '||(v_proposal.operation->>'value')||'%' end;
 insert into public.action_point_events(diagnostic_id,action_point_id,organization_id,kind,author_name,body,detail)
 values(v_rule.diagnostic_id,v_rule.action_point_id,v_job.organization_id,case when v_kind='progresso' then 'andamento' else 'resposta' end,v_proposal.actor_name,v_body,
   'Rotina: '||v_proposal.cycle_id::text||'. Registro: '||v_proposal.id::text||'. Relato completo disponível no acompanhamento da rotina.') returning id into v_event;
 update app_private.routine_reply_proposals set status='confirmada',resolution_job_id=p_job_id,resolved_at=clock_timestamp(),fact_id=v_fact,event_id=v_event where id=v_proposal.id;
 return jsonb_build_object('status','confirmada','id',v_proposal.id,'factId',v_fact,'eventId',v_event);
end $$;

revoke all on function app_private.get_routine_reply_contexts(uuid,uuid,uuid),app_private.propose_routine_reply(uuid,uuid,uuid,text,jsonb),app_private.resolve_routine_reply(uuid,uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function app_private.get_routine_reply_contexts(uuid,uuid,uuid),app_private.propose_routine_reply(uuid,uuid,uuid,text,jsonb),app_private.resolve_routine_reply(uuid,uuid,uuid,boolean) to service_role;
notify pgrst,'reload schema';
