-- Lê em uma única ida ao banco o que toda página autenticada precisa antes de
-- renderizar: versão de sessão, conta, vínculos, empresa da sessão, perfil,
-- módulos liberados, conclusão do onboarding e conexão Slack da empresa principal.
-- Somente leitura; a autorização continua sendo decidida no servidor do app.
create or replace function app_private.get_user_access_snapshot(p_user_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with member_rows as (
    select m.organization_id, m.role::text as role, m.created_at
    from public.organization_members m
    where m.user_id = p_user_id
  ),
  primary_member as (
    select organization_id from member_rows
    order by created_at asc, organization_id asc
    limit 1
  ),
  session_member as (
    select organization_id from member_rows
    order by (role = 'superadmin') desc, created_at asc, organization_id asc
    limit 1
  )
  select jsonb_build_object(
    'session_version', app_private.get_user_session_version(p_user_id),
    'user', (
      select jsonb_build_object('id', u.id, 'email', u.email, 'name', u.name, 'image', u.image)
      from next_auth.users u
      where u.id = p_user_id
    ),
    'memberships', coalesce((
      select jsonb_agg(
        jsonb_build_object('organization_id', organization_id, 'role', role)
        order by created_at asc, organization_id asc
      )
      from member_rows
    ), '[]'::jsonb),
    'organization', (
      select jsonb_build_object('id', o.id, 'name', o.name, 'employee_count', o.employee_count)
      from public.organizations o
      join session_member s on s.organization_id = o.id
    ),
    'profile', (
      select jsonb_build_object('name', p.name, 'avatar_url', p.avatar_url)
      from public.account_profiles p
      where p.user_id = p_user_id
    ),
    'module_access', coalesce((
      select jsonb_agg(jsonb_build_object(
        'organization_id', a.organization_id,
        'module_id', a.module_id,
        'enabled', a.enabled
      ))
      from public.organization_module_access a
      where a.organization_id in (select organization_id from member_rows)
    ), '[]'::jsonb),
    'onboarding_completed', exists (
      select 1
      from app_private.client_onboarding_completions c
      join primary_member pm on pm.organization_id = c.organization_id
    ),
    'slack_connected', exists (
      select 1
      from app_private.slack_installations i
      join primary_member pm on pm.organization_id = i.organization_id
      where i.revoked_at is null
    )
  );
$$;

revoke all on function app_private.get_user_access_snapshot(uuid) from public, anon, authenticated;
grant execute on function app_private.get_user_access_snapshot(uuid) to service_role;

notify pgrst, 'reload schema';
