create or replace function app_private.management_asset_category_title(p_organization_id uuid,p_key text)
returns text language plpgsql security invoker set search_path=public,pg_catalog as $$
declare v_category jsonb; v_title text;
begin
  select c into v_category from public.organization_asset_navigation n,jsonb_array_elements(coalesce(n.preferences->'categories','[]'::jsonb)) c
    where n.organization_id=p_organization_id and c->>'key'=p_key;
  if v_category is not null then
    if coalesce((v_category->>'deleted')::boolean,false) then return null; end if;
    return v_category->>'title';
  end if;
  select title into v_title from (values ('gestao de pessoas','Gestão de pessoas'),('governanca','Governança'),('cultura','Cultura'),('comunicacao','Comunicação')) d(key,title) where key=p_key;
  if v_title is not null then return v_title; end if;
  select coalesce(trim(regexp_replace(category,'\s+',' ','g')),'Sem categoria') into v_title from public.management_assets
    where organization_id=p_organization_id and status='publicado' and archived_at is null
      and coalesce(lower(extensions.unaccent(trim(regexp_replace(category,'\s+',' ','g')))),'sem categoria')=p_key limit 1;
  return v_title;
end $$;
revoke all on function app_private.management_asset_category_title(uuid,text) from public,anon,authenticated;
grant execute on function app_private.management_asset_category_title(uuid,text) to service_role;

create or replace function app_private.management_asset_category_document_count(p_organization_id uuid,p_actor_user_id uuid,p_key text)
returns bigint language plpgsql security invoker set search_path=public,pg_catalog as $$
declare v_title text; v_count bigint;
begin
  if not exists(select 1 from public.organization_members where organization_id=p_organization_id and user_id=p_actor_user_id and role='cliente')
    or exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then raise exception 'Acesso negado' using errcode='42501'; end if;
  v_title := app_private.management_asset_category_title(p_organization_id,p_key);
  if v_title is null then raise exception 'Categoria indisponível' using errcode='40001'; end if;
  select count(*) into v_count from public.management_assets where organization_id=p_organization_id
    and coalesce(lower(extensions.unaccent(trim(regexp_replace(category,'\s+',' ','g')))),'sem categoria')=lower(extensions.unaccent(v_title));
  return v_count;
end $$;
revoke all on function app_private.management_asset_category_document_count(uuid,uuid,text) from public,anon,authenticated;
grant execute on function app_private.management_asset_category_document_count(uuid,uuid,text) to service_role;

