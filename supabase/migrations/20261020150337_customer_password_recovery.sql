create table app_private.user_session_versions (
 user_id uuid primary key references next_auth.users(id) on delete cascade,
 version uuid not null default gen_random_uuid(),updated_at timestamptz not null default clock_timestamp()
);
create table app_private.session_security_enforcement (
 singleton boolean primary key default true check(singleton),enabled boolean not null default false,activated_at timestamptz
);
insert into app_private.session_security_enforcement(singleton) values(true);
alter table app_private.session_security_enforcement enable row level security;
revoke all on app_private.session_security_enforcement from public,anon,authenticated,service_role;
grant select,update on app_private.session_security_enforcement to service_role;
create table app_private.password_reset_requests (
 id uuid primary key,user_id uuid references next_auth.users(id) on delete cascade,
 email_hash text not null check(email_hash~'^[0-9a-f]{64}$'),token_hash text unique check(token_hash~'^[0-9a-f]{64}$'),
 issued_version text not null,created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null default clock_timestamp()+interval '1 hour',used_at timestamptz,revoked_at timestamptz,
 check((user_id is null)=(token_hash is null))
);
create index password_reset_requests_user_idx on app_private.password_reset_requests(user_id);
create index password_reset_requests_rate_idx on app_private.password_reset_requests(email_hash,created_at desc);
create index password_reset_requests_created_idx on app_private.password_reset_requests(created_at desc);
create table app_private.password_reset_deliveries (
 id uuid primary key references app_private.password_reset_requests(id) on delete cascade,
 sealed_token jsonb not null check(jsonb_typeof(sealed_token)='object' and octet_length(sealed_token::text)<=4000),
 status text not null default 'recebido' check(status in('recebido','processando','enviado','falhou')),
 attempts integer not null default 0 check(attempts between 0 and 5),retryable boolean not null default true,
 available_at timestamptz not null default clock_timestamp(),lease_id uuid,lease_until timestamptz,
 provider_message_id text,sent_at timestamptz,error_code text,updated_at timestamptz not null default clock_timestamp(),
 check((lease_id is null)=(lease_until is null)),check(status<>'processando' or lease_id is not null)
);
create index password_reset_deliveries_pending_idx on app_private.password_reset_deliveries(available_at,id) where status in('recebido','processando','falhou');
create table app_private.password_change_attempts (
 id bigint generated always as identity primary key,user_id uuid not null references next_auth.users(id) on delete cascade,attempted_at timestamptz not null default clock_timestamp()
);
create index password_change_attempts_user_idx on app_private.password_change_attempts(user_id,attempted_at desc);
alter table app_private.password_change_attempts enable row level security;
revoke all on app_private.password_change_attempts from public,anon,authenticated,service_role;
grant select,insert on app_private.password_change_attempts to service_role;
revoke all on sequence app_private.password_change_attempts_id_seq from public,anon,authenticated;
grant usage,select on sequence app_private.password_change_attempts_id_seq to service_role;
alter table app_private.user_session_versions enable row level security;
alter table app_private.password_reset_requests enable row level security;
alter table app_private.password_reset_deliveries enable row level security;
revoke all on app_private.user_session_versions,app_private.password_reset_requests,app_private.password_reset_deliveries from public,anon,authenticated,service_role;
grant select,insert,update on app_private.user_session_versions,app_private.password_reset_requests,app_private.password_reset_deliveries to service_role;

create function app_private.get_user_session_version(p_user_id uuid) returns text
language sql stable security invoker set search_path='' as $$
 select coalesce((select version::text from app_private.user_session_versions where user_id=p_user_id),'initial');
