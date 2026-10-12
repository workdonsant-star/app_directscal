create table if not exists app_private.client_onboarding_completions (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  completed_by uuid references next_auth.users(id) on delete set null,
  completed_at timestamptz not null default now()
);

alter table app_private.client_onboarding_completions enable row level security;
revoke all on app_private.client_onboarding_completions from public, anon, authenticated;
grant select, insert on app_private.client_onboarding_completions to service_role;

comment on table app_private.client_onboarding_completions is
  'Configuração inicial concluída pelo dono: Slack conectado, setores e convites de liderança configurados. Escrita exclusiva do servidor.';
