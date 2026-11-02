-- Arquivos entregues pela operação, sempre privados e isolados por empresa.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customer-documents', 'customer-documents', false, 10485760,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.customer_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null check (kind in ('asset', 'report')),
  category_key text,
  title text not null check (length(trim(title)) between 1 and 160),
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  byte_size integer not null check (byte_size between 1 and 10485760),
  created_by uuid references next_auth.users(id) on delete set null,
  published_at timestamptz not null default now(),
  check ((kind = 'asset' and category_key is not null) or (kind = 'report' and category_key is null))
);
create index customer_documents_org_kind_idx on public.customer_documents (organization_id, kind, published_at desc);
alter table public.customer_documents enable row level security;
revoke all on public.customer_documents from anon, authenticated;
grant select, insert, delete on public.customer_documents to service_role;

create function app_private.admin_create_customer_document_category(
  p_organization_id uuid, p_actor_user_id uuid, p_title text
) returns jsonb language plpgsql security invoker set search_path = public, pg_catalog as $$
declare
  v_title text := trim(regexp_replace(p_title, '\s+', ' ', 'g'));
  v_preferences jsonb;
  v_categories jsonb;
  v_key text := gen_random_uuid()::text;
begin
  if not exists (select 1 from public.organization_members where user_id = p_actor_user_id and role = 'superadmin')
    or not exists (select 1 from public.organizations where id = p_organization_id) then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;
  if v_title is null or length(v_title) not between 1 and 80 or lower(extensions.unaccent(v_title)) = 'sem categoria' then
    raise exception 'Nome inválido' using errcode = '22023';
  end if;
  insert into public.organization_asset_navigation (organization_id, preferences, updated_by)
  values (p_organization_id, '{"order":[],"icons":{}}', p_actor_user_id) on conflict do nothing;
  select preferences into v_preferences from public.organization_asset_navigation where organization_id = p_organization_id for update;
  v_categories := coalesce(v_preferences->'categories', '[]'::jsonb);
  if jsonb_array_length(v_categories) >= 100 then raise exception 'Limite de categorias' using errcode = '22023'; end if;
  if exists (select 1 from jsonb_array_elements(v_categories) c where c->>'deleted' is distinct from 'true' and lower(extensions.unaccent(c->>'title')) = lower(extensions.unaccent(v_title)))
    or exists (select 1 from (values ('Gestão de pessoas'), ('Governança'), ('Cultura'), ('Comunicação')) d(title) where lower(extensions.unaccent(d.title)) = lower(extensions.unaccent(v_title))) then
    raise exception 'Categoria duplicada' using errcode = '23505';
  end if;
  update public.organization_asset_navigation
  set preferences = jsonb_set(v_preferences, '{categories}', v_categories || jsonb_build_array(jsonb_build_object('key', v_key, 'title', v_title))),
      updated_by = p_actor_user_id, updated_at = now()
  where organization_id = p_organization_id;
  return jsonb_build_object('key', v_key, 'title', v_title);
end $$;
revoke all on function app_private.admin_create_customer_document_category(uuid,uuid,text) from public, anon, authenticated;
grant execute on function app_private.admin_create_customer_document_category(uuid,uuid,text) to service_role;
