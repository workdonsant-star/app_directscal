do $$
begin
  create type public.acquisition_campaign_status as enum ('ativo', 'pausado');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.acquisition_form_field_type as enum (
    'text',
    'email',
    'phone',
    'number',
    'select',
    'textarea'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.acquisition_lead_status as enum (
    'lead',
    'pending_company',
    'account_created'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.acquisition_account_provider as enum (
    'google',
    'password'
  );
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.acquisition_campaigns (
  id text primary key,
  module_id text not null,
  name text not null,
  source text not null,
  status public.acquisition_campaign_status not null default 'ativo',
  token text not null unique,
  public_path text not null,
  visits integer not null default 0 check (visits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.acquisition_campaign_fields (
  campaign_id text not null references public.acquisition_campaigns(id) on delete cascade,
  id text not null,
  label text not null,
  type public.acquisition_form_field_type not null,
  required boolean not null default false,
  placeholder text,
  options jsonb,
  order_index integer not null check (order_index >= 0),
  primary key (campaign_id, id)
);

create table if not exists public.acquisition_leads (
  id uuid primary key default gen_random_uuid(),
  module_id text not null,
  campaign_id text not null references public.acquisition_campaigns(id) on delete restrict,
  user_id uuid references next_auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  name text not null,
  email text not null,
  normalized_email text generated always as (lower(trim(email))) stored,
  phone text,
  role text,
  company_name text not null,
  company_size text,
  objective text,
  field_values jsonb not null default '{}'::jsonb,
  status public.acquisition_lead_status not null default 'lead',
  account_provider public.acquisition_account_provider,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, normalized_email)
);

create table if not exists app_private.user_password_credentials (
  user_id uuid primary key references next_auth.users(id) on delete cascade,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_private.acquisition_oauth_intents (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references public.acquisition_campaigns(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists acquisition_campaign_fields_campaign_order_idx
  on public.acquisition_campaign_fields (campaign_id, order_index);

create index if not exists acquisition_leads_campaign_created_idx
  on public.acquisition_leads (campaign_id, created_at desc);

create index if not exists acquisition_leads_user_id_idx
  on public.acquisition_leads (user_id);

create index if not exists acquisition_leads_organization_id_idx
  on public.acquisition_leads (organization_id);

create index if not exists acquisition_oauth_intents_expires_idx
  on app_private.acquisition_oauth_intents (expires_at);

drop trigger if exists acquisition_campaigns_touch_updated_at
  on public.acquisition_campaigns;
create trigger acquisition_campaigns_touch_updated_at
before update on public.acquisition_campaigns
for each row execute function app_private.touch_updated_at();

drop trigger if exists acquisition_leads_touch_updated_at
  on public.acquisition_leads;
create trigger acquisition_leads_touch_updated_at
before update on public.acquisition_leads
for each row execute function app_private.touch_updated_at();

drop trigger if exists user_password_credentials_touch_updated_at
  on app_private.user_password_credentials;
create trigger user_password_credentials_touch_updated_at
before update on app_private.user_password_credentials
for each row execute function app_private.touch_updated_at();

alter table public.acquisition_campaigns enable row level security;
alter table public.acquisition_campaign_fields enable row level security;
alter table public.acquisition_leads enable row level security;

grant select, insert, update, delete on
  public.acquisition_campaigns,
  public.acquisition_campaign_fields,
  public.acquisition_leads
to authenticated;

grant all on
  public.acquisition_campaigns,
  public.acquisition_campaign_fields,
  public.acquisition_leads
to service_role;

grant all on
  app_private.user_password_credentials,
  app_private.acquisition_oauth_intents
to service_role;

drop policy if exists acquisition_campaigns_superadmin_select
  on public.acquisition_campaigns;
create policy acquisition_campaigns_superadmin_select
on public.acquisition_campaigns
for select to authenticated
using (app_private.is_superadmin());

drop policy if exists acquisition_campaigns_superadmin_insert
  on public.acquisition_campaigns;
create policy acquisition_campaigns_superadmin_insert
on public.acquisition_campaigns
for insert to authenticated
with check (app_private.is_superadmin());

drop policy if exists acquisition_campaigns_superadmin_update
  on public.acquisition_campaigns;
create policy acquisition_campaigns_superadmin_update
on public.acquisition_campaigns
for update to authenticated
using (app_private.is_superadmin())
with check (app_private.is_superadmin());

drop policy if exists acquisition_campaigns_superadmin_delete
  on public.acquisition_campaigns;
create policy acquisition_campaigns_superadmin_delete
on public.acquisition_campaigns
for delete to authenticated
using (app_private.is_superadmin());

drop policy if exists acquisition_campaign_fields_superadmin_select
  on public.acquisition_campaign_fields;
create policy acquisition_campaign_fields_superadmin_select
on public.acquisition_campaign_fields
for select to authenticated
using (app_private.is_superadmin());

drop policy if exists acquisition_campaign_fields_superadmin_insert
  on public.acquisition_campaign_fields;
create policy acquisition_campaign_fields_superadmin_insert
on public.acquisition_campaign_fields
for insert to authenticated
with check (app_private.is_superadmin());

drop policy if exists acquisition_campaign_fields_superadmin_update
  on public.acquisition_campaign_fields;
create policy acquisition_campaign_fields_superadmin_update
on public.acquisition_campaign_fields
for update to authenticated
using (app_private.is_superadmin())
with check (app_private.is_superadmin());

drop policy if exists acquisition_campaign_fields_superadmin_delete
  on public.acquisition_campaign_fields;
create policy acquisition_campaign_fields_superadmin_delete
on public.acquisition_campaign_fields
for delete to authenticated
using (app_private.is_superadmin());

drop policy if exists acquisition_leads_superadmin_select
  on public.acquisition_leads;
create policy acquisition_leads_superadmin_select
on public.acquisition_leads
for select to authenticated
using (app_private.is_superadmin());

drop policy if exists acquisition_leads_superadmin_insert
  on public.acquisition_leads;
create policy acquisition_leads_superadmin_insert
on public.acquisition_leads
for insert to authenticated
with check (app_private.is_superadmin());

drop policy if exists acquisition_leads_superadmin_update
  on public.acquisition_leads;
create policy acquisition_leads_superadmin_update
on public.acquisition_leads
for update to authenticated
using (app_private.is_superadmin())
with check (app_private.is_superadmin());

drop policy if exists acquisition_leads_superadmin_delete
  on public.acquisition_leads;
create policy acquisition_leads_superadmin_delete
on public.acquisition_leads
for delete to authenticated
using (app_private.is_superadmin());

insert into public.acquisition_campaigns (
  id,
  module_id,
  name,
  source,
  status,
  token,
  public_path,
  visits,
  created_at,
  updated_at
)
values
  (
    'camp_omdx_site',
    'module_omdx',
    'Diagnóstico OMDx — Site',
    'Site institucional',
    'ativo',
    'omdx-site',
    '/a/omdx-site',
    184,
    '2026-04-15T00:00:00.000Z',
    '2026-05-08T00:00:00.000Z'
  ),
  (
    'camp_omdx_outbound',
    'module_omdx',
    'Diagnóstico OMDx — Outbound',
    'Outbound consultivo',
    'ativo',
    'omdx-outbound',
    '/a/omdx-outbound',
    73,
    '2026-04-18T00:00:00.000Z',
    '2026-05-08T00:00:00.000Z'
  )
on conflict (id) do update set
  module_id = excluded.module_id,
  name = excluded.name,
  source = excluded.source,
  status = excluded.status,
  token = excluded.token,
  public_path = excluded.public_path;

insert into public.acquisition_campaign_fields (
  campaign_id,
  id,
  label,
  type,
  required,
  placeholder,
  options,
  order_index
)
select
  campaign.id,
  field.id,
  field.label,
  field.type::public.acquisition_form_field_type,
  field.required,
  field.placeholder,
  field.options,
  field.order_index
from (
  values
    ('camp_omdx_site'),
    ('camp_omdx_outbound')
) as campaign(id)
cross join (
  values
    ('nome', 'Nome completo', 'text', true, 'Nome e sobrenome', null::jsonb, 0),
    ('email', 'E-mail profissional', 'email', true, 'nome@empresa.com.br', null::jsonb, 1),
    ('whatsapp', 'WhatsApp', 'phone', false, '(11) 99999-9999', null::jsonb, 2),
    ('cargo', 'Cargo', 'text', false, 'Fundador, CEO, COO...', null::jsonb, 3),
    ('empresa', 'Empresa', 'text', true, 'Nome da empresa', null::jsonb, 4),
    (
      'tamanho_empresa',
      'Tamanho da empresa',
      'select',
      true,
      null,
      '["1-10 pessoas", "11-50 pessoas", "51-200 pessoas", "201-500 pessoas", "Mais de 500 pessoas"]'::jsonb,
      5
    ),
    (
      'objetivo',
      'Principal objetivo',
      'textarea',
      false,
      'Descreva em uma frase o que a empresa quer estruturar.',
      null::jsonb,
      6
    )
) as field(id, label, type, required, placeholder, options, order_index)
on conflict (campaign_id, id) do update set
  label = excluded.label,
  type = excluded.type,
  required = excluded.required,
  placeholder = excluded.placeholder,
  options = excluded.options,
  order_index = excluded.order_index;
