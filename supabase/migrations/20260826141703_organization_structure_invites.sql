do $$
begin
  create type public.organization_person_status as enum (
    'convite_pendente',
    'ativo',
    'inativo'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.organization_membership_role as enum (
    'lideranca',
    'membro'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type app_private.leadership_invitation_status as enum (
    'pendente',
    'aceito',
    'expirado',
    'revogado'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type app_private.email_delivery_status as enum (
    'pendente',
    'enviado',
    'falhou'
  );
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.organization_sectors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  normalized_name text generated always as (lower(trim(name))) stored,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (organization_id, normalized_name)
);

create table if not exists public.organization_people (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  auth_user_id uuid references next_auth.users(id) on delete set null,
  email text not null check (char_length(trim(email)) between 3 and 254),
  normalized_email text generated always as (lower(trim(email))) stored,
  name text,
  avatar_url text,
  position text not null check (char_length(trim(position)) between 2 and 120),
  status public.organization_person_status not null default 'convite_pendente',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (organization_id, normalized_email)
);

create table if not exists public.organization_sector_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sector_id uuid not null references public.organization_sectors(id) on delete cascade,
  person_id uuid not null references public.organization_people(id) on delete cascade,
  role public.organization_membership_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (sector_id, organization_id)
    references public.organization_sectors(id, organization_id) on delete cascade,
  foreign key (person_id, organization_id)
    references public.organization_people(id, organization_id) on delete cascade,
  unique (sector_id, person_id)
);

create unique index if not exists organization_sector_primary_leader_idx
  on public.organization_sector_memberships (sector_id)
  where role = 'lideranca';

create index if not exists organization_sectors_org_active_idx
  on public.organization_sectors (organization_id, active, created_at);

create index if not exists organization_people_org_status_idx
  on public.organization_people (organization_id, status, created_at);

create index if not exists organization_sector_memberships_org_idx
  on public.organization_sector_memberships (organization_id, sector_id);

create table if not exists app_private.leadership_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sector_id uuid not null references public.organization_sectors(id) on delete cascade,
  person_id uuid not null references public.organization_people(id) on delete cascade,
  created_by uuid references next_auth.users(id) on delete set null,
  token_hash text not null unique,
  status app_private.leadership_invitation_status not null default 'pendente',
  delivery_status app_private.email_delivery_status not null default 'pendente',
  provider_message_id text,
  delivery_error text,
  expires_at timestamptz not null,
  last_sent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (sector_id, organization_id)
    references public.organization_sectors(id, organization_id) on delete cascade,
  foreign key (person_id, organization_id)
    references public.organization_people(id, organization_id) on delete cascade
);

create index if not exists leadership_invitations_org_sector_idx
  on app_private.leadership_invitations (organization_id, sector_id, created_at desc);

create index if not exists leadership_invitations_token_active_idx
  on app_private.leadership_invitations (token_hash)
  where status = 'pendente';

create unique index if not exists leadership_invitations_one_pending_per_sector_idx
  on app_private.leadership_invitations (sector_id)
  where status = 'pendente';

drop trigger if exists organization_sectors_touch_updated_at
  on public.organization_sectors;
create trigger organization_sectors_touch_updated_at
before update on public.organization_sectors
for each row execute function app_private.touch_updated_at();

drop trigger if exists organization_people_touch_updated_at
  on public.organization_people;
create trigger organization_people_touch_updated_at
before update on public.organization_people
for each row execute function app_private.touch_updated_at();

drop trigger if exists organization_sector_memberships_touch_updated_at
  on public.organization_sector_memberships;
create trigger organization_sector_memberships_touch_updated_at
before update on public.organization_sector_memberships
for each row execute function app_private.touch_updated_at();

drop trigger if exists leadership_invitations_touch_updated_at
  on app_private.leadership_invitations;
create trigger leadership_invitations_touch_updated_at
before update on app_private.leadership_invitations
for each row execute function app_private.touch_updated_at();

alter table public.organization_sectors enable row level security;
alter table public.organization_people enable row level security;
alter table public.organization_sector_memberships enable row level security;
alter table app_private.leadership_invitations enable row level security;

revoke all on
  public.organization_sectors,
  public.organization_people,
  public.organization_sector_memberships
from anon;

grant select on
  public.organization_sectors,
  public.organization_people,
  public.organization_sector_memberships
to authenticated;

grant all on
  public.organization_sectors,
  public.organization_people,
  public.organization_sector_memberships
to service_role;

revoke all on app_private.leadership_invitations
from public, anon, authenticated;
grant all on app_private.leadership_invitations to service_role;

drop policy if exists organization_sectors_member_select
  on public.organization_sectors;
create policy organization_sectors_member_select
on public.organization_sectors
for select to authenticated
using (app_private.is_org_member(organization_id));

drop policy if exists organization_people_member_select
  on public.organization_people;
create policy organization_people_member_select
on public.organization_people
for select to authenticated
using (app_private.is_org_member(organization_id));

drop policy if exists organization_sector_memberships_member_select
  on public.organization_sector_memberships;
create policy organization_sector_memberships_member_select
on public.organization_sector_memberships
for select to authenticated
using (app_private.is_org_member(organization_id));

create or replace function app_private.create_leadership_invitation(
  p_organization_id uuid,
  p_sector_name text,
  p_leader_email text,
  p_position text,
  p_created_by uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_sector_id uuid;
  v_person_id uuid;
  v_invitation_id uuid;
begin
  if not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_created_by
  ) then
    raise exception 'organization_access_denied';
  end if;

  insert into public.organization_sectors (organization_id, name)
  values (p_organization_id, trim(p_sector_name))
  returning id into v_sector_id;

  insert into public.organization_people (
    organization_id,
    email,
    position
  )
  values (
    p_organization_id,
    lower(trim(p_leader_email)),
    trim(p_position)
  )
  on conflict (organization_id, normalized_email)
  do update set
    email = excluded.email,
    position = excluded.position,
    status = case
      when public.organization_people.status = 'ativo'
        then public.organization_people.status
      else 'convite_pendente'::public.organization_person_status
    end
  returning id into v_person_id;

  insert into public.organization_sector_memberships (
    organization_id,
    sector_id,
    person_id,
    role
  )
  values (
    p_organization_id,
    v_sector_id,
    v_person_id,
    'lideranca'
  );

  insert into app_private.leadership_invitations (
    organization_id,
    sector_id,
    person_id,
    created_by,
    token_hash,
    expires_at
  )
  values (
    p_organization_id,
    v_sector_id,
    v_person_id,
    p_created_by,
    p_token_hash,
    p_expires_at
  )
  returning id into v_invitation_id;

  return jsonb_build_object(
    'sector_id', v_sector_id,
    'person_id', v_person_id,
    'invitation_id', v_invitation_id
  );
end;
$$;

revoke all on function app_private.create_leadership_invitation(
  uuid,
  text,
  text,
  text,
  uuid,
  text,
  timestamptz
) from public, anon, authenticated;
grant execute on function app_private.create_leadership_invitation(
  uuid,
  text,
  text,
  text,
  uuid,
  text,
  timestamptz
) to service_role;
