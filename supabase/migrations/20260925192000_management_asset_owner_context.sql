-- Resolves the first management-asset owner from the existing authenticated
-- customer account. The email is used only to locate the already-established
-- organization membership; no organization or user is fabricated.
do $$
declare
  v_organization_id uuid;
begin
  select organization_members.organization_id
    into v_organization_id
  from public.organization_members
  join next_auth.users
    on next_auth.users.id = organization_members.user_id
  where lower(next_auth.users.email) = 'dan.sz.snt@gmail.com'
    and organization_members.role = 'cliente'::public.auth_role
  order by organization_members.created_at
  limit 1;

  if v_organization_id is null then
    raise exception
      'Não foi encontrada uma organização para o usuário do SOP de geração de papéis';
  end if;

  update public.organizations
  set
    name = 'Daniel de Souza Santos LTDA',
    updated_at = now()
  where id = v_organization_id
    and name is distinct from 'Daniel de Souza Santos LTDA';
end
$$;
