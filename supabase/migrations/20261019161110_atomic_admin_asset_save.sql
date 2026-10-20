create or replace function app_private.save_admin_management_asset(p_actor_user_id uuid,p_asset_id uuid,p_input jsonb)
returns void language plpgsql security invoker set search_path='' set lock_timeout='5s' as $$
declare
  v_asset public.management_assets; v_draft public.management_asset_versions;
  v_version_number bigint; v_specialist text:=p_input->>'specialistId';
begin
  if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then
    raise exception 'Acesso restrito à operação.' using errcode='42501'; end if;
  select * into v_asset from public.management_assets where id=p_asset_id for update;
  if not found then raise exception 'Ativo indisponível.' using errcode='PT404'; end if;
  if v_asset.archived_at is not null then raise exception 'Restaure o ativo antes de editar.' using errcode='PT409'; end if;
  select * into v_draft from public.management_asset_versions where asset_id=p_asset_id and published_at is null for update nowait;
  if p_input->'expectedRevision' is null or
     v_asset.updated_at is distinct from (p_input->'expectedRevision'->>'assetUpdatedAt')::timestamptz or
     v_draft.id is distinct from (p_input->'expectedRevision'->>'draftId')::uuid or
     v_draft.updated_at is distinct from (p_input->'expectedRevision'->>'draftUpdatedAt')::timestamptz then
    raise exception 'O ativo mudou em outra sessão.' using errcode='PT409'; end if;
  if p_input->'content' is not null and p_input->'content'<>'null'::jsonb then
    if p_input->'content'->>'type' is distinct from 'doc' then raise exception 'Documento inválido.' using errcode='PT400'; end if;
    if v_draft.id is not null and v_draft.review_status<>'rascunho' then
      raise exception 'O conteúdo está em revisão.' using errcode='PT409'; end if;
  end if;
  if v_specialist is distinct from v_asset.assigned_specialist_id and v_specialist is not null then
    perform 1 from public.specialists where id=v_specialist and status='ativo' and not archived and not deleted for share;
    if not found then raise exception 'Selecione um especialista ativo.' using errcode='PT400'; end if;
  end if;
  if char_length(trim(p_input->>'title')) not between 3 and 240 or
     char_length(trim(p_input->>'summary')) not between 10 and 600 or
     nullif(trim(p_input->>'ownerLabel'),'') is null or nullif(trim(p_input->>'reviewCycle'),'') is null then
    raise exception 'Metadados inválidos.' using errcode='PT400'; end if;
  -- Todas as recusas de estado/versão precedem a primeira escrita.
  if v_draft.id is null and p_input->'content' is not null and p_input->'content'<>'null'::jsonb then
    select greatest(count(*),coalesce(max(case when version_number~'^[0-9]{1,9}$' then version_number::bigint end),0))+1
      into v_version_number from public.management_asset_versions where asset_id=p_asset_id;
    insert into public.management_asset_versions(asset_id,organization_id,version_number,content_format,content,summary,
      created_by_user_id,last_edited_by_user_id,review_status,change_note)
    values(p_asset_id,v_asset.organization_id,v_version_number::text,'json',p_input->'content',p_input->>'summary',
      p_actor_user_id,p_actor_user_id,'rascunho',p_input->>'changeNote') returning * into v_draft;
  elsif v_draft.id is not null and v_draft.review_status='rascunho' then
    update public.management_asset_versions set summary=p_input->>'summary',change_note=p_input->>'changeNote',
      last_edited_by_user_id=p_actor_user_id,
      content=case when p_input->'content' is not null and p_input->'content'<>'null'::jsonb then p_input->'content' else content end
      where id=v_draft.id;
  end if;
  update public.management_assets set title=p_input->>'title',description=p_input->>'summary',category=p_input->>'category',
    owner_label=p_input->>'ownerLabel',review_cycle=p_input->>'reviewCycle',assigned_specialist_id=v_specialist,
    updated_at=clock_timestamp() where id=p_asset_id;
end;
$$;
revoke all on function app_private.save_admin_management_asset(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function app_private.save_admin_management_asset(uuid,uuid,jsonb) to service_role;
