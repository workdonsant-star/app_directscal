do $$
begin
  create type public.management_asset_type as enum (
    'sop',
    'playbook',
    'politica',
    'governanca',
    'raci',
    'checklist',
    'criterio_qualidade',
    'template',
    'outro'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.management_asset_status as enum (
    'rascunho',
    'em_revisao',
    'pronto_para_publicar',
    'publicado',
    'arquivado'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.management_asset_content_format as enum (
    'markdown',
    'json'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.management_asset_index_status as enum (
    'pendente',
    'processando',
    'pronto',
    'erro'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.asset_question_status as enum (
    'respondida',
    'insuficiente',
    'erro'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.asset_answer_feedback_value as enum ('util', 'nao_util');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.management_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type public.management_asset_type not null,
  title text not null check (char_length(trim(title)) between 1 and 240),
  description text,
  owner_person_id uuid,
  owner_label text,
  status public.management_asset_status not null default 'rascunho',
  current_published_version_id uuid,
  created_by_user_id uuid references next_auth.users(id) on delete set null,
  assigned_specialist_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (id, organization_id)
);

create table if not exists public.management_asset_versions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  version_number text not null check (char_length(trim(version_number)) between 1 and 32),
  content_format public.management_asset_content_format not null,
  content jsonb not null,
  summary text,
  change_note text,
  created_by_user_id uuid references next_auth.users(id) on delete set null,
  reviewed_by_user_id uuid references next_auth.users(id) on delete set null,
  published_by_user_id uuid references next_auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  published_at timestamptz,
  index_status public.management_asset_index_status not null default 'pendente',
  index_error text,
  unique (id, organization_id),
  unique (asset_id, version_number),
  foreign key (asset_id, organization_id)
    references public.management_assets(id, organization_id) on delete cascade,
  check ((published_at is null) or (index_status = 'pronto'))
);

alter table public.management_assets
  drop constraint if exists management_assets_current_version_fkey;

alter table public.management_assets
  add constraint management_assets_current_version_fkey
  foreign key (current_published_version_id, organization_id)
  references public.management_asset_versions(id, organization_id)
  on delete set null;

create table if not exists public.management_asset_scopes (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scope_type text not null check (scope_type in ('organizacao', 'setor', 'papel', 'pessoa')),
  sector_id uuid references public.organization_sectors(id) on delete cascade,
  person_id uuid references public.organization_people(id) on delete cascade,
  role text,
  created_at timestamptz not null default now(),
  foreign key (asset_id, organization_id)
    references public.management_assets(id, organization_id) on delete cascade,
  check (
    (scope_type = 'organizacao' and sector_id is null and person_id is null and role is null)
    or (scope_type = 'setor' and sector_id is not null and person_id is null and role is null)
    or (scope_type = 'papel' and sector_id is null and person_id is null and role is not null)
    or (scope_type = 'pessoa' and person_id is not null and sector_id is null and role is null)
  )
);

create table if not exists public.management_asset_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null,
  version_id uuid not null,
  ordinal integer not null check (ordinal >= 0),
  heading_path text not null,
  content text not null check (char_length(trim(content)) > 0),
  content_tsv tsvector generated always as (
    to_tsvector('simple', coalesce(heading_path, '') || ' ' || coalesce(content, ''))
  ) stored,
  token_count integer not null default 0 check (token_count >= 0),
  created_at timestamptz not null default now(),
  foreign key (asset_id, organization_id)
    references public.management_assets(id, organization_id) on delete cascade,
  foreign key (version_id, organization_id)
    references public.management_asset_versions(id, organization_id) on delete cascade,
  unique (version_id, ordinal)
);

create table if not exists public.asset_question_audits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references next_auth.users(id) on delete set null,
  question text not null check (char_length(trim(question)) between 1 and 2000),
  answer text not null,
  answer_status public.asset_question_status not null,
  confidence text not null check (confidence in ('alta', 'media', 'insuficiente')),
  source_version_ids uuid[] not null default '{}',
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.asset_answer_feedback (
  id uuid primary key default gen_random_uuid(),
  question_audit_id uuid not null references public.asset_question_audits(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references next_auth.users(id) on delete set null,
  value public.asset_answer_feedback_value not null,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists management_assets_org_status_idx
  on public.management_assets (organization_id, status, updated_at desc);

create index if not exists management_asset_versions_current_idx
  on public.management_asset_versions (asset_id, published_at desc)
  where published_at is not null;

create index if not exists management_asset_chunks_tsv_idx
  on public.management_asset_chunks using gin (content_tsv);

create index if not exists management_asset_chunks_org_version_idx
  on public.management_asset_chunks (organization_id, version_id, ordinal);

create index if not exists asset_question_audits_org_created_idx
  on public.asset_question_audits (organization_id, created_at desc);

create index if not exists asset_answer_feedback_org_created_idx
  on public.asset_answer_feedback (organization_id, created_at desc);

drop trigger if exists management_assets_touch_updated_at on public.management_assets;
create trigger management_assets_touch_updated_at
before update on public.management_assets
for each row execute function app_private.touch_updated_at();

alter table public.management_assets enable row level security;
alter table public.management_asset_versions enable row level security;
alter table public.management_asset_scopes enable row level security;
alter table public.management_asset_chunks enable row level security;
alter table public.asset_question_audits enable row level security;
alter table public.asset_answer_feedback enable row level security;

drop policy if exists management_assets_member_select_published on public.management_assets;
create policy management_assets_member_select_published
on public.management_assets
for select
to authenticated
using (
  status = 'publicado'
  and app_private.is_org_member(organization_id)
);

drop policy if exists management_asset_versions_member_select_published on public.management_asset_versions;
create policy management_asset_versions_member_select_published
on public.management_asset_versions
for select
to authenticated
using (
  published_at is not null
  and index_status = 'pronto'
  and exists (
    select 1
    from public.management_assets asset
    where asset.id = management_asset_versions.asset_id
      and asset.organization_id = management_asset_versions.organization_id
      and asset.current_published_version_id = management_asset_versions.id
      and asset.status = 'publicado'
      and app_private.is_org_member(asset.organization_id)
  )
);

drop policy if exists management_asset_scopes_member_select_published on public.management_asset_scopes;
create policy management_asset_scopes_member_select_published
on public.management_asset_scopes
for select
to authenticated
using (
  app_private.is_org_member(organization_id)
  and exists (
    select 1
    from public.management_assets asset
    where asset.id = management_asset_scopes.asset_id
      and asset.organization_id = management_asset_scopes.organization_id
      and asset.status = 'publicado'
  )
);

drop policy if exists management_asset_chunks_member_select_published on public.management_asset_chunks;
create policy management_asset_chunks_member_select_published
on public.management_asset_chunks
for select
to authenticated
using (
  exists (
    select 1
    from public.management_asset_versions version
    join public.management_assets asset
      on asset.id = version.asset_id
     and asset.organization_id = version.organization_id
    where version.id = management_asset_chunks.version_id
      and version.organization_id = management_asset_chunks.organization_id
      and version.published_at is not null
      and version.index_status = 'pronto'
      and asset.current_published_version_id = version.id
      and asset.status = 'publicado'
      and app_private.is_org_member(asset.organization_id)
  )
);

drop policy if exists asset_question_audits_member_select on public.asset_question_audits;
create policy asset_question_audits_member_select
on public.asset_question_audits
for select
to authenticated
using (app_private.is_org_member(organization_id));

drop policy if exists asset_answer_feedback_member_select on public.asset_answer_feedback;
create policy asset_answer_feedback_member_select
on public.asset_answer_feedback
for select
to authenticated
using (app_private.is_org_member(organization_id));

drop policy if exists asset_answer_feedback_member_insert on public.asset_answer_feedback;
create policy asset_answer_feedback_member_insert
on public.asset_answer_feedback
for insert
to authenticated
with check (
  user_id = next_auth.uid()
  and app_private.is_org_member(organization_id)
  and exists (
    select 1
    from public.asset_question_audits audit
    where audit.id = asset_answer_feedback.question_audit_id
      and audit.organization_id = asset_answer_feedback.organization_id
  )
);

revoke all on table
  public.management_assets,
  public.management_asset_versions,
  public.management_asset_scopes,
  public.management_asset_chunks,
  public.asset_question_audits,
  public.asset_answer_feedback
from public, anon, authenticated;

grant select on table
  public.management_assets,
  public.management_asset_versions,
  public.management_asset_scopes,
  public.management_asset_chunks,
  public.asset_question_audits,
  public.asset_answer_feedback
to authenticated;

grant insert on table public.asset_answer_feedback to authenticated;

grant all on table
  public.management_assets,
  public.management_asset_versions,
  public.management_asset_scopes,
  public.management_asset_chunks,
  public.asset_question_audits,
  public.asset_answer_feedback
to service_role;

create or replace function public.search_management_asset_chunks(
  query_text text,
  result_limit integer default 8
)
returns table (
  chunk_id uuid,
  asset_id uuid,
  version_id uuid,
  title text,
  heading_path text,
  content text,
  version_number text,
  published_at timestamptz,
  rank real
)
language sql
stable
as $$
  select
    chunk.id,
    chunk.asset_id,
    chunk.version_id,
    asset.title,
    chunk.heading_path,
    chunk.content,
    version.version_number,
    version.published_at,
    ts_rank_cd(chunk.content_tsv, websearch_to_tsquery('simple', query_text)) as rank
  from public.management_asset_chunks chunk
  join public.management_assets asset
    on asset.id = chunk.asset_id
   and asset.organization_id = chunk.organization_id
  join public.management_asset_versions version
    on version.id = chunk.version_id
   and version.organization_id = chunk.organization_id
  where nullif(trim(query_text), '') is not null
    and chunk.content_tsv @@ websearch_to_tsquery('simple', query_text)
    and asset.status = 'publicado'
    and asset.current_published_version_id = version.id
    and version.published_at is not null
    and version.index_status = 'pronto'
    and app_private.is_org_member(asset.organization_id)
  order by rank desc, chunk.ordinal asc
  limit least(greatest(coalesce(result_limit, 8), 1), 20);
$$;

revoke all on function public.search_management_asset_chunks(text, integer)
from public, anon, authenticated;
grant execute on function public.search_management_asset_chunks(text, integer)
to authenticated;

create or replace function public.search_management_asset_chunks_for_organization(
  query_text text,
  target_organization_id uuid,
  result_limit integer default 8
)
returns table (
  chunk_id uuid,
  asset_id uuid,
  version_id uuid,
  title text,
  heading_path text,
  content text,
  version_number text,
  published_at timestamptz,
  rank real
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select
    chunk.id,
    chunk.asset_id,
    chunk.version_id,
    asset.title,
    chunk.heading_path,
    chunk.content,
    version.version_number,
    version.published_at,
    ts_rank_cd(chunk.content_tsv, websearch_to_tsquery('simple', query_text)) as rank
  from public.management_asset_chunks chunk
  join public.management_assets asset
    on asset.id = chunk.asset_id
   and asset.organization_id = chunk.organization_id
  join public.management_asset_versions version
    on version.id = chunk.version_id
   and version.organization_id = chunk.organization_id
  where nullif(trim(query_text), '') is not null
    and target_organization_id is not null
    and chunk.organization_id = target_organization_id
    and chunk.content_tsv @@ websearch_to_tsquery('simple', query_text)
    and asset.status = 'publicado'
    and asset.current_published_version_id = version.id
    and version.published_at is not null
    and version.index_status = 'pronto'
  order by rank desc, chunk.ordinal asc
  limit least(greatest(coalesce(result_limit, 8), 1), 20);
$$;

revoke all on function public.search_management_asset_chunks_for_organization(text, uuid, integer)
from public, anon, authenticated;
grant execute on function public.search_management_asset_chunks_for_organization(text, uuid, integer)
to service_role;

comment on table public.management_asset_chunks is
  'Trechos derivados de versões publicadas para busca textual do agente de consulta.';

comment on function public.search_management_asset_chunks(text, integer) is
  'Busca textual autorizada em trechos da versão publicada vigente de ativos da organização do usuário.';

comment on function public.search_management_asset_chunks_for_organization(text, uuid, integer) is
  'Busca textual server-side, explicitamente limitada à organização configurada para um adaptador externo como o Slack.';
