-- Publicação autorizada pelo dono, sem sobrescrever versões nem rascunhos da operação.
create or replace function app_private.update_customer_management_asset(
  p_actor_user_id uuid, p_asset_id uuid, p_expected_version_id uuid,
  p_title text, p_summary text, p_content jsonb, p_chunks jsonb
) returns jsonb
language plpgsql security invoker
set search_path = public, pg_catalog
as $$
declare
  v_asset public.management_assets%rowtype;
  v_version_id uuid;
  v_next_number bigint;
begin
  select * into v_asset from public.management_assets where id = p_asset_id for update;
  if not found then raise exception 'Ativo não encontrado.' using errcode = 'P0002'; end if;
  if not exists (select 1 from public.organization_members
    where organization_id = v_asset.organization_id and user_id = p_actor_user_id and role = 'cliente')
    or exists (select 1 from public.organization_members where user_id = p_actor_user_id and role = 'superadmin') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if v_asset.archived_at is not null or v_asset.status <> 'publicado' then
    raise exception 'Ativo indisponível.' using errcode = '22023';
  end if;
  if v_asset.current_published_version_id is distinct from p_expected_version_id then
    raise exception 'A versão publicada mudou.' using errcode = '40001';
  end if;
  if exists (select 1 from public.management_asset_versions where asset_id = p_asset_id and published_at is null) then
    raise exception 'Existe uma revisão aberta.' using errcode = '40001';
  end if;
  if nullif(trim(p_title), '') is null or nullif(trim(p_summary), '') is null
    or length(p_title) > 200 or length(p_summary) > 2000
    or p_content is null or p_content->>'type' is distinct from 'doc' then
    raise exception 'Conteúdo inválido.' using errcode = '22023';
  end if;
  select greatest(count(*), coalesce(max(case when version_number ~ '^[0-9]{1,9}$' then version_number::bigint end), 0)) + 1
    into v_next_number from public.management_asset_versions where asset_id = p_asset_id;
  insert into public.management_asset_versions (
    asset_id, organization_id, version_number, content_format, content, summary,
    created_by_user_id, last_edited_by_user_id, reviewed_by_user_id, reviewed_at, review_status, change_note
  ) values (
    v_asset.id, v_asset.organization_id, v_next_number::text, 'json', p_content, p_summary,
    p_actor_user_id, p_actor_user_id, p_actor_user_id, now(), 'pronto_para_publicar', 'Atualização pelo dono da empresa'
  ) returning id into v_version_id;
  update public.management_assets set title = p_title, description = p_summary where id = p_asset_id;
  return app_private.publish_management_asset_version(p_actor_user_id, v_version_id, p_chunks, now());
end;
$$;
revoke all on function app_private.update_customer_management_asset(uuid,uuid,uuid,text,text,jsonb,jsonb) from public, anon, authenticated;
grant execute on function app_private.update_customer_management_asset(uuid,uuid,uuid,text,text,jsonb,jsonb) to service_role;