$$;
create function app_private.rotate_user_session_version() returns trigger
language plpgsql security invoker set search_path='' as $$
declare v_user uuid;
begin
 if TG_TABLE_NAME='user_password_credentials' then
   if TG_OP='UPDATE' and old.password_hash is not distinct from new.password_hash then return new;end if;
   v_user:=new.user_id;
 else
   if TG_OP='UPDATE' and (old.role,old.organization_id,old.user_id) is not distinct from (new.role,new.organization_id,new.user_id) then return new;end if;
   v_user:=old.user_id;
 end if;
 insert into app_private.user_session_versions(user_id) select v_user where exists(select 1 from next_auth.users where id=v_user)
   on conflict(user_id) do update set version=gen_random_uuid(),updated_at=clock_timestamp();
 if TG_TABLE_NAME='organization_members' and TG_OP='UPDATE' and old.user_id<>new.user_id then
   insert into app_private.user_session_versions(user_id) values(new.user_id) on conflict(user_id) do update set version=gen_random_uuid(),updated_at=clock_timestamp();
 end if;
 return coalesce(new,old);
end $$;
create trigger rotate_session_after_password after insert or update on app_private.user_password_credentials for each row execute function app_private.rotate_user_session_version();
create trigger rotate_session_after_membership after delete or update on public.organization_members for each row execute function app_private.rotate_user_session_version();

-- Helper privado de RLS: lê somente a identidade do JWT verificado, sem aceitar ID externo.
-- Definer é necessário para consultar a versão privada sem conceder SELECT ao cliente.
create function app_private.is_session_current() returns boolean
language plpgsql stable security definer set search_path='' as $$
declare v_claims jsonb:=coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb);
 v_sub text:=coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),v_claims->>'sub');
begin
 if v_sub is null or v_sub !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false;end if;
 if not coalesce((select enabled from app_private.session_security_enforcement where singleton),false) then return true;end if;
 if v_claims->>'session_version' is null then return false;end if;
 return coalesce(v_claims->>'session_version','initial')=coalesce((select version::text from app_private.user_session_versions where user_id=v_sub::uuid),'initial');
end $$;
create or replace function next_auth.uid() returns uuid
language sql stable security invoker set search_path='' as $$
 select case when app_private.is_session_current() then coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid else null end;
$$;

create function app_private.start_customer_password_reset(p_id uuid,p_email text,p_token_hash text,p_sealed_token jsonb) returns uuid
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_hash text:=encode(sha256(convert_to(lower(trim(p_email)),'UTF8')),'hex');v_user uuid;v_allowed boolean;v_version text;
begin
 if p_id is null or p_token_hash is null or p_token_hash !~'^[0-9a-f]{64}$' or jsonb_typeof(p_sealed_token) is distinct from 'object' or octet_length(p_sealed_token::text)>4000 or p_email is null or char_length(p_email)>320 then raise exception using errcode='PT400',message='Solicitação inválida';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('password-reset-rate',0));
 if exists(select 1 from app_private.password_reset_requests where email_hash=v_hash and created_at>clock_timestamp()-interval '1 minute') or
   (select count(*) from app_private.password_reset_requests where email_hash=v_hash and created_at>clock_timestamp()-interval '1 hour')>=3 or
   (select count(*) from app_private.password_reset_requests where created_at>clock_timestamp()-interval '1 hour')>=200 then return null;end if;
 select id into v_user from next_auth.users where lower(trim(email))=lower(trim(p_email)) for update;
 v_allowed:=v_user is not null and exists(select 1 from app_private.user_password_credentials where user_id=v_user) and
   exists(select 1 from public.organization_members where user_id=v_user and role in('cliente','admin')) and not exists(select 1 from public.organization_members where user_id=v_user and role='superadmin');
 if not v_allowed then v_user:=null;end if;
 v_version:=app_private.get_user_session_version(v_user);
 if v_user is not null then update app_private.password_reset_requests set revoked_at=clock_timestamp() where user_id=v_user and used_at is null and revoked_at is null;end if;
 insert into app_private.password_reset_requests(id,user_id,email_hash,token_hash,issued_version) values(p_id,v_user,v_hash,case when v_user is not null then p_token_hash else null end,v_version);
 if v_user is null then return null;end if;
 insert into app_private.password_reset_deliveries(id,sealed_token) values(p_id,p_sealed_token);
 return p_id;
