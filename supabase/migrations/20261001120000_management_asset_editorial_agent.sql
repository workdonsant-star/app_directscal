-- Fluxo editorial dos ativos de gestão, busca híbrida em português,
-- auditoria multicanal do agente e instalação do Slack por organização.

create extension if not exists unaccent with schema extensions;
create extension if not exists vector with schema extensions;

-- Configuração textual em português sem acentos: "aprovação" e "aprovacao"
-- produzem o mesmo lexema, e "descontos" encontra "desconto".
do $$
begin
  create text search configuration public.pt_unaccent (copy = pg_catalog.portuguese);
exception
  when duplicate_object or unique_violation then null;
end
$$;

alter text search configuration public.pt_unaccent
  alter mapping for hword, hword_part, word
  with extensions.unaccent, pg_catalog.portuguese_stem;

-- Estado editorial de cada versão. O estado do ativo continua indicando o que
-- o cliente enxerga; o rascunho em revisão vive na versão.
do $$
begin
  create type public.management_asset_version_status as enum (
    'rascunho',
    'em_revisao',
    'pronto_para_publicar',
    'publicado',
    'substituido'
  );
exception
  when duplicate_object then null;
end
$$;

alter table public.management_assets
  add column if not exists category text
    check (category is null or char_length(trim(category)) between 1 and 80),
  add column if not exists review_cycle text
    check (review_cycle is null or char_length(trim(review_cycle)) between 1 and 80);

alter table public.management_asset_versions
  add column if not exists review_status public.management_asset_version_status
    not null default 'rascunho',
  add column if not exists updated_at timestamptz not null default now();

update public.management_asset_versions version
set review_status = case
  when version.published_at is null then 'rascunho'::public.management_asset_version_status
  when exists (
    select 1
    from public.management_assets asset
    where asset.current_published_version_id = version.id
  ) then 'publicado'::public.management_asset_version_status
  else 'substituido'::public.management_asset_version_status
end;

create unique index if not exists management_asset_versions_single_draft_idx
  on public.management_asset_versions (asset_id)
  where published_at is null;

drop trigger if exists management_asset_versions_touch_updated_at
  on public.management_asset_versions;
create trigger management_asset_versions_touch_updated_at
before update on public.management_asset_versions
for each row execute function app_private.touch_updated_at();

-- Uma versão publicada é imutável: somente a marcação de substituição muda.
create or replace function app_private.guard_published_asset_version()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if old.published_at is not null and (
    new.content is distinct from old.content
    or new.version_number is distinct from old.version_number
    or new.asset_id is distinct from old.asset_id
    or new.organization_id is distinct from old.organization_id
    or new.published_at is distinct from old.published_at
  ) then
    raise exception 'Versões publicadas não podem ser alteradas.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists management_asset_versions_guard_published
  on public.management_asset_versions;
create trigger management_asset_versions_guard_published
before update on public.management_asset_versions
for each row execute function app_private.guard_published_asset_version();

-- Trechos: índice textual em português e vetor semântico opcional.
alter table public.management_asset_chunks
  drop column if exists content_tsv;

alter table public.management_asset_chunks
  add column content_tsv tsvector generated always as (
    to_tsvector(
      'public.pt_unaccent'::regconfig,
      coalesce(heading_path, '') || ' ' || coalesce(content, '')
    )
  ) stored,
  add column if not exists embedding extensions.vector(768),
  add column if not exists embedding_model text;

create index if not exists management_asset_chunks_tsv_idx
  on public.management_asset_chunks using gin (content_tsv);

create index if not exists management_asset_chunks_embedding_idx
  on public.management_asset_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- Auditoria multicanal do agente.
alter table public.asset_question_audits
  add column if not exists channel text not null default 'app'
    check (channel in ('app', 'slack')),
  add column if not exists external_user_id text,
  add column if not exists citations jsonb not null default '[]'::jsonb,
  add column if not exists provider text,
  add column if not exists model text;

alter table public.asset_answer_feedback
  add column if not exists external_user_id text;

create unique index if not exists asset_answer_feedback_user_unique_idx
  on public.asset_answer_feedback (question_audit_id, user_id)
  where user_id is not null;

create unique index if not exists asset_answer_feedback_external_unique_idx
  on public.asset_answer_feedback (question_audit_id, external_user_id)
  where external_user_id is not null;

create index if not exists asset_question_audits_status_created_idx
  on public.asset_question_audits (answer_status, created_at desc);

-- Publicação transacional: grava os trechos, marca a versão como vigente,
-- substitui a anterior e remove os trechos que deixaram de valer.
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

  if v_version.review_status <> 'pronto_para_publicar' then
    raise exception 'Conclua a revisão antes de publicar.' using errcode = '22023';
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

-- A busca antiga exigia todas as palavras da pergunta no mesmo trecho.
drop function if exists public.search_management_asset_chunks(text, integer);
drop function if exists public.search_management_asset_chunks_for_organization(text, uuid, integer);

