create table if not exists public.admin_deliveries (
  diagnostic_id uuid primary key references public.diagnostics(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  specialist_id text,
  status text not null default 'sem_especialista'
    check (status in (
      'sem_especialista',
      'aguardando_analise',
      'em_analise',
      'pronta_para_publicar',
      'publicada'
    )),
  report_content jsonb not null default '{}'::jsonb,
  dimension_readings jsonb not null default '{}'::jsonb,
  selected_action_point_ids text[] not null default '{}'::text[],
  published_at timestamptz,
  published_by_user_id uuid references next_auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_deliveries_publication_timestamp_check check (
    status <> 'publicada' or published_at is not null
  )
);

create index if not exists admin_deliveries_organization_status_idx
  on public.admin_deliveries (organization_id, status);

drop trigger if exists admin_deliveries_touch_updated_at on public.admin_deliveries;
create trigger admin_deliveries_touch_updated_at
before update on public.admin_deliveries
for each row execute function app_private.touch_updated_at();

alter table public.admin_deliveries enable row level security;

drop policy if exists admin_deliveries_member_select_published on public.admin_deliveries;
create policy admin_deliveries_member_select_published
on public.admin_deliveries
for select
to authenticated
using (
  status = 'publicada'
  and app_private.is_org_member(organization_id)
);

revoke all on table public.admin_deliveries from public, anon, authenticated;
grant select on table public.admin_deliveries to authenticated;
grant all on table public.admin_deliveries to service_role;

comment on table public.admin_deliveries is
  'Estado editorial e publicação das entregas de diagnósticos encerrados.';