end $$;

create function app_private.claim_password_reset_delivery(p_id uuid default null) returns jsonb
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_job app_private.password_reset_deliveries;v_email text;
begin
 update app_private.password_reset_deliveries set status='falhou',retryable=false,lease_id=null,lease_until=null,error_code='tentativas_esgotadas',updated_at=clock_timestamp()
   where status='processando' and lease_until<clock_timestamp() and attempts>=5 and (p_id is null or id=p_id);
 select j.* into v_job from app_private.password_reset_deliveries j join app_private.password_reset_requests r on r.id=j.id
   where (p_id is null or j.id=p_id) and j.attempts<5 and j.retryable and r.expires_at>clock_timestamp() and r.used_at is null and r.revoked_at is null
   and r.issued_version=app_private.get_user_session_version(r.user_id)
   and exists(select 1 from public.organization_members where user_id=r.user_id and role in('cliente','admin')) and not exists(select 1 from public.organization_members where user_id=r.user_id and role='superadmin')
   and ((j.status in('recebido','falhou') and j.available_at<=clock_timestamp()) or (j.status='processando' and j.lease_until<clock_timestamp()))
   order by j.available_at,j.id for update of j skip locked limit 1;
 if not found then return null;end if;
 select u.email into v_email from next_auth.users u join app_private.password_reset_requests r on r.user_id=u.id where r.id=v_job.id and r.email_hash=encode(sha256(convert_to(lower(trim(u.email)),'UTF8')),'hex');
 if v_email is null then update app_private.password_reset_deliveries set status='falhou',retryable=false,error_code='conta_alterada' where id=v_job.id;return null;end if;
 update app_private.password_reset_deliveries set status='processando',attempts=attempts+1,lease_id=gen_random_uuid(),lease_until=clock_timestamp()+interval '2 minutes',updated_at=clock_timestamp() where id=v_job.id returning * into v_job;
 return jsonb_build_object('id',v_job.id,'leaseId',v_job.lease_id,'sealedToken',v_job.sealed_token,'email',v_email);
end $$;
create function app_private.finish_password_reset_delivery(p_id uuid,p_lease_id uuid,p_message_id text,p_retryable boolean default false,p_retry_after integer default 60) returns void
language plpgsql security invoker set search_path='' as $$
declare v_job app_private.password_reset_deliveries;
begin
 select * into v_job from app_private.password_reset_deliveries where id=p_id for update;
 if not found or v_job.status<>'processando' or v_job.lease_id is distinct from p_lease_id or v_job.lease_until<clock_timestamp() then raise exception using errcode='PT409',message='Reserva expirada';end if;
 update app_private.password_reset_deliveries set status=case when p_message_id is not null then 'enviado' else 'falhou' end,
   provider_message_id=p_message_id,sent_at=case when p_message_id is not null then clock_timestamp() else null end,
   retryable=p_message_id is null and p_retryable and attempts<5,available_at=clock_timestamp()+make_interval(secs=>greatest(30,least(coalesce(p_retry_after,60),3600))),
   lease_id=null,lease_until=null,error_code=case when p_message_id is null then 'envio_indisponivel' else null end,updated_at=clock_timestamp() where id=p_id;
end $$;

