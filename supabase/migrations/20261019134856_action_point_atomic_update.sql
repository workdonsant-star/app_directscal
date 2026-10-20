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

-- Estado e histórico formam uma única escrita com controle de concorrência.
create or replace function app_private.save_action_point_update(
  p_diagnostic_id uuid, p_organization_id uuid, p_action_point_id text,
  p_actor_user_id uuid, p_author_name text, p_expected_updated_at timestamptz, p_plan jsonb
) returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_org uuid;
  v_current timestamptz;
  v_values jsonb := p_plan->'values';
  v_event jsonb;
begin
  if not exists(select 1 from public.organization_members
    where organization_id=p_organization_id and user_id=p_actor_user_id and role='cliente')
    or exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then
    raise exception 'Acesso restrito ao dono da empresa.' using errcode='42501';
  end if;
  select organization_id into v_org from public.diagnostics where id=p_diagnostic_id for update;
  if v_org is distinct from p_organization_id or not exists(
    select 1 from public.admin_deliveries where diagnostic_id=p_diagnostic_id
      and organization_id=p_organization_id and status='publicada'
      and p_action_point_id=any(selected_action_point_ids)) then
    raise exception 'Action point não publicado nesta empresa.' using errcode='42501';
  end if;
  select updated_at into v_current from public.action_point_assignments
    where diagnostic_id=p_diagnostic_id and action_point_id=p_action_point_id;
  if v_current is distinct from p_expected_updated_at then
    raise exception 'A ação foi alterada em outra sessão. Recarregue e tente novamente.' using errcode='40001';
  end if;
  if (p_plan->>'remove')::boolean then
    delete from public.action_point_assignments where diagnostic_id=p_diagnostic_id
      and organization_id=p_organization_id and action_point_id=p_action_point_id;
  else
    insert into public.action_point_assignments(diagnostic_id,action_point_id,organization_id,
      assignee_team_id,assignee_slack_user_id,assignee_name,assignee_avatar_url,stage,starts_on,due_on,cadence,progress)
    values(p_diagnostic_id,p_action_point_id,p_organization_id,
      v_values->'assignee'->>'teamId',v_values->'assignee'->>'userId',
      v_values->'assignee'->>'name',v_values->'assignee'->>'avatarUrl',
      v_values->>'stage',(v_values->>'startsOn')::date,(v_values->>'dueOn')::date,
      v_values->>'cadence',(v_values->>'progress')::smallint)
    on conflict(diagnostic_id,action_point_id) do update set
      assignee_team_id=excluded.assignee_team_id,assignee_slack_user_id=excluded.assignee_slack_user_id,
      assignee_name=excluded.assignee_name,assignee_avatar_url=excluded.assignee_avatar_url,
      stage=excluded.stage,starts_on=excluded.starts_on,due_on=excluded.due_on,
      cadence=excluded.cadence,progress=excluded.progress,updated_at=clock_timestamp();
  end if;
  for v_event in select value from jsonb_array_elements(p_plan->'events') loop
    insert into public.action_point_events(diagnostic_id,action_point_id,organization_id,kind,author_name,body,detail)
    values(p_diagnostic_id,p_action_point_id,p_organization_id,v_event->>'kind',p_author_name,
      v_event->>'body',v_event->>'detail');
  end loop;
end;
$$;
revoke all on function app_private.save_action_point_update(uuid,uuid,text,uuid,text,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function app_private.save_action_point_update(uuid,uuid,text,uuid,text,timestamptz,jsonb) to service_role;
