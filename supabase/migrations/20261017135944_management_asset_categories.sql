-- O registro de categorias usa o JSON privado de apresentação já existente.
-- Chaves estáveis preservam URLs, ordem e ícones depois de renomear.
create or replace function app_private.save_asset_navigation_preferences(
  p_organization_id uuid, p_actor_user_id uuid, p_preferences jsonb
) returns jsonb language plpgsql security invoker set search_path = public, pg_catalog as $$
declare v_preferences jsonb;
begin
  if not exists (select 1 from public.organization_members where organization_id=p_organization_id and user_id=p_actor_user_id and role='cliente')
    or exists (select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then
    raise exception 'Acesso negado' using errcode='42501';
  end if;
  if jsonb_typeof(p_preferences->'order') is distinct from 'array' or jsonb_typeof(p_preferences->'icons') is distinct from 'object'
    or exists(select 1 from jsonb_object_keys(p_preferences) k where k not in ('order','icons')) then
    raise exception 'Preferências inválidas' using errcode='22023';
  end if;
  insert into public.organization_asset_navigation(organization_id,preferences,updated_by)
    values(p_organization_id,p_preferences,p_actor_user_id)
    on conflict(organization_id) do update set
      preferences=organization_asset_navigation.preferences || p_preferences,
      updated_by=p_actor_user_id, updated_at=now()
    returning preferences into v_preferences;
  return v_preferences;
end $$;
revoke all on function app_private.save_asset_navigation_preferences(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function app_private.save_asset_navigation_preferences(uuid,uuid,jsonb) to service_role;

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
    v_old_normalized := lower(extensions.unaccent(trim(regexp_replace(p_previous_title,'\s+',' ','g'))));
    if p_previous_title is null or (v_registered is not null and v_registered->>'title' is distinct from p_previous_title)
      or (v_registered is null and not exists (
        select 1 from (values ('gestao de pessoas','Gestão de pessoas'),('governanca','Governança'),('cultura','Cultura'),('comunicacao','Comunicação')) d(key,title)
        where d.key=p_key and d.title=p_previous_title
        union all select 1 from public.management_assets a where a.organization_id=p_organization_id
          and lower(extensions.unaccent(trim(regexp_replace(a.category,'\s+',' ','g'))))=p_key
          and a.category=p_previous_title and a.archived_at is null and a.status='publicado'
      )) then raise exception 'Categoria desatualizada' using errcode='40001'; end if;
  elsif jsonb_array_length(v_categories)>=100 then
    raise exception 'Limite de categorias atingido' using errcode='22023';
  end if;
  if exists(select 1 from jsonb_array_elements(v_categories) c where c->>'key'<>v_key and lower(extensions.unaccent(c->>'title'))=v_normalized)
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
    if jsonb_typeof(p_changes->'category') <> 'string' or length(p_changes->>'category') not between 1 and 80
      or (p_changes->>'category' not in ('Gestão de pessoas','Governança','Cultura','Comunicação') and not exists (select 1 from public.organization_asset_navigation n, jsonb_array_elements(coalesce(n.preferences->'categories','[]'::jsonb)) c where n.organization_id=v_org and c->>'title'=p_changes->>'category') and not exists (
        select 1 from public.management_assets where organization_id = v_org and status = 'publicado'
          and archived_at is null and current_published_version_id is not null
          and trim(regexp_replace(category, '\s+', ' ', 'g')) = p_changes->>'category'
      )) then
      raise exception 'Selecione uma pasta existente.' using errcode = '22023';
    end if;
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