create function app_private.get_customer_password_context(p_user_id uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('passwordHash',password_hash) from app_private.user_password_credentials where user_id=p_user_id
 and exists(select 1 from public.organization_members where user_id=p_user_id and role in('cliente','admin'))
 and not exists(select 1 from public.organization_members where user_id=p_user_id and role='superadmin');
$$;
create function app_private.get_customer_password_reset_context(p_token_hash text) returns jsonb
language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('userId',r.user_id,'passwordHash',c.password_hash) from app_private.password_reset_requests r
 join app_private.user_password_credentials c on c.user_id=r.user_id join app_private.password_reset_deliveries d on d.id=r.id
 where r.token_hash=p_token_hash and r.used_at is null and r.revoked_at is null and r.expires_at>now() and d.sent_at is not null
 and r.issued_version=app_private.get_user_session_version(r.user_id)
 and exists(select 1 from public.organization_members where user_id=r.user_id and role in('cliente','admin'))
 and not exists(select 1 from public.organization_members where user_id=r.user_id and role='superadmin');
$$;
create function app_private.start_customer_password_change(p_user_id uuid) returns boolean
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
begin
 if app_private.get_customer_password_context(p_user_id) is null then return false;end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('password-change:'||p_user_id::text,0));
 if (select count(*) from app_private.password_change_attempts where user_id=p_user_id and attempted_at>clock_timestamp()-interval '15 minutes')>=5 then return false;end if;
 insert into app_private.password_change_attempts(user_id) values(p_user_id);return true;
end $$;
create function app_private.change_customer_password(p_user_id uuid,p_expected_hash text,p_new_hash text) returns void
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
begin
 perform 1 from next_auth.users where id=p_user_id for update;
 if app_private.get_customer_password_context(p_user_id) is null then raise exception using errcode='42501',message='Acesso por senha indisponível';end if;
 if p_new_hash is null or p_new_hash !~ '^scrypt\$16384\$8\$1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{86}$' then raise exception using errcode='PT400',message='Credencial inválida';end if;
 update app_private.user_password_credentials set password_hash=p_new_hash where user_id=p_user_id and password_hash=p_expected_hash;
 if not found then raise exception using errcode='PT409',message='A credencial mudou';end if;
 update app_private.password_reset_requests set revoked_at=clock_timestamp() where user_id=p_user_id and used_at is null and revoked_at is null;
end $$;
create function app_private.complete_customer_password_reset(p_token_hash text,p_expected_hash text,p_new_hash text) returns boolean
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_request app_private.password_reset_requests;v_user uuid;
begin
 select user_id into v_user from app_private.password_reset_requests where token_hash=p_token_hash;
 if v_user is null then return false;end if;
 perform 1 from next_auth.users where id=v_user for update;
 select * into v_request from app_private.password_reset_requests where token_hash=p_token_hash for update;
 if v_request.used_at is not null or v_request.revoked_at is not null or v_request.expires_at<=clock_timestamp() or
   app_private.get_customer_password_reset_context(p_token_hash) is null then return false;end if;
 perform app_private.change_customer_password(v_user,p_expected_hash,p_new_hash);
 update app_private.password_reset_requests set used_at=clock_timestamp(),revoked_at=null where id=v_request.id;
 return true;
end $$;

revoke all on function app_private.is_session_current() from public;
grant execute on function app_private.is_session_current() to anon,authenticated,service_role;
revoke all on function app_private.get_user_session_version(uuid),app_private.rotate_user_session_version(),app_private.start_customer_password_reset(uuid,text,text,jsonb),app_private.claim_password_reset_delivery(uuid),app_private.finish_password_reset_delivery(uuid,uuid,text,boolean,integer),app_private.get_customer_password_context(uuid),app_private.get_customer_password_reset_context(text),app_private.start_customer_password_change(uuid),app_private.change_customer_password(uuid,text,text),app_private.complete_customer_password_reset(text,text,text) from public,anon,authenticated;
grant execute on function app_private.get_user_session_version(uuid),app_private.rotate_user_session_version(),app_private.start_customer_password_reset(uuid,text,text,jsonb),app_private.claim_password_reset_delivery(uuid),app_private.finish_password_reset_delivery(uuid,uuid,text,boolean,integer),app_private.get_customer_password_context(uuid),app_private.get_customer_password_reset_context(text),app_private.start_customer_password_change(uuid),app_private.change_customer_password(uuid,text,text),app_private.complete_customer_password_reset(text,text,text) to service_role;
notify pgrst,'reload schema';
