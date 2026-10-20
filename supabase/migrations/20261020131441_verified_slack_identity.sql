create table app_private.slack_identity_challenges (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 user_id uuid not null references next_auth.users(id) on delete cascade, code_hash text not null unique check(code_hash~'^[0-9a-f]{64}$'),
 created_at timestamptz not null default clock_timestamp(), expires_at timestamptz not null default clock_timestamp()+interval '10 minutes',
 revoked_at timestamptz, consumed_at timestamptz, proof_job_id uuid references app_private.slack_delivery_jobs(id) on delete set null,
 slack_team_id text, slack_user_id text,
 check((consumed_at is null)=(slack_user_id is null)),check((slack_team_id is null)=(slack_user_id is null))
);
create index slack_identity_challenges_org_user_idx on app_private.slack_identity_challenges(organization_id,user_id,created_at desc);
create index slack_identity_challenges_user_idx on app_private.slack_identity_challenges(user_id);
create index slack_identity_challenges_job_idx on app_private.slack_identity_challenges(proof_job_id);
create table app_private.slack_identity_links (
 organization_id uuid not null references public.organizations(id) on delete cascade,
 user_id uuid not null references next_auth.users(id) on delete cascade,
 slack_team_id text not null, slack_user_id text not null,
 challenge_id uuid not null references app_private.slack_identity_challenges(id), verified_at timestamptz not null default clock_timestamp(),
 primary key(organization_id,user_id),unique(organization_id,slack_team_id,slack_user_id)
);
create index slack_identity_links_user_idx on app_private.slack_identity_links(user_id);
create index slack_identity_links_challenge_idx on app_private.slack_identity_links(challenge_id);
alter table app_private.slack_identity_challenges enable row level security;
alter table app_private.slack_identity_links enable row level security;
revoke all on app_private.slack_identity_challenges,app_private.slack_identity_links from public,anon,authenticated,service_role;
grant select,insert,update on app_private.slack_identity_challenges to service_role;
grant select,insert,delete on app_private.slack_identity_links to service_role;

create function app_private.start_slack_identity(p_organization_id uuid,p_user_id uuid,p_code_hash text) returns timestamptz
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_expires timestamptz;
begin
 perform 1 from public.organizations where id=p_organization_id for update;
 if not found or exists(select 1 from public.organization_members where user_id=p_user_id and role='superadmin') or
   not exists(select 1 from public.organization_members where organization_id=p_organization_id and user_id=p_user_id and role in('cliente','admin')) then
   raise exception using errcode='42501',message='Acesso restrito'; end if;
 if not exists(select 1 from app_private.slack_installations where organization_id=p_organization_id and revoked_at is null) then raise exception using errcode='PT409',message='Conecte o Slack'; end if;
 if exists(select 1 from app_private.slack_identity_challenges where organization_id=p_organization_id and user_id=p_user_id and created_at>clock_timestamp()-interval '30 seconds') then
   raise exception using errcode='PT429',message='Aguarde antes de gerar outro código'; end if;
 update app_private.slack_identity_challenges set revoked_at=clock_timestamp() where organization_id=p_organization_id and user_id=p_user_id and consumed_at is null and revoked_at is null;
 insert into app_private.slack_identity_challenges(organization_id,user_id,code_hash) values(p_organization_id,p_user_id,p_code_hash) returning expires_at into v_expires;
 return v_expires;
end $$;

