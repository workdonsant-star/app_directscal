begin;
set local lock_timeout='2s';
set local statement_timeout='10s';
create function pg_temp.fail_admin_fixture_version() returns trigger language plpgsql as $$
begin raise exception 'Falha controlada' using errcode='P0999'; end;
$$;
do $$
declare
  v_actor uuid:=gen_random_uuid(); v_owner uuid:=gen_random_uuid(); v_org uuid:=gen_random_uuid(); v_asset uuid:=gen_random_uuid(); v_draft uuid:=gen_random_uuid();
  v_time timestamptz:=clock_timestamp(); v_input jsonb; v_original text; v_trigger text:='qa_asset_'||replace(gen_random_uuid()::text,'-','');
begin
  insert into next_auth.users(id,email,name) values(v_actor,v_actor::text||'@fixture.invalid','Fixture operação'),(v_owner,v_owner::text||'@fixture.invalid','Fixture dono');
  insert into public.organizations(id,name) values(v_org,'Fixture edição atômica');
  insert into public.organization_members(organization_id,user_id,role) values(v_org,v_actor,'superadmin'),(v_org,v_owner,'cliente');
  insert into public.management_assets(id,organization_id,type,title,description,status,updated_at)
    values(v_asset,v_org,'raci','Título original','Resumo original da matriz','rascunho',v_time);
  insert into public.management_asset_versions(id,organization_id,asset_id,version_number,content_format,content,review_status,updated_at)
    values(v_draft,v_org,v_asset,'1','json','{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Original"}]}]}','rascunho',v_time);
  v_input:=jsonb_build_object('expectedRevision',jsonb_build_object('assetUpdatedAt',v_time,'draftId',v_draft,'draftUpdatedAt',v_time),
    'title','Título alterado','summary','Resumo alterado da matriz','category',null,'ownerLabel','Operações','reviewCycle','Semestral','specialistId',null,'changeNote','Fixture revisão',
    'content','{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Alterado"}]}]}'::jsonb);
  begin
    perform app_private.save_admin_management_asset(v_owner,v_asset,v_input);
    raise exception 'Dono alterou conteúdo administrativo';
  exception when insufficient_privilege then null; end;
  execute format('create trigger %I before update on public.management_asset_versions for each row when (new.id=%L::uuid) execute function pg_temp.fail_admin_fixture_version()',v_trigger,v_draft);
  begin
    perform app_private.save_admin_management_asset(v_actor,v_asset,v_input);
    raise exception 'Falha intermediária não exercitada';
  exception when sqlstate 'P0999' then null; end;
  if (select title from public.management_assets where id=v_asset)<>'Título original' or
     (select content#>>'{content,0,content,0,text}' from public.management_asset_versions where id=v_draft)<>'Original' then
    raise exception 'Falha deixou alteração parcial'; end if;
  execute format('drop trigger %I on public.management_asset_versions',v_trigger);
  perform app_private.save_admin_management_asset(v_actor,v_asset,v_input);
  if (select title from public.management_assets where id=v_asset)<>'Título alterado' then raise exception 'Sucesso não persistiu'; end if;
  begin
    perform app_private.save_admin_management_asset(v_actor,v_asset,v_input);
    raise exception 'Revisão antiga sobrescreveu';
  exception when sqlstate 'PT409' then null; end;
  update public.management_asset_versions set review_status='em_revisao' where id=v_draft;
  select jsonb_set(v_input,'{expectedRevision}',jsonb_build_object('assetUpdatedAt',a.updated_at,'draftId',v.id,'draftUpdatedAt',v.updated_at)) into v_input
    from public.management_assets a join public.management_asset_versions v on v.asset_id=a.id where a.id=v_asset;
  v_input:=jsonb_set(v_input,'{title}','"Título proibido"');
  begin
    perform app_private.save_admin_management_asset(v_actor,v_asset,v_input);
    raise exception 'Edição em revisão permitida';
  exception when sqlstate 'PT409' then null; end;
  if (select title from public.management_assets where id=v_asset)<>'Título alterado' then raise exception 'Conflito alterou metadados'; end if;
  if has_function_privilege('authenticated','app_private.save_admin_management_asset(uuid,uuid,jsonb)','EXECUTE') then raise exception 'RPC exposta'; end if;
end;
$$;
select 'atomic admin asset save: ok' as result;
rollback;
