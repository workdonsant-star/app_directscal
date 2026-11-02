-- Publicação direta do rascunho, sem aprovação editorial nem revisão periódica.
-- Estados antigos de versões abertas são normalizados sem alterar conteúdo.
update public.management_asset_versions
set review_status = 'rascunho', reviewed_by_user_id = null, reviewed_at = null
where published_at is null and review_status in ('em_revisao', 'pronto_para_publicar');

update public.management_assets
set status = 'rascunho'
where current_published_version_id is null and archived_at is null
  and status in ('em_revisao', 'pronto_para_publicar');

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
      raise exception 'O rascunho está indisponível para edição.' using errcode='PT409'; end if;
  end if;
  if v_specialist is distinct from v_asset.assigned_specialist_id and v_specialist is not null then
    perform 1 from public.specialists where id=v_specialist and status='ativo' and not archived and not deleted for share;
    if not found then raise exception 'Selecione um especialista ativo.' using errcode='PT400'; end if;
  end if;
  if char_length(trim(p_input->>'title')) not between 3 and 240 or
     char_length(trim(p_input->>'summary')) not between 10 and 600 or
     nullif(trim(p_input->>'ownerLabel'),'') is null then
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
    owner_label=p_input->>'ownerLabel',assigned_specialist_id=v_specialist,
    updated_at=clock_timestamp() where id=p_asset_id;
end;
$$;
revoke all on function app_private.save_admin_management_asset(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function app_private.save_admin_management_asset(uuid,uuid,jsonb) to service_role;

create or replace function app_private.publish_management_asset_version(
  p_actor_user_id uuid,
  p_version_id uuid,
  p_chunks jsonb,
  p_published_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $$
declare
  v_version public.management_asset_versions%rowtype;
  v_asset public.management_assets%rowtype;
  v_chunk jsonb;
  v_ordinal integer := 0;
begin
  select *
    into v_version
  from public.management_asset_versions
  where id = p_version_id
  for update;

  if not found then
    raise exception 'Versão não encontrada.' using errcode = '22023';
  end if;

  if v_version.published_at is not null then
    raise exception 'Esta versão já foi publicada.' using errcode = '22023';
  end if;

  if v_version.review_status not in ('rascunho', 'em_revisao', 'pronto_para_publicar') then
    raise exception 'Esta versão não está disponível para publicação.' using errcode = '22023';
  end if;

  if jsonb_typeof(p_chunks) <> 'array' or jsonb_array_length(p_chunks) = 0 then
    raise exception 'O conteúdo não gerou trechos pesquisáveis.' using errcode = '22023';
  end if;

  select *
    into v_asset
  from public.management_assets
  where id = v_version.asset_id
    and organization_id = v_version.organization_id
  for update;

  if v_asset.archived_at is not null then
    raise exception 'Restaure o ativo antes de publicar.' using errcode = '22023';
  end if;

  delete from public.management_asset_chunks
  where asset_id = v_asset.id
    and organization_id = v_asset.organization_id;

  for v_chunk in select value from jsonb_array_elements(p_chunks)
  loop
    insert into public.management_asset_chunks (
      organization_id,
      asset_id,
      version_id,
      ordinal,
      heading_path,
      content,
      token_count,
      embedding,
      embedding_model
    )
    values (
      v_asset.organization_id,
      v_asset.id,
      v_version.id,
      v_ordinal,
      v_chunk->>'heading_path',
      v_chunk->>'content',
      coalesce((v_chunk->>'token_count')::integer, 0),
      case
        when v_chunk ? 'embedding' and jsonb_typeof(v_chunk->'embedding') = 'array'
          then (v_chunk->>'embedding')::extensions.vector
        else null
      end,
      nullif(v_chunk->>'embedding_model', '')
    );

    v_ordinal := v_ordinal + 1;
  end loop;

  if v_asset.current_published_version_id is not null then
    update public.management_asset_versions
    set review_status = 'substituido'
    where id = v_asset.current_published_version_id;
  end if;

  update public.management_asset_versions
  set
    review_status = 'publicado',
    published_at = p_published_at,
    published_by_user_id = p_actor_user_id,
    index_status = 'pronto',
    index_error = null
  where id = v_version.id;

  update public.management_assets
  set
    status = 'publicado',
    current_published_version_id = v_version.id
  where id = v_asset.id;

  return jsonb_build_object(
    'asset_id', v_asset.id,
    'version_id', v_version.id,
    'version_number', v_version.version_number,
    'chunk_count', v_ordinal
  );
end;
$$;

revoke all on function app_private.publish_management_asset_version(uuid, uuid, jsonb, timestamptz)
from public, anon, authenticated;
grant execute on function app_private.publish_management_asset_version(uuid, uuid, jsonb, timestamptz)
to service_role;


-- A edição do dono também publica sem criar aprovação intermediária.
create or replace function app_private.update_customer_management_asset(
  p_actor_user_id uuid, p_asset_id uuid, p_expected_version_id uuid,
  p_title text, p_summary text, p_content jsonb, p_chunks jsonb
) returns jsonb
language plpgsql security invoker
set search_path = ''
set lock_timeout = '5s'
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
    raise exception 'A versão publicada mudou.' using errcode = 'PT409';
  end if;
  if exists (select 1 from public.management_asset_versions where asset_id = p_asset_id and published_at is null) then
    raise exception 'Existe um rascunho aberto.' using errcode = 'PT409';
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
    created_by_user_id, last_edited_by_user_id, review_status, change_note
  ) values (
    v_asset.id, v_asset.organization_id, v_next_number::text, 'json', p_content, p_summary,
    p_actor_user_id, p_actor_user_id, 'rascunho', 'Atualização pelo dono da empresa'
  ) returning id into v_version_id;
  update public.management_assets set title = p_title, description = p_summary where id = p_asset_id;
  return app_private.publish_management_asset_version(p_actor_user_id, v_version_id, p_chunks, now());
end;
$$;
revoke all on function app_private.update_customer_management_asset(uuid,uuid,uuid,text,text,jsonb,jsonb) from public, anon, authenticated;
grant execute on function app_private.update_customer_management_asset(uuid,uuid,uuid,text,text,jsonb,jsonb) to service_role;
