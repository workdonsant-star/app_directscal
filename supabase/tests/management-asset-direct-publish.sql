begin;
set local lock_timeout = '3s';
set local statement_timeout = '20s';

do $$
declare
  v_actor uuid := gen_random_uuid();
  v_owner uuid := gen_random_uuid();
  v_org uuid := gen_random_uuid();
  v_asset uuid := gen_random_uuid();
  v_draft uuid := gen_random_uuid();
  v_next uuid := gen_random_uuid();
  v_customer uuid;
  v_time timestamptz := clock_timestamp();
  v_content jsonb := '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Procedimento fictício publicado."}]}]}'::jsonb;
  v_chunks jsonb := '[{"heading_path":"Objetivo","content":"Procedimento fictício publicado.","token_count":5}]'::jsonb;
begin
  insert into next_auth.users(id,email,name) values
    (v_actor, v_actor::text || '@fixture.invalid', 'Operação fictícia'),
    (v_owner, v_owner::text || '@fixture.invalid', 'Dono fictício');
  insert into public.organizations(id,name) values (v_org,'Empresa fictícia de publicação direta');
  insert into public.organization_members(organization_id,user_id,role) values
    (v_org,v_actor,'superadmin'),(v_org,v_owner,'cliente');
  insert into public.management_assets(id,organization_id,type,title,description,owner_label,status,updated_at)
    values(v_asset,v_org,'sop','Procedimento fictício','Resumo fictício do procedimento','Operações','rascunho',v_time);
  insert into public.management_asset_versions(id,organization_id,asset_id,version_number,content_format,content,review_status,updated_at)
    values(v_draft,v_org,v_asset,'1','json',v_content,'rascunho',v_time);

  perform app_private.save_admin_management_asset(v_actor,v_asset,jsonb_build_object(
    'expectedRevision',jsonb_build_object('assetUpdatedAt',v_time,'draftId',v_draft,'draftUpdatedAt',v_time),
    'title','Procedimento fictício','summary','Resumo fictício do procedimento',
    'category',null,'ownerLabel','Operações','specialistId',null,'changeNote',null,'content',null
  ));
  if (select review_cycle from public.management_assets where id=v_asset) is not null then
    raise exception 'Salvamento criou periodicidade';
  end if;

  perform app_private.publish_management_asset_version(v_actor,v_draft,v_chunks,clock_timestamp());
  if (select current_published_version_id from public.management_assets where id=v_asset) is distinct from v_draft
    or (select review_status from public.management_asset_versions where id=v_draft) <> 'publicado'
    or (select count(*) from public.management_asset_chunks where asset_id=v_asset) <> 1 then
    raise exception 'Publicação direta não ficou vigente e indexada';
  end if;

  insert into public.management_asset_versions(id,organization_id,asset_id,version_number,content_format,content,review_status)
    values(v_next,v_org,v_asset,'2','json',v_content,'em_revisao');
  perform app_private.publish_management_asset_version(v_actor,v_next,v_chunks,clock_timestamp());
  if (select review_status from public.management_asset_versions where id=v_draft) <> 'substituido'
    or (select current_published_version_id from public.management_assets where id=v_asset) is distinct from v_next then
    raise exception 'Versão legada não foi publicada sem aprovação';
  end if;

  select (app_private.update_customer_management_asset(
    v_owner,v_asset,v_next,'Procedimento atualizado','Resumo atualizado pelo dono',
    v_content,v_chunks
  )->>'version_id')::uuid into v_customer;
  if v_customer is null
    or (select review_status from public.management_asset_versions where id=v_customer) <> 'publicado'
    or (select reviewed_at from public.management_asset_versions where id=v_customer) is not null
    or exists(select 1 from public.management_asset_versions where asset_id=v_asset and published_at is null) then
    raise exception 'Atualização do dono criou etapa de revisão';
  end if;

  if has_function_privilege('authenticated','app_private.publish_management_asset_version(uuid,uuid,jsonb,timestamptz)','EXECUTE')
    or has_function_privilege('authenticated','app_private.save_admin_management_asset(uuid,uuid,jsonb)','EXECUTE') then
    raise exception 'RPC administrativa exposta ao cliente';
  end if;
end;
$$;

select 'management asset direct publish: ok' as result;
rollback;
