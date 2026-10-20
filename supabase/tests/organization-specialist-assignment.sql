begin;
set local lock_timeout='2s';
set local statement_timeout='10s';
do $$
declare
  v_actor uuid:=gen_random_uuid(); v_owner uuid:=gen_random_uuid(); v_org uuid:=gen_random_uuid(); v_other uuid:=gen_random_uuid();
  v_specialist text:='fixture_'||gen_random_uuid()::text; v_second text:='fixture_'||gen_random_uuid()::text;
  v_diagnostic uuid:=gen_random_uuid(); v_template uuid; v_result jsonb; v_version timestamptz;
begin
  insert into next_auth.users(id,email,name) values(v_actor,v_actor::text||'@fixture.invalid','Fixture operação'),(v_owner,v_owner::text||'@fixture.invalid','Fixture cliente');
  insert into public.organizations(id,name) values(v_org,'Fixture atribuição principal'),(v_other,'Fixture empresa distinta');
  insert into public.organization_members(organization_id,user_id,role) values(v_org,v_actor,'superadmin'),(v_org,v_owner,'cliente');
  insert into public.specialists(id,name,email,title,location) values
    (v_specialist,'Fixture especialista','one@fixture.invalid','Especialista','São Paulo'),
    (v_second,'Fixture segundo especialista','two@fixture.invalid','Especialista','Curitiba');
  v_result:=app_private.assign_organization_specialist(v_org,v_actor,v_specialist,null);
  v_version:=(v_result->>'updatedAt')::timestamptz;
  if app_private.get_organization_operations(v_org,v_actor)->'assignment'->>'specialistId' <> v_specialist then raise exception 'Atribuição não persistiu'; end if;
  if app_private.get_organization_operations(v_other,v_actor)->'assignment'->>'specialistId' is not null then raise exception 'Vazou atribuição de outra empresa'; end if;
  begin
    perform app_private.assign_organization_specialist(v_org,v_owner,v_second,v_version);
    raise exception 'Cliente conseguiu atribuir';
  exception when insufficient_privilege then null; end;
  begin
    perform app_private.get_organization_operations(v_org,v_owner);
    raise exception 'Cliente leu operação privada';
  exception when insufficient_privilege then null; end;
  begin
    perform app_private.assign_organization_specialist(v_org,v_actor,v_second,null);
    raise exception 'Versão antiga alterou atribuição';
  exception when sqlstate 'PT409' then null; end;
  update public.specialists set archived=true where id=v_second;
  begin
    perform app_private.assign_organization_specialist(v_org,v_actor,v_second,v_version);
    raise exception 'Especialista arquivado foi atribuído';
  exception when sqlstate 'PT400' then null; end;
  update public.specialists set archived=false where id=v_second;
  select id into v_template from public.diagnostic_templates limit 1;
  insert into public.diagnostics(id,organization_id,template_id,name,status,created_by_user_id,closed_at)
    values(v_diagnostic,v_org,v_template,'Fixture entrega real','encerrado',v_owner,now());
  v_result:=app_private.get_organization_operations(v_org,v_actor);
  if jsonb_array_length(v_result->'deliveries')<>1 or v_result->'deliveries'->0->>'specialistId'<>v_specialist or
     v_result->'deliveries'->0->>'status'<>'aguardando_analise' or (v_result->'deliveries'->0->>'canAnalyze')::boolean then
    raise exception 'Histórico real ou sugestão principal incorretos'; end if;
  insert into app_private.admin_delivery_drafts(diagnostic_id,payload,updated_by)
    values(v_diagnostic,jsonb_build_object('status','sem_especialista','specialistId',null),v_actor);
  v_result:=app_private.get_organization_operations(v_org,v_actor);
  if v_result->'deliveries'->0->>'specialistId' is not null then raise exception 'Principal sobrescreveu rascunho explicitamente sem atribuição'; end if;
  v_result:=app_private.assign_organization_specialist(v_org,v_actor,v_second,v_version);
  v_version:=(v_result->>'updatedAt')::timestamptz;
  if (select payload->>'specialistId' from app_private.admin_delivery_drafts where diagnostic_id=v_diagnostic) is not null then raise exception 'Troca alterou rascunho'; end if;
  v_result:=app_private.assign_organization_specialist(v_org,v_actor,null,v_version);
  if v_result->>'specialistId' is not null or v_result->>'updatedAt' is null then raise exception 'Remoção não preservou versão'; end if;
  if has_table_privilege('authenticated','app_private.organization_specialist_assignments','SELECT') or
     has_function_privilege('anon','app_private.assign_organization_specialist(uuid,uuid,text,timestamptz)','EXECUTE') then raise exception 'Atribuição privada exposta'; end if;
end;
$$;
select 'organization specialist assignment: ok' as result;
rollback;
