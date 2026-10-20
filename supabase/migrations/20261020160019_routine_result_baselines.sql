create table app_private.routine_result_baselines (
 rule_id uuid primary key references app_private.asset_adherence_rules(id),
 organization_id uuid not null references public.organizations(id),
 captured_by uuid not null references next_auth.users(id),
 captured_at timestamptz not null default clock_timestamp(),
 diagnostic_closed_at timestamptz,
 question_text text not null,
 layers jsonb not null check(jsonb_typeof(layers)='array' and jsonb_array_length(layers)=3)
);
create index routine_result_baseline_org_idx on app_private.routine_result_baselines(organization_id);
create index routine_result_baseline_actor_idx on app_private.routine_result_baselines(captured_by);
alter table app_private.routine_result_baselines enable row level security;
revoke all on app_private.routine_result_baselines from public,anon,authenticated,service_role;
grant select,insert on app_private.routine_result_baselines to service_role;

create function app_private.capture_routine_result_baseline(p_organization_id uuid,p_actor_user_id uuid,p_rule_id uuid)
returns uuid language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_rule app_private.asset_adherence_rules;v_closed timestamptz;v_question text;v_layers jsonb;
begin
 if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then raise exception using errcode='42501',message='Operação restrita';end if;
 select * into v_rule from app_private.asset_adherence_rules where id=p_rule_id and organization_id=p_organization_id;
 if not found then raise exception using errcode='PT404',message='Acordo indisponível';end if;
 perform 1 from public.diagnostics where id=v_rule.diagnostic_id and organization_id=p_organization_id and status='encerrado' for update;
 if not found then raise exception using errcode='PT409',message='Coleta ainda não encerrada';end if;
 if exists(select 1 from app_private.routine_result_baselines where rule_id=p_rule_id and organization_id=p_organization_id) then return p_rule_id;end if;
 select d.closed_at,q.text into v_closed,v_question from public.diagnostics d join public.questions q on q.template_id=d.template_id and q.id=v_rule.question_id where d.id=v_rule.diagnostic_id;
 if v_question is null then raise exception using errcode='PT409',message='Pergunta fora da coleta';end if;
 select jsonb_agg(jsonb_build_object('group',g.group_id,'responses',coalesce(a.responses,0),'score',a.score) order by g.ordinal)
 into v_layers from (values('fundador',1),('lideranca',2),('operacao',3)) g(group_id,ordinal)
 left join lateral (select count(*) as responses,avg(l.value)::numeric as score from public.likert_answers l join public.response_sessions s on s.id=l.response_session_id
  where s.diagnostic_id=v_rule.diagnostic_id and s.group_id::text=g.group_id and s.status='concluido' and l.question_id=v_rule.question_id) a on true;
 insert into app_private.routine_result_baselines(rule_id,organization_id,captured_by,diagnostic_closed_at,question_text,layers)
 values(p_rule_id,p_organization_id,p_actor_user_id,v_closed,v_question,v_layers);
 return p_rule_id;
end $$;

create function app_private.capture_new_routine_result_baseline() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 perform app_private.capture_routine_result_baseline(new.organization_id,new.created_by,new.id);
 return new;
end $$;
create trigger capture_routine_result_baseline after insert on app_private.asset_adherence_rules for each row execute function app_private.capture_new_routine_result_baseline();

create function app_private.get_routine_result_baselines(p_organization_id uuid,p_actor_user_id uuid)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then raise exception using errcode='42501',message='Operação restrita';end if;
 if not exists(select 1 from public.organizations where id=p_organization_id) then raise exception using errcode='PT404',message='Empresa indisponível';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('ruleId',b.rule_id,'routineId',r.routine_id,'diagnosticId',r.diagnostic_id,'questionId',r.question_id,'actionPointId',r.action_point_id,'assetId',r.asset_id,'assetVersionId',r.asset_version_id,
 'capturedAt',b.captured_at,'diagnosticClosedAt',b.diagnostic_closed_at,'questionText',b.question_text,'layers',b.layers) order by b.captured_at,b.rule_id)
 from app_private.routine_result_baselines b join app_private.asset_adherence_rules r on r.id=b.rule_id and r.organization_id=b.organization_id where b.organization_id=p_organization_id),'[]');
end $$;
revoke all on function app_private.capture_routine_result_baseline(uuid,uuid,uuid),app_private.capture_new_routine_result_baseline(),app_private.get_routine_result_baselines(uuid,uuid) from public,anon,authenticated;
grant execute on function app_private.capture_routine_result_baseline(uuid,uuid,uuid),app_private.capture_new_routine_result_baseline(),app_private.get_routine_result_baselines(uuid,uuid) to service_role;
