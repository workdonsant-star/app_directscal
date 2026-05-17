create extension if not exists pgcrypto;

create schema if not exists next_auth;
create schema if not exists app_private;

grant usage on schema next_auth to service_role;
grant usage on schema app_private to authenticated, service_role;
grant all on schema next_auth to postgres;

create type public.auth_role as enum ('superadmin', 'admin', 'cliente');
create type public.diagnostic_status as enum ('rascunho', 'ativo', 'encerrado');
create type public.respondent_group as enum ('fundador', 'lideranca', 'operacao');
create type public.response_session_status as enum ('iniciado', 'concluido');

create table if not exists next_auth.users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  "emailVerified" timestamptz,
  image text
);

create table if not exists next_auth.sessions (
  id uuid primary key default gen_random_uuid(),
  expires timestamptz not null,
  "sessionToken" text not null unique,
  "userId" uuid references next_auth.users(id) on delete cascade
);

create table if not exists next_auth.accounts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  oauth_token_secret text,
  oauth_token text,
  "userId" uuid references next_auth.users(id) on delete cascade,
  unique(provider, "providerAccountId")
);

create table if not exists next_auth.verification_tokens (
  identifier text,
  token text primary key,
  expires timestamptz not null,
  unique(token),
  unique(token, identifier)
);

grant all on all tables in schema next_auth to postgres;
grant all on all tables in schema next_auth to service_role;

create or replace function next_auth.uid()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  employee_count integer not null default 1 check (employee_count > 0),
  domain text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references next_auth.users(id) on delete cascade,
  role public.auth_role not null default 'cliente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, user_id)
);

create table if not exists public.diagnostic_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  version integer not null,
  name text not null,
  description text not null,
  is_locked boolean not null default true,
  created_at timestamptz not null default now(),
  unique(slug, version)
);

create table if not exists public.dimensions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  number integer not null check (number between 1 and 6),
  name text not null,
  short_name text not null,
  question text not null,
  description text not null
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.diagnostic_templates(id) on delete restrict,
  dimension_id uuid not null references public.dimensions(id) on delete restrict,
  order_index integer not null check (order_index > 0),
  text text not null,
  is_locked boolean not null default true,
  unique(template_id, dimension_id, order_index)
);

create table if not exists public.likert_scale_points (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.diagnostic_templates(id) on delete restrict,
  value integer not null check (value between 1 and 5),
  label text not null,
  unique(template_id, value)
);

create table if not exists public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  template_id uuid not null references public.diagnostic_templates(id) on delete restrict,
  name text not null,
  description text,
  status public.diagnostic_status not null default 'rascunho',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz,
  closed_at timestamptz,
  deadline date,
  general_score numeric(3, 2) check (general_score is null or general_score between 1 and 5)
);

create table if not exists public.diagnostic_share_links (
  id uuid primary key default gen_random_uuid(),
  diagnostic_id uuid not null references public.diagnostics(id) on delete cascade,
  group_id public.respondent_group not null,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  unique(diagnostic_id, group_id)
);

create table if not exists public.respondents (
  id uuid primary key default gen_random_uuid(),
  diagnostic_id uuid not null references public.diagnostics(id) on delete cascade,
  group_id public.respondent_group not null,
  name text not null,
  email text not null,
  normalized_email text generated always as (lower(trim(email))) stored,
  role text not null,
  created_at timestamptz not null default now(),
  unique(diagnostic_id, group_id, normalized_email)
);

create table if not exists public.response_sessions (
  id uuid primary key default gen_random_uuid(),
  diagnostic_id uuid not null references public.diagnostics(id) on delete cascade,
  respondent_id uuid not null references public.respondents(id) on delete cascade,
  share_link_id uuid not null references public.diagnostic_share_links(id) on delete restrict,
  group_id public.respondent_group not null,
  status public.response_session_status not null default 'iniciado',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  unique(respondent_id)
);

create table if not exists public.likert_answers (
  id uuid primary key default gen_random_uuid(),
  response_session_id uuid not null references public.response_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  value integer not null check (value between 1 and 5),
  created_at timestamptz not null default now(),
  unique(response_session_id, question_id)
);