create or replace function app_private.delete_management_asset_category(
  p_organization_id uuid,p_actor_user_id uuid,p_key text,p_expected_title text,p_destination_key text,p_new_title text
) returns jsonb language plpgsql security invoker set search_path=public,pg_catalog as $$
declare v_title text; v_destination_title text; v_destination_key text; v_count bigint; v_preferences jsonb; v_categories jsonb; v_result jsonb;
begin
  if not exists(select 1 from public.organization_members where organization_id=p_organization_id and user_id=p_actor_user_id and role='cliente')
    or exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then raise exception 'Acesso negado' using errcode='42501'; end if;
  insert into public.organization_asset_navigation(organization_id,preferences,updated_by)
    values(p_organization_id,'{"order":[],"icons":{}}',p_actor_user_id) on conflict do nothing;
  select preferences into v_preferences from public.organization_asset_navigation where organization_id=p_organization_id for update;
  v_title := app_private.management_asset_category_title(p_organization_id,p_key);
  if v_title is null or v_title is distinct from p_expected_title then raise exception 'Categoria desatualizada' using errcode='40001'; end if;
  if p_destination_key is not null and p_new_title is not null then raise exception 'Escolha um destino' using errcode='22023'; end if;
  -- Bloqueio em ordem estável preserva todos os estados, inclusive rascunhos e arquivados.
  perform id from public.management_assets where organization_id=p_organization_id order by id for update;
  v_count := app_private.management_asset_category_document_count(p_organization_id,p_actor_user_id,p_key);
  if v_count>0 and p_destination_key is null and nullif(trim(p_new_title),'') is null then
    raise exception 'Escolha ou crie uma categoria de destino' using errcode='22023';
  end if;
  if p_destination_key is not null then
    v_destination_key := p_destination_key;
    v_destination_title := app_private.management_asset_category_title(p_organization_id,p_destination_key);
    if p_destination_key=p_key or v_destination_title is null or lower(extensions.unaccent(v_destination_title))=lower(extensions.unaccent(v_title)) then
      raise exception 'Destino inválido' using errcode='22023';
    end if;
  elsif p_new_title is not null then
    v_result := app_private.save_management_asset_category(p_organization_id,p_actor_user_id,null,p_new_title,null);
    v_destination_key := v_result->>'key'; v_destination_title := v_result->>'title';
    select preferences into v_preferences from public.organization_asset_navigation where organization_id=p_organization_id;
  end if;
  if v_count>0 then
    update public.management_assets set category=case when v_destination_key='sem categoria' then null else v_destination_title end,updated_at=now()
      where organization_id=p_organization_id and coalesce(lower(extensions.unaccent(trim(regexp_replace(category,'\s+',' ','g')))),'sem categoria')=lower(extensions.unaccent(v_title));
  end if;
  select coalesce(jsonb_agg(c),'[]'::jsonb) into v_categories from jsonb_array_elements(coalesce(v_preferences->'categories','[]'::jsonb)) c where c->>'key'<>p_key;
  if p_key in ('gestao de pessoas','governanca','cultura','comunicacao') then
    v_categories := v_categories || jsonb_build_array(jsonb_build_object('key',p_key,'title',v_title,'deleted',true));
  end if;
  v_preferences := jsonb_set(v_preferences,'{categories}',v_categories);
  v_preferences := jsonb_set(v_preferences,'{icons}',coalesce(v_preferences->'icons','{}'::jsonb)-p_key);
  v_preferences := jsonb_set(v_preferences,'{order}',coalesce((select jsonb_agg(k) from jsonb_array_elements(coalesce(v_preferences->'order','[]'::jsonb)) k where k#>>'{}'<>p_key),'[]'::jsonb));
  update public.organization_asset_navigation set preferences=v_preferences,updated_by=p_actor_user_id,updated_at=now() where organization_id=p_organization_id;
  return jsonb_build_object('movedCount',v_count,'destinationKey',v_destination_key);
end $$;
revoke all on function app_private.delete_management_asset_category(uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function app_private.delete_management_asset_category(uuid,uuid,text,text,text,text) to service_role;

create or replace function app_private.save_management_asset_category(
  p_organization_id uuid, p_actor_user_id uuid, p_key text, p_title text, p_previous_title text
) returns jsonb language plpgsql security invoker set search_path = public, pg_catalog as $$
declare
  v_preferences jsonb; v_categories jsonb; v_registered jsonb; v_key text;
  v_title text := trim(regexp_replace(p_title,'\s+',' ','g'));
  v_normalized text; v_old_normalized text;
begin
  if not exists (select 1 from public.organization_members where organization_id=p_organization_id and user_id=p_actor_user_id and role='cliente')
    or exists (select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then
    raise exception 'Acesso negado' using errcode='42501';
  end if;
  if v_title is null or length(v_title) not between 1 and 80 then raise exception 'Nome inválido' using errcode='22023'; end if;
  v_normalized := lower(extensions.unaccent(v_title));
  if v_normalized='sem categoria' then raise exception 'Nome reservado' using errcode='22023'; end if;
  insert into public.organization_asset_navigation(organization_id,preferences,updated_by)
    values(p_organization_id,'{"order":[],"icons":{}}',p_actor_user_id) on conflict do nothing;
  select preferences into v_preferences from public.organization_asset_navigation where organization_id=p_organization_id for update;
  v_categories := coalesce(v_preferences->'categories','[]'::jsonb);
  v_key := coalesce(p_key,gen_random_uuid()::text);
  select c into v_registered from jsonb_array_elements(v_categories) c where c->>'key'=v_key;
  if p_key is not null then
    if coalesce((v_registered->>'deleted')::boolean,false) then raise exception 'Categoria excluída' using errcode='40001'; end if;
    v_old_normalized := lower(extensions.unaccent(trim(regexp_replace(p_previous_title,'\s+',' ','g'))));
    if p_previous_title is null or (v_registered is not null and v_registered->>'title' is distinct from p_previous_title)
      or (v_registered is null and not exists (
        select 1 from (values ('gestao de pessoas','Gestão de pessoas'),('governanca','Governança'),('cultura','Cultura'),('comunicacao','Comunicação')) d(key,title)
        where d.key=p_key and d.title=p_previous_title
        union all select 1 from public.management_assets a where a.organization_id=p_organization_id
          and lower(extensions.unaccent(trim(regexp_replace(a.category,'\s+',' ','g'))))=p_key
          and a.category=p_previous_title and a.archived_at is null and a.status='publicado'
      )) then raise exception 'Categoria desatualizada' using errcode='40001'; end if;
  elsif (select count(*) from jsonb_array_elements(v_categories) c where not coalesce((c->>'deleted')::boolean,false))>=100 then
    raise exception 'Limite de categorias atingido' using errcode='22023';
  end if;
  if exists(select 1 from jsonb_array_elements(v_categories) c where c->>'key'<>v_key and not coalesce((c->>'deleted')::boolean,false) and lower(extensions.unaccent(c->>'title'))=v_normalized)
    or exists(select 1 from (values ('gestao de pessoas','Gestão de pessoas'),('governanca','Governança'),('cultura','Cultura'),('comunicacao','Comunicação')) d(key,title)
      where d.key<>v_key and lower(extensions.unaccent(d.title))=v_normalized and not exists(select 1 from jsonb_array_elements(v_categories) c where c->>'key'=d.key))
    or exists(select 1 from public.management_assets a where a.organization_id=p_organization_id and a.archived_at is null and a.status='publicado'
      and lower(extensions.unaccent(trim(regexp_replace(a.category,'\s+',' ','g'))))=v_normalized
      and (p_key is null or v_normalized is distinct from v_old_normalized)) then
    raise exception 'Categoria duplicada' using errcode='23505';
  end if;
  select coalesce(jsonb_agg(c),'[]'::jsonb) into v_categories from jsonb_array_elements(v_categories) c where c->>'key'<>v_key;
  v_categories := v_categories || jsonb_build_array(jsonb_build_object('key',v_key,'title',v_title));
  if p_key is not null then
    update public.management_assets set category=v_title,updated_at=now()
    where organization_id=p_organization_id and lower(extensions.unaccent(trim(regexp_replace(category,'\s+',' ','g'))))=v_old_normalized;
  end if;
  v_preferences := jsonb_set(v_preferences,'{categories}',v_categories);
  update public.organization_asset_navigation set preferences=v_preferences,updated_by=p_actor_user_id,updated_at=now() where organization_id=p_organization_id;
  return jsonb_build_object('key',v_key,'title',v_title);
end $$;
revoke all on function app_private.save_management_asset_category(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function app_private.save_management_asset_category(uuid,uuid,text,text,text) to service_role;


-- Metadados de biblioteca; versões e trechos publicados permanecem intactos.
create or replace function app_private.update_customer_assets_metadata(
  p_actor_user_id uuid, p_asset_ids uuid[], p_changes jsonb
) returns jsonb
language plpgsql security invoker
set search_path = public, pg_catalog
as $$
declare
  v_asset public.management_assets%rowtype;
  v_org uuid;
  v_count integer := 0;
  v_ids uuid[] := '{}';
begin
  if coalesce(cardinality(p_asset_ids), 0) not between 1 and 1000
    or (select count(distinct id) from unnest(p_asset_ids) id) <> cardinality(p_asset_ids)
    or jsonb_typeof(p_changes) is distinct from 'object' or p_changes = '{}'::jsonb
    or exists (select 1 from jsonb_object_keys(p_changes) k where k not in ('type','category')) then
    raise exception 'Seleção inválida.' using errcode = '22023';
  end if;
  if p_changes ? 'type' and (p_changes->>'type' is null or p_changes->>'type' not in ('sop','playbook','governanca','raci')) then
    raise exception 'Tipo inválido.' using errcode = '22023';
  end if;
  if exists (select 1 from public.organization_members where user_id = p_actor_user_id and role = 'superadmin') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  for v_asset in select * from public.management_assets where id = any(p_asset_ids) order by id for update loop
    if not exists (select 1 from public.organization_members where user_id = p_actor_user_id and organization_id = v_asset.organization_id and role = 'cliente') then
      raise exception 'Acesso negado.' using errcode = '42501';
    end if;
    if v_org is not null and v_org <> v_asset.organization_id then
      raise exception 'Selecione uma única empresa.' using errcode = '22023';
    end if;
    v_org := v_asset.organization_id;
    if v_asset.archived_at is not null or v_asset.status <> 'publicado' or v_asset.current_published_version_id is null then
      raise exception 'Ativo indisponível.' using errcode = '40001';
    end if;
    v_count := v_count + 1;
  end loop;
  if v_count <> cardinality(p_asset_ids) then
    raise exception 'Seleção desatualizada.' using errcode = '40001';
  end if;
  if p_changes ? 'category' and p_changes->>'category' is not null then
    if jsonb_typeof(p_changes->'category') <> 'string' or length(p_changes->>'category') not between 1 and 80 or not exists (
      select 1 from (
        select c->>'key' as key from public.organization_asset_navigation n,jsonb_array_elements(coalesce(n.preferences->'categories','[]'::jsonb)) c where n.organization_id=v_org
        union select unnest(array['gestao de pessoas','governanca','cultura','comunicacao'])
        union select distinct lower(extensions.unaccent(trim(regexp_replace(category,'\s+',' ','g')))) from public.management_assets where organization_id=v_org and status='publicado' and archived_at is null
      ) folders where app_private.management_asset_category_title(v_org,folders.key)=p_changes->>'category'
    ) then raise exception 'Selecione uma pasta existente' using errcode='22023'; end if;
  end if;
  update public.management_assets set
    type = case when p_changes ? 'type' then (p_changes->>'type')::public.management_asset_type else type end,
    category = case when p_changes ? 'category' then p_changes->>'category' else category end,
    updated_at = now()
  where id = any(p_asset_ids) and organization_id = v_org;
  v_ids := p_asset_ids;
  return jsonb_build_object('assetIds', to_jsonb(v_ids), 'count', v_count);
end;
$$;
revoke all on function app_private.update_customer_assets_metadata(uuid,uuid[],jsonb) from public, anon, authenticated;
grant execute on function app_private.update_customer_assets_metadata(uuid,uuid[],jsonb) to service_role;
