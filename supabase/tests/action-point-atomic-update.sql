begin;
do $$
declare
  v_owner uuid := gen_random_uuid(); v_admin uuid := gen_random_uuid();
  v_org uuid := gen_random_uuid(); v_other uuid := gen_random_uuid();
  v_diagnostic uuid := gen_random_uuid(); v_template uuid; v_version timestamptz;
  v_plan jsonb; v_count integer;
begin
  insert into next_auth.users(id,email,name) values
    (v_owner,v_owner::text||'@fixture.invalid','Fixture dono'),
    (v_admin,v_admin::text||'@fixture.invalid','Fixture admin');
  insert into public.organizations(id,name) values(v_org,'Fixture execução'),(v_other,'Fixture outra empresa');
  insert into public.organization_members(organization_id,user_id,role) values(v_org,v_owner,'cliente'),(v_org,v_admin,'admin');
  select id into v_template from public.diagnostic_templates limit 1;
  insert into public.diagnostics(id,organization_id,template_id,name,created_by_user_id,status)
    values(v_diagnostic,v_org,v_template,'Fixture ação',v_owner,'encerrado');
  insert into public.admin_deliveries(diagnostic_id,organization_id,status,published_at,selected_action_point_ids)
    values(v_diagnostic,v_org,'publicada',now(),array['action_processos_ritual']);
  v_plan := '{"ok":true,"remove":false,"values":{"assignee":{"teamId":"TFIXTURE","userId":"UFIXTURE","name":"Pessoa de teste","avatarUrl":null},"stage":"atribuido","startsOn":"2026-10-19","dueOn":"2026-11-19","cadence":"semanal","progress":0},"events":[{"kind":"atribuicao","body":"atribuiu pessoa de teste"}]}'::jsonb;
  -- Evento inválido deve reverter também o estado.
  begin
    perform app_private.save_action_point_update(v_diagnostic,v_org,'action_processos_ritual',v_owner,'Fixture',null,
      jsonb_set(v_plan,'{events,0,kind}','"invalido"'));
    raise exception 'Evento inválido aceito';
  exception when check_violation then null; end;
  if exists(select 1 from public.action_point_assignments where diagnostic_id=v_diagnostic) then
    raise exception 'Estado gravado sem histórico'; end if;
  perform app_private.save_action_point_update(v_diagnostic,v_org,'action_processos_ritual',v_owner,'Fixture',null,v_plan);
  select updated_at into v_version from public.action_point_assignments where diagnostic_id=v_diagnostic;
  begin
    perform app_private.save_action_point_update(v_diagnostic,v_org,'action_processos_ritual',v_owner,'Fixture',null,v_plan);
    raise exception 'Sessão antiga sobrescreveu ação';
  exception when sqlstate 'PT409' then null; end;
  begin
    perform app_private.save_action_point_update(v_diagnostic,v_other,'action_processos_ritual',v_owner,'Fixture',v_version,v_plan);
    raise exception 'Outra empresa alterou ação';
  exception when insufficient_privilege then null; end;
  begin
    perform app_private.save_action_point_update(v_diagnostic,v_org,'action_processos_ritual',v_admin,'Fixture',v_version,v_plan);
    raise exception 'Admin alterou ação';
  exception when insufficient_privilege then null; end;
  begin
    perform app_private.save_action_point_update(v_diagnostic,v_org,'nao_publicada',v_owner,'Fixture',null,v_plan);
    raise exception 'Ação não publicada foi aceita';
  exception when insufficient_privilege then null; end;
  v_plan := jsonb_set(jsonb_set(v_plan,'{values,stage}','"em_implementacao"'),'{events}','[{"kind":"etapa","body":"iniciou implementação"}]');
  perform app_private.save_action_point_update(v_diagnostic,v_org,'action_processos_ritual',v_owner,'Fixture',v_version,v_plan);
  if (select stage from public.action_point_assignments where diagnostic_id=v_diagnostic) <> 'em_implementacao' then
    raise exception 'Etapa não persistiu'; end if;
  select count(*) into v_count from public.action_point_events where diagnostic_id=v_diagnostic;
  if v_count <> 2 then raise exception 'Eventos duplicados ou perdidos'; end if;
  if has_table_privilege('authenticated','public.action_point_assignments','SELECT') or
    has_function_privilege('anon','app_private.save_action_point_update(uuid,uuid,text,uuid,text,timestamptz,jsonb)','EXECUTE') then
    raise exception 'Execução exposta'; end if;
end;
$$;
select 'action point atomic update: ok' as result;
rollback;
