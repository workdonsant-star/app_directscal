create table app_private.routine_supervision_events (
 id uuid primary key,
 sequence bigint generated always as identity unique,
 organization_id uuid not null references public.organizations(id),
 cycle_id uuid not null,
 actor_user_id uuid not null references next_auth.users(id),
 operation text not null check(operation in('evidencia','excecao','orientar','prazo')),
 reason text not null check(char_length(trim(reason)) between 1 and 2000),
 source_fact_id uuid references app_private.asset_adherence_facts(id),
 source_proposal_id uuid references app_private.routine_reply_proposals(id),
 result_fact_id uuid references app_private.asset_adherence_facts(id),
 response_due_at timestamptz,
 accepted boolean,
 request_payload jsonb not null,
 recorded_at timestamptz not null default clock_timestamp(),
 foreign key(cycle_id,organization_id) references app_private.asset_adherence_cycles(id,organization_id),
 check((operation='prazo')=(response_due_at is not null)),
 check((operation in('evidencia','excecao'))=(accepted is not null)),
 check((operation in('evidencia','excecao'))=(source_fact_id is not null)),
 check((operation in('evidencia','excecao'))=(result_fact_id is not null))
);
create index routine_supervision_cycle_idx on app_private.routine_supervision_events(cycle_id,organization_id,sequence);
create index routine_supervision_org_idx on app_private.routine_supervision_events(organization_id,sequence);
create index routine_supervision_actor_idx on app_private.routine_supervision_events(actor_user_id);
create index routine_supervision_source_fact_idx on app_private.routine_supervision_events(source_fact_id);
create index routine_supervision_result_fact_idx on app_private.routine_supervision_events(result_fact_id);
create index routine_supervision_proposal_idx on app_private.routine_supervision_events(source_proposal_id);
alter table app_private.routine_supervision_events enable row level security;
revoke all on app_private.routine_supervision_events from public,anon,authenticated,service_role;
grant select,insert on app_private.routine_supervision_events to service_role;
revoke all on sequence app_private.routine_supervision_events_sequence_seq from public,anon,authenticated;
grant usage,select on sequence app_private.routine_supervision_events_sequence_seq to service_role;

create function app_private.save_routine_supervision(p_organization_id uuid,p_actor_user_id uuid,p_input jsonb)
returns uuid language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_id uuid:=(p_input->>'id')::uuid;v_cycle_id uuid:=(p_input->>'cycleId')::uuid;
 v_operation text:=p_input->>'operation';v_existing app_private.routine_supervision_events;v_rule app_private.asset_adherence_rules;
 v_latest uuid;v_fact uuid;v_due timestamptz;v_name text;v_payload jsonb;v_source uuid:=(p_input->>'factId')::uuid;v_proposal uuid:=(p_input->>'proposalId')::uuid;