create or replace function app_private.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app_private.prevent_locked_omdx_template_changes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' and old.is_locked then
    raise exception 'Locked OMDx template rows cannot be deleted';
  end if;

  if tg_op = 'UPDATE' and old.is_locked then
    raise exception 'Locked OMDx template rows cannot be updated';
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function app_private.prevent_locked_omdx_question_changes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' and old.is_locked then
    raise exception 'Locked OMDx question rows cannot be deleted';
  end if;

  if tg_op = 'UPDATE' and old.is_locked then
    raise exception 'Locked OMDx question rows cannot be updated';
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function app_private.prevent_locked_omdx_scale_changes()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.diagnostic_templates dt
    where dt.id = old.template_id
      and dt.is_locked
  ) then
    raise exception 'Locked OMDx scale rows cannot be changed';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists diagnostic_templates_prevent_locked_changes on public.diagnostic_templates;
create trigger diagnostic_templates_prevent_locked_changes
before update or delete on public.diagnostic_templates
for each row execute function app_private.prevent_locked_omdx_template_changes();

drop trigger if exists questions_prevent_locked_changes on public.questions;
create trigger questions_prevent_locked_changes
before update or delete on public.questions
for each row execute function app_private.prevent_locked_omdx_question_changes();

drop trigger if exists likert_scale_points_prevent_locked_changes on public.likert_scale_points;
create trigger likert_scale_points_prevent_locked_changes
before update or delete on public.likert_scale_points
for each row execute function app_private.prevent_locked_omdx_scale_changes();

drop trigger if exists organizations_touch_updated_at on public.organizations;
create trigger organizations_touch_updated_at
before update on public.organizations
for each row execute function app_private.touch_updated_at();

drop trigger if exists organization_members_touch_updated_at on public.organization_members;
create trigger organization_members_touch_updated_at
before update on public.organization_members
for each row execute function app_private.touch_updated_at();

drop trigger if exists diagnostics_touch_updated_at on public.diagnostics;
create trigger diagnostics_touch_updated_at
before update on public.diagnostics
for each row execute function app_private.touch_updated_at();

create or replace function app_private.is_superadmin()
returns boolean
language sql
security definer
set search_path = public, next_auth, pg_temp
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.user_id = next_auth.uid()
      and om.role = 'superadmin'
  )
$$;

