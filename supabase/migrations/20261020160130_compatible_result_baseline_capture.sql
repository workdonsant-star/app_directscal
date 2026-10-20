-- Preserva o contrato privado dos acordos legados; endpoints permanecem globais.
create or replace function app_private.capture_routine_result_baseline(p_organization_id uuid,p_actor_user_id uuid,p_rule_id uuid)
returns uuid language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_rule app_private.asset_adherence_rules;v_closed timestamptz;v_question text;v_layers jsonb;
begin
 if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and (role='superadmin' or (role='cliente' and organization_id=p_organization_id))) then raise exception using errcode='42501',message='Operação restrita';end if;
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

create or replace function app_private.capture_new_routine_result_baseline() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from public.diagnostics where id=new.diagnostic_id and organization_id=new.organization_id and status='encerrado') then
  perform app_private.capture_routine_result_baseline(new.organization_id,new.created_by,new.id);
 end if;
 return new;
end $$;
