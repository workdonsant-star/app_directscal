begin;
do $$
declare v_actor uuid; v_org uuid; v_ids uuid[]; v_source text; v_target text; v_name text := 'Exclusão ' || gen_random_uuid(); v_result jsonb; v_before jsonb;
begin
  select m.user_id,m.organization_id,array_agg(a.id order by a.id) into v_actor,v_org,v_ids from public.organization_members m join public.management_assets a on a.organization_id=m.organization_id
    where m.role='cliente' and a.status='publicado' and a.archived_at is null and a.current_published_version_id is not null
    and not exists(select 1 from public.organization_members s where s.user_id=m.user_id and s.role='superadmin') group by m.user_id,m.organization_id having count(*)>=2 limit 1;
  if v_actor is null then raise exception 'Contexto indisponível'; end if;
  v_ids:=v_ids[1:2];
  v_result:=app_private.save_management_asset_category(v_org,v_actor,null,v_name,null);v_source:=v_result->>'key';
  perform app_private.update_customer_assets_metadata(v_actor,v_ids,jsonb_build_object('category',v_name));
  update public.management_assets set archived_at=now() where id=v_ids[2];
  if app_private.management_asset_category_document_count(v_org,v_actor,v_source)<>2 then raise exception 'Arquivados não contados'; end if;
  select jsonb_agg(to_jsonb(a) order by id) into v_before from public.management_assets a where id=any(v_ids);
  begin
    perform app_private.delete_management_asset_category(v_org,v_actor,v_source,v_name,null,null);
    raise exception 'Destino deveria ser obrigatório';
  exception when invalid_parameter_value then null; end;
  if app_private.management_asset_category_title(v_org,v_source) is null or (select jsonb_agg(to_jsonb(a) order by id) from public.management_assets a where id=any(v_ids))<>v_before then raise exception 'Falha alterou dados'; end if;
  begin
    perform app_private.delete_management_asset_category(v_org,v_actor,v_source,v_name,v_source,null);
    raise exception 'Mesma categoria deveria falhar';
  exception when invalid_parameter_value then null; end;
  v_result:=app_private.delete_management_asset_category(v_org,v_actor,v_source,v_name,null,v_name || ' destino');
  v_target:=v_result->>'destinationKey';
  if (v_result->>'movedCount')::int<>2 or app_private.management_asset_category_title(v_org,v_source) is not null then raise exception 'Exclusão incompleta'; end if;
  if (select count(*) from public.management_assets where id=any(v_ids) and category=v_name || ' destino')<>2 then raise exception 'Redistribuição incompleta'; end if;
  if (select count(*) from public.management_assets where id=any(v_ids) and current_published_version_id is not null)<>2 then raise exception 'Versão removida'; end if;
  -- Categoria padrão: não deve reaparecer vazia depois da exclusão.
  if app_private.management_asset_category_title(v_org,'comunicacao') is not null then
    perform app_private.delete_management_asset_category(v_org,v_actor,'comunicacao',app_private.management_asset_category_title(v_org,'comunicacao'),v_target,null);
    if app_private.management_asset_category_title(v_org,'comunicacao') is not null then raise exception 'Padrão reapareceu'; end if;
  end if;
  v_result:=app_private.save_management_asset_category(v_org,v_actor,null,v_name || ' vazia',null);
  perform app_private.delete_management_asset_category(v_org,v_actor,v_result->>'key',v_name || ' vazia',null,null);
  if app_private.management_asset_category_title(v_org,v_result->>'key') is not null then raise exception 'Pasta vazia permaneceu'; end if;
  begin
    perform app_private.delete_management_asset_category(v_org,gen_random_uuid(),v_target,v_name || ' destino',null,null);
    raise exception 'Ator indevido deveria falhar';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'Exclusão vazia, destino obrigatório, mesma pasta, criação e transferência atômicas, arquivados, versões, padrão e autorização verificados com rollback' as result;
