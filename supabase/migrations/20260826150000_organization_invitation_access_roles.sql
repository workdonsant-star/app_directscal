alter table app_private.leadership_invitations
  add column if not exists access_role public.auth_role not null default 'admin';

alter table app_private.leadership_invitations
  drop constraint if exists leadership_invitations_customer_access_role_check;

alter table app_private.leadership_invitations
  add constraint leadership_invitations_customer_access_role_check
  check (access_role in ('cliente', 'admin'));

revoke all on function app_private.create_leadership_invitation(
  uuid,
  text,
  text,
  text,
  uuid,
  text,
  timestamptz
) from public, anon, authenticated, service_role;

drop function app_private.create_leadership_invitation(
  uuid,
  text,
  text,
  text,
  uuid,
  text,
  timestamptz
);

create function app_private.create_leadership_invitation(
  p_organization_id uuid,
  p_sector_name text,
  p_leader_email text,
  p_position text,
  p_access_role public.auth_role,
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
  if p_access_role not in ('cliente', 'admin') then
    raise exception 'organization_invitation_role_invalid';
  end if;

  if not exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = p_created_by
      and member.role = 'cliente'
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
    access_role,
    created_by,
    token_hash,
    expires_at
  )
  values (
    p_organization_id,
    v_sector_id,
    v_person_id,
    p_access_role,
    p_created_by,
    p_token_hash,
    p_expires_at
  )
  returning id into v_invitation_id;

  return jsonb_build_object(
    'sector_id', v_sector_id,
    'person_id', v_person_id,
    'invitation_id', v_invitation_id,
    'access_role', p_access_role
  );
end;
$$;

revoke all on function app_private.create_leadership_invitation(
  uuid,
  text,
  text,
  text,
  public.auth_role,
  uuid,
  text,
  timestamptz
) from public, anon, authenticated;

grant execute on function app_private.create_leadership_invitation(
  uuid,
  text,
  text,
  text,
  public.auth_role,
  uuid,
  text,
  timestamptz
) to service_role;

create or replace function app_private.accept_leadership_invitation(
  p_token_hash text,
  p_user_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_invitation app_private.leadership_invitations%rowtype;
  v_invited_email text;
  v_user_email text;
  v_user_name text;
  v_user_image text;
begin
  select invitation.*
  into v_invitation
  from app_private.leadership_invitations invitation
  where invitation.token_hash = p_token_hash
  for update;

  if v_invitation.id is null
    or v_invitation.status <> 'pendente'
    or v_invitation.expires_at <= now()
  then
    raise exception 'leadership_invitation_unavailable';
  end if;

  select lower(trim(person.email))
  into v_invited_email
  from public.organization_people person
  where person.id = v_invitation.person_id
    and person.organization_id = v_invitation.organization_id;

  select lower(trim(auth_user.email)), auth_user.name, auth_user.image
  into v_user_email, v_user_name, v_user_image
  from next_auth.users auth_user
  where auth_user.id = p_user_id;

  if v_invited_email is null
    or v_user_email is null
    or v_invited_email <> v_user_email
  then
    raise exception 'leadership_invitation_email_mismatch';
  end if;

  update public.organization_people
  set
    auth_user_id = p_user_id,
    name = nullif(trim(v_user_name), ''),
    avatar_url = nullif(trim(v_user_image), ''),
    status = 'ativo',
    verified_at = now()
  where id = v_invitation.person_id
    and organization_id = v_invitation.organization_id;

  insert into public.organization_members (
    organization_id,
    user_id,
    role
  )
  values (
    v_invitation.organization_id,
    p_user_id,
    v_invitation.access_role
  )
  on conflict (organization_id, user_id)
  do update set role = case
    when public.organization_members.role in ('superadmin', 'cliente')
      then public.organization_members.role
    when excluded.role = 'cliente'
      then 'cliente'::public.auth_role
    else 'admin'::public.auth_role
  end;

  update app_private.leadership_invitations
  set
    accepted_at = now(),
    status = 'aceito'
  where id = v_invitation.id;

  return jsonb_build_object(
    'invitation_id', v_invitation.id,
    'organization_id', v_invitation.organization_id,
    'person_id', v_invitation.person_id,
    'sector_id', v_invitation.sector_id,
    'access_role', v_invitation.access_role
  );
end;
$$;

revoke all on function app_private.accept_leadership_invitation(text, uuid)
from public, anon, authenticated;
grant execute on function app_private.accept_leadership_invitation(text, uuid)
to service_role;