create function app_private.complete_slack_identity(p_job_id uuid,p_lease_id uuid) returns boolean
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_job app_private.slack_delivery_jobs; v_code text; v_hash text; v_challenge app_private.slack_identity_challenges;
begin
 select * into v_job from app_private.slack_delivery_jobs where id=p_job_id for update;
 if not found or v_job.status<>'processando' or v_job.lease_id is distinct from p_lease_id or v_job.lease_until<clock_timestamp() then raise exception using errcode='PT409',message='Evento desatualizado'; end if;
 if v_job.question->>'kind'<>'direct' then return false; end if;
 v_code:=substring(trim(v_job.question->>'text') from '(?i)^vincular (dsc_[A-Za-z0-9_-]{43})$');
 if v_code is null then return false; end if;
 v_hash:=encode(pg_catalog.sha256(pg_catalog.convert_to(v_code,'UTF8')),'hex');
 perform 1 from public.organizations where id=v_job.organization_id for update;
 select * into v_challenge from app_private.slack_identity_challenges where code_hash=v_hash and organization_id=v_job.organization_id for update;
 if not found then return false; end if;
 if exists(select 1 from public.organization_members where user_id=v_challenge.user_id and role='superadmin') or
   not exists(select 1 from public.organization_members where organization_id=v_job.organization_id and user_id=v_challenge.user_id and role in('cliente','admin')) or
   not exists(select 1 from app_private.slack_installations where team_id=v_job.team_id and organization_id=v_job.organization_id and revoked_at is null) then return false; end if;
 if v_challenge.consumed_at is not null then
   return v_challenge.proof_job_id=p_job_id and v_challenge.slack_team_id=v_job.team_id and v_challenge.slack_user_id=v_job.question->>'userId'
     and exists(select 1 from app_private.slack_identity_links where challenge_id=v_challenge.id);
 end if;
 if v_challenge.expires_at<clock_timestamp() or v_challenge.revoked_at is not null or
   exists(select 1 from public.organization_members where user_id=v_challenge.user_id and role='superadmin') or
   not exists(select 1 from public.organization_members where organization_id=v_job.organization_id and user_id=v_challenge.user_id and role in('cliente','admin')) or
   not exists(select 1 from app_private.slack_installations where team_id=v_job.team_id and organization_id=v_job.organization_id and revoked_at is null) then return false; end if;
 if exists(select 1 from app_private.slack_identity_links where organization_id=v_job.organization_id and
   ((user_id=v_challenge.user_id and (slack_team_id<>v_job.team_id or slack_user_id<>v_job.question->>'userId')) or
    (slack_team_id=v_job.team_id and slack_user_id=v_job.question->>'userId' and user_id<>v_challenge.user_id))) then return false; end if;
 update app_private.slack_identity_challenges set consumed_at=clock_timestamp(),proof_job_id=p_job_id,slack_team_id=v_job.team_id,slack_user_id=v_job.question->>'userId' where id=v_challenge.id;
 insert into app_private.slack_identity_links(organization_id,user_id,slack_team_id,slack_user_id,challenge_id)
   values(v_job.organization_id,v_challenge.user_id,v_job.team_id,v_job.question->>'userId',v_challenge.id) on conflict(organization_id,user_id) do nothing;
 return true;
end $$;

create function app_private.unlink_slack_identity(p_organization_id uuid,p_user_id uuid) returns void
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
begin
 perform 1 from public.organizations where id=p_organization_id for update;
 if exists(select 1 from public.organization_members where user_id=p_user_id and role='superadmin') or not exists(select 1 from public.organization_members where organization_id=p_organization_id and user_id=p_user_id and role in('cliente','admin')) then raise exception using errcode='42501',message='Acesso restrito'; end if;
 delete from app_private.slack_identity_links where organization_id=p_organization_id and user_id=p_user_id;
 update app_private.slack_identity_challenges set revoked_at=clock_timestamp() where organization_id=p_organization_id and user_id=p_user_id and revoked_at is null;
end $$;

create function app_private.get_verified_slack_identities(p_organization_id uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('appUserId',l.user_id,'slackIdentity',l.slack_team_id||':'||l.slack_user_id,'teamId',l.slack_team_id,'slackUserId',l.slack_user_id,'verifiedAt',l.verified_at)),'[]'::jsonb)
 from app_private.slack_identity_links l where l.organization_id=p_organization_id
 and exists(select 1 from app_private.slack_installations i where i.organization_id=l.organization_id and i.team_id=l.slack_team_id and i.revoked_at is null)
 and exists(select 1 from public.organization_members m where m.organization_id=l.organization_id and m.user_id=l.user_id and m.role in('cliente','admin'))
 and not exists(select 1 from public.organization_members m where m.user_id=l.user_id and m.role='superadmin');
$$;
revoke all on function app_private.start_slack_identity(uuid,uuid,text),app_private.complete_slack_identity(uuid,uuid),app_private.unlink_slack_identity(uuid,uuid),app_private.get_verified_slack_identities(uuid) from public,anon,authenticated;
grant execute on function app_private.start_slack_identity(uuid,uuid,text),app_private.complete_slack_identity(uuid,uuid),app_private.unlink_slack_identity(uuid,uuid),app_private.get_verified_slack_identities(uuid) to service_role;
notify pgrst,'reload schema';