create or replace function app_private.is_org_member(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public, next_auth, pg_temp
as $$
  select app_private.is_superadmin()
    or exists (
      select 1
      from public.organization_members om
      where om.organization_id = target_organization_id
        and om.user_id = next_auth.uid()
    )
$$;

create or replace function app_private.can_access_diagnostic(target_diagnostic_id uuid)
returns boolean
language sql
security definer
set search_path = public, next_auth, pg_temp
as $$
  select app_private.is_superadmin()
    or exists (
      select 1
      from public.diagnostics d
      where d.id = target_diagnostic_id
        and app_private.is_org_member(d.organization_id)
    )
$$;

grant execute on all functions in schema app_private to authenticated, service_role;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.diagnostic_templates enable row level security;
alter table public.dimensions enable row level security;
alter table public.questions enable row level security;
alter table public.likert_scale_points enable row level security;
alter table public.diagnostics enable row level security;
alter table public.diagnostic_share_links enable row level security;
alter table public.respondents enable row level security;
alter table public.response_sessions enable row level security;
alter table public.likert_answers enable row level security;

grant usage on schema public to authenticated, service_role;
grant select on public.diagnostic_templates, public.dimensions, public.questions, public.likert_scale_points to authenticated;
grant select, insert, update, delete on
  public.organizations,
  public.organization_members,
  public.diagnostics,
  public.diagnostic_share_links,
  public.respondents,
  public.response_sessions,
  public.likert_answers
to authenticated;
grant all on all tables in schema public to service_role;

create policy organizations_member_select on public.organizations
for select using (app_private.is_org_member(id));

create policy organizations_member_update on public.organizations
for update using (app_private.is_org_member(id))
with check (app_private.is_org_member(id));

create policy organization_members_member_select on public.organization_members
for select using (app_private.is_org_member(organization_id));

create policy organization_members_admin_write on public.organization_members
for all using (app_private.is_superadmin())
with check (app_private.is_superadmin());

create policy diagnostic_templates_read on public.diagnostic_templates
for select using (true);

create policy dimensions_read on public.dimensions
for select using (true);

create policy questions_read on public.questions
for select using (true);

create policy likert_scale_points_read on public.likert_scale_points
for select using (true);

create policy diagnostics_member_select on public.diagnostics
for select using (app_private.is_org_member(organization_id));

create policy diagnostics_member_insert on public.diagnostics
for insert with check (app_private.is_org_member(organization_id));

create policy diagnostics_member_update on public.diagnostics
for update using (app_private.is_org_member(organization_id))
with check (app_private.is_org_member(organization_id));

create policy diagnostics_member_delete on public.diagnostics
for delete using (app_private.is_org_member(organization_id));

create policy diagnostic_share_links_member_select on public.diagnostic_share_links
for select using (app_private.can_access_diagnostic(diagnostic_id));

create policy diagnostic_share_links_member_write on public.diagnostic_share_links
for all using (app_private.can_access_diagnostic(diagnostic_id))
with check (app_private.can_access_diagnostic(diagnostic_id));

create policy respondents_member_select on public.respondents
for select using (app_private.can_access_diagnostic(diagnostic_id));

create policy respondents_member_write on public.respondents
for all using (app_private.can_access_diagnostic(diagnostic_id))
with check (app_private.can_access_diagnostic(diagnostic_id));

create policy response_sessions_member_select on public.response_sessions
for select using (app_private.can_access_diagnostic(diagnostic_id));

create policy response_sessions_member_write on public.response_sessions
for all using (app_private.can_access_diagnostic(diagnostic_id))
with check (app_private.can_access_diagnostic(diagnostic_id));

create policy likert_answers_member_select on public.likert_answers
for select using (
  exists (
    select 1
    from public.response_sessions rs
    where rs.id = response_session_id
      and app_private.can_access_diagnostic(rs.diagnostic_id)
  )
);

create policy likert_answers_member_write on public.likert_answers
for all using (
  exists (
    select 1
    from public.response_sessions rs
    where rs.id = response_session_id
      and app_private.can_access_diagnostic(rs.diagnostic_id)
  )
)
with check (
  exists (
    select 1
    from public.response_sessions rs
    where rs.id = response_session_id
      and app_private.can_access_diagnostic(rs.diagnostic_id)
  )
);

insert into public.diagnostic_templates (id, slug, version, name, description, is_locked)
values (
  '00000000-0000-4000-8000-000000000001',
  'omdx-v1',
  1,
  'OMDx padrão',
  'Diagnóstico de maturidade operacional com seis dimensões e escala Likert de 1 a 5.',
  true
)
on conflict (slug, version) do nothing;

insert into public.dimensions (id, slug, number, name, short_name, question, description)
values
  ('00000000-0000-4000-8000-000000000101', 'cultura', 1, 'Cultura e Segurança Psicológica', 'Cultura', 'A organização cria condições para o time levantar problemas, discordar e propor sem custo político?', 'Avalia o quanto o ambiente permite voz, dissenso e aprendizado sem retaliação.'),
  ('00000000-0000-4000-8000-000000000102', 'visao', 2, 'Visão e Alinhamento Estratégico', 'Visão', 'A direção entende para onde a empresa vai e isso chega claro a quem executa?', 'Avalia clareza de propósito, prioridades estratégicas e cascata para a operação.'),
  ('00000000-0000-4000-8000-000000000103', 'comunicacao', 3, 'Comunicação e Gestão do Trabalho', 'Comunicação', 'A informação certa chega na hora certa para quem precisa decidir e executar?', 'Avalia rituais, fluxo de informação e governança do trabalho em curso.'),
  ('00000000-0000-4000-8000-000000000104', 'processos', 4, 'Processos e Execução Operacional', 'Processos', 'A operação entrega de forma repetível, previsível e independente de improviso?', 'Avalia repetibilidade, padronização e dependência de pessoas-chave.'),
  ('00000000-0000-4000-8000-000000000105', 'lideranca', 5, 'Liderança, Delegação e Autonomia', 'Liderança', 'A liderança consegue delegar com clareza e o time consegue executar com autonomia?', 'Avalia maturidade de delegação, accountability e desenvolvimento de líderes.'),
  ('00000000-0000-4000-8000-000000000106', 'performance', 6, 'Performance, Prioridade e Foco', 'Performance', 'A organização sabe o que é prioritário e protege o foco de quem executa?', 'Avalia gestão de prioridades, foco e cultura de resultado.')
on conflict (slug) do nothing;

insert into public.likert_scale_points (template_id, value, label)
values
  ('00000000-0000-4000-8000-000000000001', 1, 'Discordo totalmente'),
  ('00000000-0000-4000-8000-000000000001', 2, 'Discordo parcialmente'),
  ('00000000-0000-4000-8000-000000000001', 3, 'Nem concordo nem discordo'),
  ('00000000-0000-4000-8000-000000000001', 4, 'Concordo parcialmente'),
  ('00000000-0000-4000-8000-000000000001', 5, 'Concordo totalmente')
on conflict (template_id, value) do nothing;

insert into public.questions (template_id, dimension_id, order_index, text, is_locked)
values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 1, 'Problemas relevantes podem ser levantados sem custo político.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 2, 'O time consegue discordar de decisões quando identifica risco operacional.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 3, 'Erros recorrentes são tratados como aprendizado e não como culpa individual.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 4, 'Feedbacks são dados com clareza suficiente para melhorar comportamento e execução.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 5, 'As pessoas pedem ajuda antes que o problema vire urgência.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 1, 'A direção comunica prioridades de forma clara para todos os níveis.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 2, 'Cada área entende como seu trabalho contribui para os objetivos da empresa.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 3, 'As metas de curto prazo estão conectadas à visão de médio prazo.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 4, 'Mudanças de prioridade são explicadas com contexto suficiente.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 5, 'O time consegue tomar decisões sem depender de alinhamentos excessivos.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 1, 'As informações necessárias chegam a tempo para decisão e execução.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 2, 'Reuniões têm pauta, decisão registrada e próximo passo definido.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 3, 'Áreas diferentes mantêm alinhamento sem depender de conversas informais.', true)
on conflict (template_id, dimension_id, order_index) do nothing;

