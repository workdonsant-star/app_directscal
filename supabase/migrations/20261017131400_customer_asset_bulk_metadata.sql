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
      or (p_changes->>'category' not in ('Gestão de pessoas','Governança','Cultura','Comunicação') and not exists (
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
