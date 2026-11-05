-- Ciclos de teste iniciados pela operação. Cada envio é registrado antes do Slack.
create table app_private.manual_action_point_followups (
  id uuid primary key default gen_random_uuid(),
  action_point_id uuid not null references app_private.admin_company_action_points(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_version_id uuid not null references public.management_asset_versions(id) on delete restrict,
  slack_team_id text not null,
  slack_user_id text not null,
  title text not null,
  action text not null,
  question text not null,
  status text not null check (status in ('preparado','enviando','enviado','respondido','falhou','incerto')),
  channel_id text,
  message_ts text,
  error_code text,
  started_by uuid not null references next_auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status in ('enviado','respondido') and channel_id is not null and message_ts is not null)
    or status not in ('enviado','respondido'))
);
create unique index manual_action_point_followups_open_idx
  on app_private.manual_action_point_followups(action_point_id)
  where status in ('preparado','enviando','enviado');
create index manual_action_point_followups_org_idx
  on app_private.manual_action_point_followups(organization_id, created_at desc);
create index manual_action_point_followups_message_idx
  on app_private.manual_action_point_followups(slack_team_id, channel_id, message_ts);

create table app_private.manual_action_point_reports (
  id uuid primary key default gen_random_uuid(),
  followup_id uuid not null references app_private.manual_action_point_followups(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slack_event_job_id uuid not null unique references app_private.slack_delivery_jobs(id),
  status text not null check (status in ('executado_relato','parcial','nao_executado','bloqueado','duvida','inconclusivo')),
  summary text not null check (char_length(summary) between 1 and 1000),
  evidence text check (char_length(evidence) <= 1000),
  registered_at timestamptz not null default now()
);
create index manual_action_point_reports_followup_idx
  on app_private.manual_action_point_reports(followup_id, registered_at desc);

alter table app_private.manual_action_point_followups enable row level security;
alter table app_private.manual_action_point_reports enable row level security;
revoke all on app_private.manual_action_point_followups, app_private.manual_action_point_reports from public, anon, authenticated;
grant select, insert, update on app_private.manual_action_point_followups to service_role;
grant select, insert on app_private.manual_action_point_reports to service_role;
