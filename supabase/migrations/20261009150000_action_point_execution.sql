-- Execução dos action points publicados: quem toca cada ação (pessoa do Slack),
-- em que etapa está e o histórico de mudanças. O catálogo e a seleção continuam
-- em public.admin_deliveries; esta tabela só guarda o que o cliente define.

create table if not exists public.action_point_assignments (
  diagnostic_id uuid not null references public.diagnostics(id) on delete cascade,
  action_point_id text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assignee_team_id text not null,
  assignee_slack_user_id text not null,
  assignee_name text not null,
  assignee_avatar_url text,
  stage text not null default 'atribuido'
    check (stage in ('atribuido', 'em_implementacao', 'bloqueado', 'concluido')),
  starts_on date,
  due_on date,
  cadence text not null default 'semanal'
    check (cadence in ('semanal', 'quinzenal', 'mensal')),
  progress smallint not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (diagnostic_id, action_point_id),
  constraint action_point_assignments_dates_check
    check (starts_on is null or due_on is null or due_on >= starts_on)
);

create index if not exists action_point_assignments_organization_idx
  on public.action_point_assignments (organization_id);

drop trigger if exists action_point_assignments_touch_updated_at
  on public.action_point_assignments;
create trigger action_point_assignments_touch_updated_at
before update on public.action_point_assignments
for each row execute function app_private.touch_updated_at();

create table if not exists public.action_point_events (
  id uuid primary key default gen_random_uuid(),
  diagnostic_id uuid not null references public.diagnostics(id) on delete cascade,
  action_point_id text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  -- 'resposta' é reservado para as respostas do líder ao agente no Slack.
  kind text not null
    check (kind in ('atribuicao', 'etapa', 'prazo', 'andamento', 'nota', 'resposta')),
  author_name text not null,
  body text not null check (char_length(body) between 1 and 300),
  detail text check (detail is null or char_length(detail) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists action_point_events_action_idx
  on public.action_point_events (diagnostic_id, action_point_id, created_at desc);
create index if not exists action_point_events_organization_idx
  on public.action_point_events (organization_id);

-- Leitura e escrita passam pelos handlers server-side (service role), que
-- filtram pela empresa da sessão. Nenhum acesso direto do navegador.
alter table public.action_point_assignments enable row level security;
alter table public.action_point_events enable row level security;

revoke all on table public.action_point_assignments from public, anon, authenticated;
revoke all on table public.action_point_events from public, anon, authenticated;
grant all on table public.action_point_assignments to service_role;
grant all on table public.action_point_events to service_role;

comment on table public.action_point_assignments is
  'Responsável (pessoa do Slack), etapa, janela e cadência de cada action point publicado.';
comment on table public.action_point_events is
  'Histórico de atribuições, mudanças de etapa e prazo e notas dos action points.';
