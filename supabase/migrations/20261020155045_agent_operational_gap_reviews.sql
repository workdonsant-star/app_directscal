create table app_private.agent_gap_reviews (
 id uuid primary key,
 sequence bigint generated always as identity unique,
 organization_id uuid not null references public.organizations(id),
 audit_id uuid not null references public.asset_question_audits(id),
 actor_user_id uuid not null references next_auth.users(id),
 assignee_user_id uuid references next_auth.users(id),
 status text not null check(status in('aberta','em_andamento','resolvida')),
 reason text not null check(char_length(trim(reason)) between 1 and 2000),
 evidence_url text check(evidence_url is null or (char_length(evidence_url)<=2000 and evidence_url ~ '^https://[^[:space:]]+$')),
 due_at timestamptz,
 request_payload jsonb not null,
 recorded_at timestamptz not null default clock_timestamp(),
 check(status<>'resolvida' or (assignee_user_id is not null and evidence_url is not null)),
 check(status<>'em_andamento' or assignee_user_id is not null)
);
create index agent_gap_audit_idx on app_private.agent_gap_reviews(audit_id,sequence desc);
create index agent_gap_org_idx on app_private.agent_gap_reviews(organization_id,sequence desc);
create index agent_gap_actor_idx on app_private.agent_gap_reviews(actor_user_id);
create index agent_gap_assignee_idx on app_private.agent_gap_reviews(assignee_user_id);
alter table app_private.agent_gap_reviews enable row level security;
revoke all on app_private.agent_gap_reviews from public,anon,authenticated,service_role;
grant select,insert on app_private.agent_gap_reviews to service_role;
revoke all on sequence app_private.agent_gap_reviews_sequence_seq from public,anon,authenticated;
grant usage,select on sequence app_private.agent_gap_reviews_sequence_seq to service_role;

create function app_private.save_agent_gap_review(p_organization_id uuid,p_actor_user_id uuid,p_input jsonb)
returns uuid language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_id uuid:=(p_input->>'id')::uuid;v_audit uuid:=(p_input->>'auditId')::uuid;v_assignee uuid:=(p_input->>'assigneeUserId')::uuid;
 v_status text:=p_input->>'status';v_existing app_private.agent_gap_reviews;v_latest uuid;v_due timestamptz:=(p_input->>'dueAt')::timestamptz;
begin
 if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then raise exception using errcode='42501',message='Operação restrita';end if;
 if jsonb_typeof(p_input) is distinct from 'object' or v_id is null or v_audit is null or coalesce(v_status,'') not in('aberta','em_andamento','resolvida') or
   coalesce(char_length(trim(p_input->>'reason')),0) not between 1 and 2000 or
   p_input-array['id','auditId','expectedEventId','status','reason','assigneeUserId','evidenceUrl','dueAt']<>'{}'::jsonb then raise exception using errcode='PT400',message='Revisão inválida';end if;
 perform 1 from public.asset_question_audits where id=v_audit and organization_id=p_organization_id for update;
 if not found then raise exception using errcode='PT404',message='Pergunta indisponível';end if;
 select * into v_existing from app_private.agent_gap_reviews where id=v_id;
 if found then
  if v_existing.organization_id=p_organization_id and v_existing.actor_user_id=p_actor_user_id and v_existing.request_payload=p_input then return v_id;end if;
  raise exception using errcode='PT409',message='Tentativa divergente';end if;
 if not exists(select 1 from public.asset_question_audits a where a.id=v_audit and
  (a.answer_status<>'respondida' or (select f.value from public.asset_answer_feedback f where f.question_audit_id=a.id order by f.created_at desc,f.id desc limit 1)='nao_util')) then raise exception using errcode='PT409',message='A pergunta não tem lacuna vigente';end if;
 select id into v_latest from app_private.agent_gap_reviews where audit_id=v_audit order by sequence desc limit 1;
 if v_latest is distinct from (p_input->>'expectedEventId')::uuid then raise exception using errcode='PT409',message='A revisão mudou';end if;
 if v_assignee is not null and not exists(select 1 from public.organization_members where user_id=v_assignee and role='superadmin') then raise exception using errcode='PT400',message='Responsável indisponível';end if;
 if v_status in('em_andamento','resolvida') and v_assignee is null then raise exception using errcode='PT400',message='Defina responsável';end if;
 if v_status='resolvida' and nullif(trim(p_input->>'evidenceUrl'),'') is null then raise exception using errcode='PT400',message='Informe evidência verificável';end if;
 if v_due is not null and (v_due<=clock_timestamp() or v_due>clock_timestamp()+interval '365 days') then raise exception using errcode='PT400',message='Prazo inválido';end if;
 insert into app_private.agent_gap_reviews(id,organization_id,audit_id,actor_user_id,assignee_user_id,status,reason,evidence_url,due_at,request_payload)
 values(v_id,p_organization_id,v_audit,p_actor_user_id,v_assignee,v_status,trim(p_input->>'reason'),nullif(trim(p_input->>'evidenceUrl'),''),v_due,p_input);
 return v_id;
end $$;

create function app_private.get_agent_operations(p_organization_id uuid,p_actor_user_id uuid,p_audit_ids uuid[] default '{}')
returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then raise exception using errcode='42501',message='Operação restrita';end if;
 if not exists(select 1 from public.organizations where id=p_organization_id) then raise exception using errcode='PT404',message='Empresa indisponível';end if;
 if cardinality(p_audit_ids)>200 then raise exception using errcode='PT400',message='Lote inválido';end if;
 return jsonb_build_object(
 'operators',coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'name',coalesce(nullif(trim(u.name),''),'Operação DirectScal')) order by u.id) from next_auth.users u where exists(select 1 from public.organization_members m where m.user_id=u.id and m.role='superadmin')),'[]'),
 'reviews',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'auditId',r.audit_id,'sequence',r.sequence,'status',r.status,'reason',r.reason,'assigneeUserId',r.assignee_user_id,'actorName',coalesce(nullif(trim(u.name),''),'Operação DirectScal'),'evidenceUrl',r.evidence_url,'dueAt',r.due_at,'recordedAt',r.recorded_at) order by r.sequence) from app_private.agent_gap_reviews r join next_auth.users u on u.id=r.actor_user_id where r.organization_id=p_organization_id and r.audit_id=any(p_audit_ids)),'[]'),
 'health',jsonb_build_object(
 'capturedAt',statement_timestamp(),
 'slackFailures',(select count(*) from app_private.slack_delivery_jobs where organization_id=p_organization_id and status='falhou'),
 'slackUncertain',(select count(*) from app_private.slack_delivery_jobs where organization_id=p_organization_id and status='incerto'),
 'slackOverdue',(select count(*) from app_private.slack_delivery_jobs where organization_id=p_organization_id and ((status='recebido' and available_at<statement_timestamp()-interval '15 minutes') or (status='processando' and lease_until<statement_timestamp()))),
 'queries30Days',(select count(*) from public.asset_question_audits where organization_id=p_organization_id and created_at>=statement_timestamp()-interval '30 days'),
 'queryErrors30Days',(select count(*) from public.asset_question_audits where organization_id=p_organization_id and answer_status='erro' and created_at>=statement_timestamp()-interval '30 days')
 ));
end $$;
revoke all on function app_private.save_agent_gap_review(uuid,uuid,jsonb),app_private.get_agent_operations(uuid,uuid,uuid[]) from public,anon,authenticated;
grant execute on function app_private.save_agent_gap_review(uuid,uuid,jsonb),app_private.get_agent_operations(uuid,uuid,uuid[]) to service_role;
