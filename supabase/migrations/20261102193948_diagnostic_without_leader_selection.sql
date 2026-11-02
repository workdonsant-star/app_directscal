-- Permite ativar uma coleta sem setores, mantendo um link geral de Time.
create or replace function app_private.activate_diagnostic_with_links(
  p_diagnostic_id uuid,
  p_actor_user_id uuid,
  p_activated_at timestamptz
)
returns table (
  diagnostic_id uuid,
  group_id public.respondent_group,
  sector_id uuid,
  token text
)
language plpgsql
security definer
set search_path = public, next_auth, app_private, pg_temp
as $$
declare
  v_organization_id uuid;
  v_status public.diagnostic_status;
begin
  select diagnostic.organization_id, diagnostic.status
  into v_organization_id, v_status
  from public.diagnostics diagnostic
  where diagnostic.id = p_diagnostic_id
  for update;

  if v_organization_id is null then
    raise exception 'Diagnóstico não encontrado.' using errcode = 'P0002';
  end if;

  if v_status <> 'rascunho' then
    raise exception 'Somente rascunhos podem ser ativados.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.diagnostics diagnostic
    where diagnostic.id = p_diagnostic_id
      and (
        diagnostic.created_by_user_id = p_actor_user_id
        or exists (
          select 1
          from public.organization_members member
          where member.organization_id = diagnostic.organization_id
            and member.user_id = p_actor_user_id
            and member.role = 'cliente'
        )
      )
  ) then
    raise exception 'Usuário sem permissão para ativar o diagnóstico.' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.diagnostic_sector_scopes scope
    where scope.diagnostic_id = p_diagnostic_id
  ) then
    delete from public.diagnostic_share_links share_link
    where share_link.diagnostic_id = p_diagnostic_id
      and share_link.group_id = 'operacao'
      and share_link.sector_id is null
      and not exists (
        select 1 from public.response_sessions response_session
        where response_session.share_link_id = share_link.id
      );
  else
    insert into public.diagnostic_share_links (diagnostic_id, group_id, token)
    select p_diagnostic_id, 'operacao',
      p_diagnostic_id || '-operacao-' || gen_random_uuid()
    where not exists (
      select 1 from public.diagnostic_share_links share_link
      where share_link.diagnostic_id = p_diagnostic_id
        and share_link.group_id = 'operacao'
        and share_link.sector_id is null
    );
  end if;

  insert into public.diagnostic_share_links (diagnostic_id, group_id, token)
  values
    (p_diagnostic_id, 'fundador', p_diagnostic_id || '-fundador-' || gen_random_uuid()),
    (p_diagnostic_id, 'lideranca', p_diagnostic_id || '-lideranca-' || gen_random_uuid())
  on conflict do nothing;

  insert into public.diagnostic_share_links (
    diagnostic_id,
    group_id,
    sector_id,
    token
  )
  select
    p_diagnostic_id,
    'operacao',
    scope.sector_id,
    p_diagnostic_id || '-operacao-' || scope.sector_id || '-' || gen_random_uuid()
  from public.diagnostic_sector_scopes scope
  where scope.diagnostic_id = p_diagnostic_id
  on conflict do nothing;

  update public.diagnostics
  set activated_at = p_activated_at,
      status = 'ativo'
  where id = p_diagnostic_id;

  return query
  select
    share_link.diagnostic_id,
    share_link.group_id,
    share_link.sector_id,
    share_link.token
  from public.diagnostic_share_links share_link
  where share_link.diagnostic_id = p_diagnostic_id
  order by
    case share_link.group_id
      when 'fundador' then 1
      when 'lideranca' then 2
      else 3
    end,
    share_link.sector_id;
end;
$$;


revoke all on function app_private.activate_diagnostic_with_links(uuid, uuid, timestamptz) from public, anon, authenticated;
grant execute on function app_private.activate_diagnostic_with_links(uuid, uuid, timestamptz) to service_role;
