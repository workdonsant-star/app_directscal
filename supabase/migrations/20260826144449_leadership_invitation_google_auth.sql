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

  update app_private.leadership_invitations
  set
    accepted_at = now(),
    status = 'aceito'
  where id = v_invitation.id;

  return jsonb_build_object(
    'invitation_id', v_invitation.id,
    'organization_id', v_invitation.organization_id,
    'person_id', v_invitation.person_id,
    'sector_id', v_invitation.sector_id
  );
end;
$$;

revoke all on function app_private.accept_leadership_invitation(text, uuid)
from public, anon, authenticated;
grant execute on function app_private.accept_leadership_invitation(text, uuid)
to service_role;
