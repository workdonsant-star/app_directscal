create table public.account_profiles (
  user_id uuid primary key references next_auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  avatar_url text check (octet_length(avatar_url) <= 7000000),
  updated_at timestamptz not null default now()
);
create table public.specialists (
  id text primary key,
  name text not null check (length(trim(name)) between 1 and 160),
  email text not null,
  avatar_url text check (octet_length(avatar_url) <= 7000000),
  title text not null,
  location text not null,
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  archived boolean not null default false,
  deleted boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.account_profiles enable row level security;
alter table public.specialists enable row level security;
revoke all on public.account_profiles, public.specialists from anon, authenticated;
grant all on public.account_profiles, public.specialists to service_role;

-- Nome/foto confirmados no app prevalecem sobre dados antigos dos convites.
create function app_private.sync_account_profile_person() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  update public.organization_people set name = new.name, avatar_url = new.avatar_url
    where auth_user_id = new.user_id;
  return new;
end;
$$;
revoke all on function app_private.sync_account_profile_person() from public, anon, authenticated;
grant execute on function app_private.sync_account_profile_person() to service_role;
create trigger sync_account_profile_person after insert or update on public.account_profiles
for each row execute function app_private.sync_account_profile_person();
insert into public.specialists (id,name,email,avatar_url,title,location,status,created_at) values ('specialist_don','Don Santos','don.santos@directscal.com','/relatorios/omdx-modelo/assets/figma/don-santos.jpg','Especialista em estruturação','São Paulo, SP','ativo','2026-02-12T13:00:00.000Z');
insert into public.specialists (id,name,email,avatar_url,title,location,status,created_at) values ('specialist_mariana','Mariana Costa','mariana.costa@directscal.com',null,'Especialista em gestão operacional','Florianópolis, SC','ativo','2026-04-08T13:00:00.000Z');
insert into public.specialists (id,name,email,avatar_url,title,location,status,created_at) values ('specialist_rafael','Rafael Nunes','rafael.nunes@directscal.com',null,'Especialista em performance','Belo Horizonte, MG','ativo','2026-05-19T13:00:00.000Z');
insert into public.specialists (id,name,email,avatar_url,title,location,status,created_at) values ('specialist_elisa','Elisa Rocha','elisa.rocha@directscal.com',null,'Especialista em processos','Curitiba, PR','inativo','2026-01-21T13:00:00.000Z');