begin
 if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then raise exception using errcode='42501',message='Acesso restrito à operação';end if;
 if jsonb_typeof(p_input) is distinct from 'object' or v_id is null or v_cycle_id is null or
   coalesce(v_operation,'') not in('evidencia','excecao','orientar','prazo') or coalesce(char_length(trim(p_input->>'reason')),0) not between 1 and 2000 or
   p_input-array['id','cycleId','operation','reason','expectedEventId','factId','accepted','proposalId','responseDueAt']<>'{}'::jsonb then raise exception using errcode='PT400',message='Decisão inválida';end if;
 select * into v_existing from app_private.routine_supervision_events where id=v_id;
 if found then
   if v_existing.organization_id=p_organization_id and v_existing.actor_user_id=p_actor_user_id and v_existing.request_payload=p_input then return v_id;end if;
   raise exception using errcode='PT409',message='Tentativa divergente';end if;
 select r.* into v_rule from app_private.asset_adherence_cycles c join app_private.asset_adherence_rules r on r.id=c.rule_id and r.organization_id=c.organization_id where c.id=v_cycle_id and c.organization_id=p_organization_id;
 if not found then raise exception using errcode='PT404',message='Ciclo indisponível';end if;
 perform 1 from public.diagnostics where id=v_rule.diagnostic_id and organization_id=p_organization_id for update;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_rule.routine_id::text,0));
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('adherence-cycle:'||v_cycle_id::text,0));
 -- Segunda leitura sob lock torna a reentrada concorrente idempotente.
 select * into v_existing from app_private.routine_supervision_events where id=v_id;
 if found then
   if v_existing.organization_id=p_organization_id and v_existing.actor_user_id=p_actor_user_id and v_existing.request_payload=p_input then return v_id;end if;
   raise exception using errcode='PT409',message='Tentativa divergente';end if;
 if not exists(select 1 from public.admin_deliveries where diagnostic_id=v_rule.diagnostic_id and organization_id=p_organization_id and status='publicada' and v_rule.action_point_id=any(selected_action_point_ids)) then raise exception using errcode='PT409',message='Origem retirada';end if;
 select id into v_latest from app_private.routine_supervision_events where cycle_id=v_cycle_id and organization_id=p_organization_id order by sequence desc limit 1;
 if v_latest is distinct from (p_input->>'expectedEventId')::uuid then raise exception using errcode='PT409',message='A revisão mudou';end if;
 if v_operation in('evidencia','excecao') then
   if v_source is null or jsonb_typeof(p_input->'accepted') is distinct from 'boolean' or v_proposal is not null or p_input ? 'responseDueAt' then raise exception using errcode='PT400',message='Revisão inválida';end if;
   v_payload:=case when v_operation='evidencia' then jsonb_build_object('kind','evidencia_revisada','executionId',v_source,'accepted',p_input->'accepted','reason',trim(p_input->>'reason'))
     else jsonb_build_object('kind','excecao_revisada','requestId',v_source,'accepted',p_input->'accepted','reason',trim(p_input->>'reason')) end;
   perform app_private.record_asset_adherence_fact(p_organization_id,v_cycle_id,p_actor_user_id,v_id,v_payload);v_fact:=v_id;
 else
   if v_source is not null or p_input ? 'accepted' then raise exception using errcode='PT400',message='Campos incompatíveis';end if;
   if v_proposal is not null and not exists(select 1 from app_private.routine_reply_proposals where id=v_proposal and cycle_id=v_cycle_id and organization_id=p_organization_id and status='confirmada' and operation->>'kind'='bloqueio') then raise exception using errcode='PT409',message='Bloqueio indisponível';end if;
   if v_operation='prazo' then
     v_due:=(p_input->>'responseDueAt')::timestamptz;
     if v_due is null or v_due<=clock_timestamp() or v_due>clock_timestamp()+interval '90 days' then raise exception using errcode='PT400',message='Prazo de retorno inválido';end if;
   elsif p_input ? 'responseDueAt' then raise exception using errcode='PT400',message='Campos incompatíveis';end if;
 end if;
 insert into app_private.routine_supervision_events(id,organization_id,cycle_id,actor_user_id,operation,reason,source_fact_id,source_proposal_id,result_fact_id,response_due_at,accepted,request_payload)
 values(v_id,p_organization_id,v_cycle_id,p_actor_user_id,v_operation,trim(p_input->>'reason'),v_source,v_proposal,v_fact,v_due,case when v_operation in('evidencia','excecao') then (p_input->>'accepted')::boolean else null end,p_input);
 select coalesce(nullif(trim(name),''),'Operação DirectScal') into v_name from next_auth.users where id=p_actor_user_id;
 insert into public.action_point_events(diagnostic_id,action_point_id,organization_id,kind,author_name,body,detail)
 values(v_rule.diagnostic_id,v_rule.action_point_id,p_organization_id,'nota',v_name,
   case v_operation when 'evidencia' then case when (p_input->>'accepted')::boolean then 'Validou a evidência da rotina' else 'Devolveu a evidência da rotina para revisão' end
   when 'excecao' then case when (p_input->>'accepted')::boolean then 'Aprovou a exceção da oportunidade' else 'Recusou a exceção da oportunidade' end
   when 'prazo' then 'Definiu novo prazo de retorno, preservando o prazo da oportunidade' else 'Registrou orientação sobre a rotina' end,
   'Ciclo: '||v_cycle_id::text||'. Decisão: '||v_id::text||'. Justificativa completa no acompanhamento da rotina.');
 return v_id;
end $$;

create function app_private.get_admin_routine_cycles(p_organization_id uuid,p_actor_user_id uuid,p_before_at timestamptz default null,p_before_id uuid default null)
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
      from app_private.routine_contact_jobs c join app_private.slack_delivery_jobs j on j.id=c.job_id where c.organization_id=p_organization_id and c.cycle_id in(select id from page)),'[]'::jsonb)
 ));
end $$;

-- Mantém a autorização e o cursor da leitura do cliente; acrescenta apenas decisões dos ciclos que ela já autorizou.
alter function app_private.get_customer_routine_records(uuid,uuid,uuid,timestamptz,uuid) rename to get_customer_routine_records_base;
create function app_private.get_customer_routine_records(p_organization_id uuid,p_actor_user_id uuid,p_diagnostic_id uuid,p_before_at timestamptz default null,p_before_id uuid default null)
returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(record||jsonb_build_object('supervision',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'operation',e.operation,'reason',e.reason,'responseDueAt',e.response_due_at,'accepted',e.accepted,'recordedAt',e.recorded_at,'actorName',coalesce(u.name,'Operação DirectScal')) order by e.sequence)
   from app_private.routine_supervision_events e join next_auth.users u on u.id=e.actor_user_id where e.organization_id=p_organization_id and e.cycle_id=(record->'cycle'->>'id')::uuid),'[]'::jsonb)) order by ordinal),'[]'::jsonb)
 from jsonb_array_elements(app_private.get_customer_routine_records_base(p_organization_id,p_actor_user_id,p_diagnostic_id,p_before_at,p_before_id)) with ordinality as entries(record,ordinal);
$$;
revoke all on function app_private.save_routine_supervision(uuid,uuid,jsonb),app_private.get_admin_routine_cycles(uuid,uuid,timestamptz,uuid),app_private.get_customer_routine_records(uuid,uuid,uuid,timestamptz,uuid) from public,anon,authenticated;
grant execute on function app_private.save_routine_supervision(uuid,uuid,jsonb),app_private.get_admin_routine_cycles(uuid,uuid,timestamptz,uuid),app_private.get_customer_routine_records(uuid,uuid,uuid,timestamptz,uuid) to service_role;
notify pgrst,'reload schema';
