begin;
do $$
declare v_actor uuid; v_org uuid; v_id uuid; v_key text; v_title text := 'Teste ' || gen_random_uuid(); v_result jsonb; v_preferences jsonb;
begin
  select m.user_id,m.organization_id,a.id into v_actor,v_org,v_id from public.organization_members m
    join public.management_assets a on a.organization_id=m.organization_id
    where m.role='cliente' and a.status='publicado' and a.archived_at is null and a.current_published_version_id is not null
    and not exists(select 1 from public.organization_members s where s.user_id=m.user_id and s.role='superadmin') limit 1;
  if v_actor is null then raise exception 'Contexto de teste indisponível'; end if;
  v_result := app_private.save_management_asset_category(v_org,v_actor,null,v_title,null);
  v_key := v_result->>'key';
  if not exists(select 1 from public.organization_asset_navigation n,jsonb_array_elements(n.preferences->'categories') c where n.organization_id=v_org and c->>'key'=v_key) then raise exception 'Pasta vazia não persistida'; end if;
  select preferences into v_preferences from public.organization_asset_navigation where organization_id=v_org;
  perform app_private.save_asset_navigation_preferences(v_org,v_actor,jsonb_build_object('order',v_preferences->'order','icons',coalesce(v_preferences->'icons','{}'::jsonb) || jsonb_build_object(v_key,'lucide:book')));
  perform app_private.update_customer_assets_metadata(v_actor,array[v_id],jsonb_build_object('category',v_title));
  perform app_private.save_management_asset_category(v_org,v_actor,v_key,v_title || ' renomeada',v_title);
  if (select category from public.management_assets where id=v_id) <> v_title || ' renomeada' then raise exception 'Ativos não renomeados'; end if;
  if (select preferences->'icons'->>v_key from public.organization_asset_navigation where organization_id=v_org) <> 'lucide:book' then raise exception 'Ícone perdido'; end if;
  begin
    perform app_private.save_management_asset_category(v_org,v_actor,null,v_title || ' renomeada',null);
    raise exception 'Duplicação deveria falhar';
  exception when unique_violation then null; end;
  begin
    perform app_private.save_management_asset_category(v_org,gen_random_uuid(),null,'Negada',null);
    raise exception 'Ator inválido deveria falhar';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'Criação vazia, tipo/categoria, renomeação dos ativos, ícone, duplicatas e autorização verificados com rollback' as result;