-- Busca híbrida (texto + vetor) fundida por Reciprocal Rank Fusion. A
-- organização e a versão vigente são filtradas antes de qualquer ranking.
create or replace function public.search_management_asset_chunks_for_organization(
  query_text text,
  target_organization_id uuid,
  result_limit integer default 6,
  query_embedding extensions.vector(768) default null,
  query_embedding_model text default null
)
returns table (
  chunk_id uuid,
  asset_id uuid,
  version_id uuid,
  asset_type public.management_asset_type,
  title text,
  heading_path text,
  content text,
  version_number text,
  published_at timestamptz,
  text_rank real,
  vector_similarity real,
  score double precision
)
language sql
stable
security definer
set search_path = public, extensions, pg_catalog
as $$
  with params as (
    select
      nullif(
        replace(
          plainto_tsquery('public.pt_unaccent'::regconfig, coalesce(query_text, ''))::text,
          ' & ',
          ' | '
        ),
        ''
      ) as query_string
  ),
  eligible as (
    select
      chunk.id,
      chunk.asset_id,
      chunk.version_id,
      chunk.ordinal,
      chunk.heading_path,
      chunk.content,
      chunk.content_tsv,
      chunk.embedding,
      chunk.embedding_model,
      asset.type,
      asset.title,
      version.version_number,
      version.published_at
    from public.management_asset_chunks chunk
    join public.management_assets asset
      on asset.id = chunk.asset_id
     and asset.organization_id = chunk.organization_id
    join public.management_asset_versions version
      on version.id = chunk.version_id
     and version.organization_id = chunk.organization_id
    where target_organization_id is not null
      and chunk.organization_id = target_organization_id
      and asset.status = 'publicado'
      and asset.archived_at is null
      and asset.current_published_version_id = version.id
      and version.published_at is not null
      and version.index_status = 'pronto'
  ),
  text_hits as (
    select
      eligible.id,
      ts_rank_cd(eligible.content_tsv, params.query_string::tsquery) as rank
    from eligible, params
    where params.query_string is not null
      and eligible.content_tsv @@ params.query_string::tsquery
    order by rank desc
    limit 30
  ),
  text_ranked as (
    select id, rank, row_number() over (order by rank desc) as position
    from text_hits
  ),
  vector_hits as (
    select
      eligible.id,
      (1 - (eligible.embedding <=> query_embedding))::real as similarity
    from eligible
    where query_embedding is not null
      and eligible.embedding is not null
      and eligible.embedding_model = query_embedding_model
    order by eligible.embedding <=> query_embedding
    limit 30
  ),
  vector_ranked as (
    select id, similarity, row_number() over (order by similarity desc) as position
    from vector_hits
  ),
  fused as (
    select
      coalesce(text_ranked.id, vector_ranked.id) as id,
      text_ranked.rank as text_rank,
      vector_ranked.similarity as vector_similarity,
      coalesce(1.0 / (60 + text_ranked.position), 0)
        + coalesce(1.0 / (60 + vector_ranked.position), 0) as score
    from text_ranked
    full outer join vector_ranked on vector_ranked.id = text_ranked.id
  )
  select
    eligible.id,
    eligible.asset_id,
    eligible.version_id,
    eligible.type,
    eligible.title,
    eligible.heading_path,
    eligible.content,
    eligible.version_number,
    eligible.published_at,
    fused.text_rank,
    fused.vector_similarity,
    fused.score
  from fused
  join eligible on eligible.id = fused.id
  order by fused.score desc, eligible.ordinal asc
  limit least(greatest(coalesce(result_limit, 6), 1), 20);
$$;

revoke all on function public.search_management_asset_chunks_for_organization(
  text, uuid, integer, extensions.vector, text
) from public, anon, authenticated;
grant execute on function public.search_management_asset_chunks_for_organization(
  text, uuid, integer, extensions.vector, text
) to service_role;

comment on function public.search_management_asset_chunks_for_organization(
  text, uuid, integer, extensions.vector, text
) is
  'Busca híbrida server-side em trechos da versão vigente, sempre limitada à organização informada.';

-- Slack: cada workspace instalado pertence a uma única organização. O token
-- do bot fica em schema privado, acessível somente pela service role.
create table if not exists app_private.slack_installations (
  team_id text primary key check (char_length(trim(team_id)) between 1 and 64),
  team_name text,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  bot_user_id text,
  bot_token text not null,
  scope text,
  installed_by_user_id uuid references next_auth.users(id) on delete set null,
  installed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists slack_installations_organization_idx
  on app_private.slack_installations (organization_id)
  where revoked_at is null;

drop trigger if exists slack_installations_touch_updated_at
  on app_private.slack_installations;
create trigger slack_installations_touch_updated_at
before update on app_private.slack_installations
for each row execute function app_private.touch_updated_at();

-- Recibos para descartar reenvios do mesmo evento.
create table if not exists app_private.slack_event_receipts (
  event_id text primary key,
  team_id text,
  received_at timestamptz not null default now()
);

create index if not exists slack_event_receipts_received_idx
  on app_private.slack_event_receipts (received_at);

alter table app_private.slack_installations enable row level security;
alter table app_private.slack_event_receipts enable row level security;

revoke all on app_private.slack_installations, app_private.slack_event_receipts
from public, anon, authenticated;
grant all on app_private.slack_installations, app_private.slack_event_receipts
to service_role;

notify pgrst, 'reload schema';