insert into public.questions (template_id, dimension_id, order_index, text, is_locked)
values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 4, 'Responsáveis por decisões importantes são claros para o time.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 5, 'Bloqueios de comunicação são tratados antes de impactar entrega.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104', 1, 'Os processos críticos estão documentados em um nível útil para execução.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104', 2, 'A operação consegue repetir entregas sem depender de improviso.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104', 3, 'Gargalos são identificados com dados e tratados de forma recorrente.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104', 4, 'Ferramentas e rituais sustentam o trabalho sem criar burocracia excessiva.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104', 5, 'A empresa reduz dependência de pessoas-chave nos fluxos principais.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000105', 1, 'A liderança delega com contexto, critério de sucesso e autonomia.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000105', 2, 'Gestores acompanham execução sem centralizar todas as decisões.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000105', 3, 'O time recebe suporte antes que problemas de execução escalem.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000105', 4, 'Responsabilidades entre líderes e operação são claras no dia a dia.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000105', 5, 'Líderes desenvolvem capacidade do time, não apenas cobram entrega.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000106', 1, 'Métricas de sucesso são conhecidas por quem executa o trabalho.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000106', 2, 'Prioridades são protegidas quando surgem demandas paralelas.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000106', 3, 'A empresa acompanha resultado com cadência suficiente para corrigir rota.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000106', 4, 'Reconhecimento e cobrança estão conectados a entregas objetivas.', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000106', 5, 'O foco operacional é preservado nos ciclos de maior pressão.', true)
on conflict (template_id, dimension_id, order_index) do nothing;
