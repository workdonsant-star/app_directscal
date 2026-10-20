begin;
set local statement_timeout='15s';
do $$
declare
  v_operator uuid:=gen_random_uuid(); v_pause uuid:=gen_random_uuid(); v_current_rule uuid; v_owner uuid:=gen_random_uuid(); v_other_owner uuid:=gen_random_uuid(); v_org uuid:=gen_random_uuid(); v_other uuid:=gen_random_uuid();
  v_diag uuid:=gen_random_uuid(); v_template uuid; v_question uuid; v_sector uuid:=gen_random_uuid();
  v_asset uuid:=gen_random_uuid(); v_version uuid:=gen_random_uuid(); v_rule uuid:=gen_random_uuid(); v_routine uuid:=gen_random_uuid();
  v_cycle uuid:=gen_random_uuid(); v_other_cycle uuid:=gen_random_uuid(); v_event uuid:=gen_random_uuid(); v_event2 uuid:=gen_random_uuid(); v_request uuid:=gen_random_uuid();
  v_link uuid:=gen_random_uuid();v_session uuid:=gen_random_uuid();v_other_session uuid:=gen_random_uuid();v_base jsonb;
  v_payload jsonb; v_first jsonb; v_retry jsonb;
begin
  insert into next_auth.users(id,email,name) values(v_owner,v_owner::text||'@fixture.invalid','Fixture dono'),(v_other_owner,v_other_owner::text||'@fixture.invalid','Fixture outra empresa');
  insert into public.organizations(id,name) values(v_org,'Fixture aderência'),(v_other,'Fixture isolada');
  insert into public.organization_members(organization_id,user_id,role) values(v_org,v_owner,'cliente'),(v_other,v_other_owner,'cliente');
  select template_id,id into v_template,v_question from public.questions limit 1;
  insert into public.diagnostics(id,organization_id,template_id,name,status) values(v_diag,v_org,v_template,'Fixture rotina','encerrado');
  insert into public.admin_deliveries(diagnostic_id,organization_id,status,published_at,selected_action_point_ids)
    values(v_diag,v_org,'publicada',now(),array['action_processos_ritual']);
  insert into public.organization_sectors(id,organization_id,name) values(v_sector,v_org,'Setor fixture');
  insert into public.action_point_assignments(diagnostic_id,action_point_id,organization_id,assignee_team_id,assignee_slack_user_id,assignee_name)
    values(v_diag,'action_processos_ritual',v_org,'TFIXTURE','UFIXTURE','Pessoa fictícia');
  insert into public.management_assets(id,organization_id,type,title,status) values(v_asset,v_org,'sop','Fixture rotina','rascunho');
  insert into public.management_asset_versions(id,asset_id,organization_id,version_number,content_format,content,review_status,published_at,index_status)
    values(v_version,v_asset,v_org,'1','json','{}','publicado',now(),'pronto');
  update public.management_assets set status='publicado',current_published_version_id=v_version where id=v_asset;

  insert into next_auth.users(id,email,name) values(v_operator,v_operator::text||'@fixture.invalid','Operação fixture');
  insert into public.organization_members(organization_id,user_id,role) values(v_org,v_operator,'superadmin');
  insert into public.diagnostic_share_links(id,diagnostic_id,group_id,token) values(v_link,v_diag,'lideranca',gen_random_uuid()::text);
  insert into public.response_sessions(id,diagnostic_id,share_link_id,group_id,status,submitted_at) values(v_session,v_diag,v_link,'lideranca','concluido',now()),(v_other_session,v_diag,v_link,'lideranca','concluido',now());
  insert into public.likert_answers(response_session_id,question_id,value) values(v_session,v_question,2),(v_other_session,v_question,4);
  insert into app_private.asset_adherence_rules(id,routine_id,revision,organization_id,diagnostic_id,action_point_id,asset_id,asset_version_id,question_id,sector_id,assignee_team_id,assignee_user_id,schedule,expectation,created_by)
    values(v_rule,v_routine,1,v_org,v_diag,'action_processos_ritual',v_asset,v_version,v_question,v_sector,'TFIXTURE','UFIXTURE','{"kind":"periodica","cadence":"semanal","timeZone":"America/Sao_Paulo"}','Conferir rotina',v_owner);
  begin delete from public.management_assets where id=v_asset;raise exception 'Apagou ativo vinculado à rotina';exception when foreign_key_violation then null;end;
  if not exists(select 1 from public.management_assets where id=v_asset) or not exists(select 1 from app_private.routine_result_baselines where rule_id=v_rule) then raise exception 'Perdeu histórico ao excluir';end if;
  v_base:=app_private.get_routine_result_baselines(v_org,v_operator)->0;
  if v_base->'layers'->1->>'score'<>'3.0000000000000000' and (v_base->'layers'->1->>'score')::numeric<>3 then raise exception 'Média incorreta';end if;
  if (v_base->'layers'->1->>'responses')::integer<>2 or v_base->'layers'->0->>'score' is not null or (v_base->'layers'->0->>'responses')::integer<>0 then raise exception 'Inventou base ausente';end if;
  if v_base->>'questionId'<>v_question::text or v_base->>'assetVersionId'<>v_version::text or v_base::text like '%'||v_session::text||'%' then raise exception 'Vínculo inválido ou copiou sessão individual';end if;
  update public.likert_answers set value=5 where response_session_id=v_session;
  perform app_private.capture_routine_result_baseline(v_org,v_operator,v_rule);
  if app_private.get_routine_result_baselines(v_org,v_operator)->0<>v_base then raise exception 'Reentrada reescreveu base';end if;
  begin perform app_private.capture_routine_result_baseline(v_other,v_operator,v_rule);raise exception 'Cruzou empresa';exception when sqlstate 'PT404' then null;end;
  begin perform app_private.get_routine_result_baselines(v_org,v_owner);raise exception 'Cliente leu privado';exception when insufficient_privilege then null;end;
  begin perform app_private.capture_routine_result_baseline(v_org,v_other_owner,v_rule);raise exception 'Ator de outro tenant';exception when insufficient_privilege then null;end;
  if jsonb_array_length(app_private.get_routine_result_baselines(v_other,v_operator))<>0 then raise exception 'Vazou base';end if;
  if has_table_privilege('authenticated','app_private.routine_result_baselines','select') or has_table_privilege('service_role','app_private.routine_result_baselines','update') or has_function_privilege('authenticated','app_private.get_routine_result_baselines(uuid,uuid)','execute') then raise exception 'Grants excessivos';end if;
end $$;
select 'routine_result_baselines_ok' as result;
rollback;
