begin;
do $test$
declare
  org uuid; actor uuid; asset uuid; v1 uuid; v2 uuid; result jsonb;
  doc jsonb := '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Conteúdo de teste"}]}]}';
  chunks jsonb := '[{"heading_path":"Teste","content":"Conteúdo de teste","token_count":3}]';
begin
  select m.organization_id,m.user_id into org,actor from public.organization_members m
    where role='cliente' and not exists(select 1 from public.organization_members x where x.user_id=m.user_id and x.role='superadmin') limit 1;
  if actor is null then raise exception 'Fixture exige dono existente'; end if;
  insert into public.management_assets(organization_id,type,title,description,created_by_user_id,status)
    values(org,'sop','Teste transacional','Resumo',actor,'rascunho') returning id into asset;
  insert into public.management_asset_versions(asset_id,organization_id,version_number,content_format,content,summary,created_by_user_id,review_status)
    values(asset,org,'1','json',doc,'Resumo',actor,'pronto_para_publicar') returning id into v1;
  perform app_private.publish_management_asset_version(actor,v1,chunks,now());
  result := app_private.update_customer_management_asset(actor,asset,v1,'Título atualizado','Resumo atualizado',doc,chunks);
  v2 := (result->>'version_id')::uuid;
  if v2=v1 or result->>'version_number'<>'2' then raise exception 'Versionamento falhou'; end if;
  if not exists(select 1 from public.management_asset_versions where id=v1 and content=doc and review_status='substituido') then raise exception 'Histórico alterado'; end if;
  if not exists(select 1 from public.management_asset_versions where id=v2 and last_edited_by_user_id=actor and published_at is not null) then raise exception 'Editor/publicação ausente'; end if;
  if not exists(select 1 from public.management_asset_chunks where asset_id=asset and version_id=v2) then raise exception 'Índice ausente'; end if;
  begin
    perform app_private.update_customer_management_asset(actor,asset,v1,'Título','Resumo',doc,chunks);
    raise exception 'Aceitou versão desatualizada';
  exception when sqlstate 'PT409' then null; end;
  begin
    perform app_private.update_customer_management_asset(gen_random_uuid(),asset,v2,'Título','Resumo',doc,chunks);
    raise exception 'Aceitou ator de outra empresa';
  exception when insufficient_privilege then null; end;
  begin
    perform app_private.update_customer_management_asset(actor,asset,v2,'Não deve salvar','Resumo',doc,'[]');
    raise exception 'Aceitou publicação sem índice';
  exception when invalid_parameter_value then null; end;
  if (select title from public.management_assets where id=asset)<>'Título atualizado'
    or (select count(*) from public.management_asset_versions where asset_id=asset)<>2 then raise exception 'Atomicidade falhou'; end if;
  insert into public.management_asset_versions(asset_id,organization_id,version_number,content_format,content,created_by_user_id)
    values(asset,org,'3','json',doc,actor);
  begin
    perform app_private.update_customer_management_asset(actor,asset,v2,'Título','Resumo',doc,chunks);
    raise exception 'Sobrescreveu rascunho da operação';
  exception when sqlstate 'PT409' then null; end;
end $test$;
select 'Versionamento, histórico, editor, índice, isolamento, conflito e atomicidade OK' as resultado;
rollback;
