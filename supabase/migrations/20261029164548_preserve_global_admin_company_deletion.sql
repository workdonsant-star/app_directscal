-- Exclusão integral é uma operação administrativa distinta da exclusão de ativos.
-- As FKs e as proteções históricas continuam vigentes fora desta operação.
create or replace function app_private.delete_admin_companies(
  p_actor_user_id uuid, p_organization_ids uuid[], p_confirmation text
) returns jsonb
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare
  v_ids uuid[]; v_users uuid[]; v_user uuid; v_ref record; v_retained boolean;
  v_deleted_users integer := 0; v_retained_users integer := 0; v_count integer; v_internal uuid;
begin
  if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then
    raise exception using errcode='42501',message='Superadmin required';
  end if;
  if p_confirmation is distinct from 'EXCLUIR' or coalesce(cardinality(p_organization_ids),0) not between 1 and 100
    or array_position(p_organization_ids,null) is not null then
    raise exception using errcode='PT400',message='Invalid selection';
  end if;
  select array_agg(distinct id order by id) into v_ids from unnest(p_organization_ids) id;
  if cardinality(v_ids)<>cardinality(p_organization_ids) then
    raise exception using errcode='PT400',message='Duplicate selection';
  end if;
  perform id from public.organizations where id=any(v_ids) order by id for update;
  get diagnostics v_count=row_count;
  if v_count<>cardinality(v_ids) then raise exception using errcode='PT404',message='Organization missing'; end if;
  if exists(select 1 from public.organizations where id=any(v_ids) and domain='global-admin.directscal.invalid') then
    raise exception using errcode='PT403',message='Internal access organization protected';
  end if;

  select coalesce(array_agg(distinct user_id),'{}'::uuid[]) into v_users from (
    select user_id from public.organization_members where organization_id=any(v_ids)
    union select auth_user_id from public.organization_people where organization_id=any(v_ids)
    union select user_id from public.acquisition_leads where organization_id=any(v_ids)
    union select user_id from app_private.acquisition_account_setups where organization_id=any(v_ids)
  ) u where user_id is not null;
  -- Bloqueia novos vínculos de conta enquanto decide quais usuários são exclusivos.
  perform id from next_auth.users where id=any(v_users) order by id for update;
  perform id from app_private.slack_delivery_jobs where organization_id=any(v_ids) order by id for update;
  if exists(select 1 from app_private.slack_delivery_jobs where organization_id=any(v_ids) and status='processando') then
    raise exception using errcode='PT409',message='Slack processing in progress';
  end if;

  -- Conserva somente papéis globais já existentes, nunca promove contas de cliente.
  -- O registro interno não contém dados de cliente nem aparece na aquisição.
  if exists(select 1 from public.organization_members where organization_id=any(v_ids) and role='superadmin') then
    insert into public.organizations(name,domain,employee_count)
      values('Administração Directscal','global-admin.directscal.invalid',1)
      on conflict(domain) do update set domain=excluded.domain returning id into v_internal;
    insert into public.organization_members(organization_id,user_id,role)
      select distinct v_internal,user_id,role
      from public.organization_members where organization_id=any(v_ids) and role='superadmin'
      on conflict(organization_id,user_id) do update set role=excluded.role;
  end if;

  delete from app_private.routine_supervision_events where organization_id=any(v_ids);
  delete from app_private.routine_reply_proposals where organization_id=any(v_ids);
  delete from app_private.routine_event_occurrences where organization_id=any(v_ids);
  delete from app_private.routine_contact_reservations where organization_id=any(v_ids);
  delete from app_private.routine_contact_jobs where organization_id=any(v_ids);
  delete from app_private.routine_reminder_checks where cycle_id in (select id from app_private.asset_adherence_cycles where organization_id=any(v_ids));
  delete from app_private.asset_adherence_facts where organization_id=any(v_ids);
  delete from app_private.asset_adherence_cycles where organization_id=any(v_ids);
  delete from app_private.routine_result_baselines where organization_id=any(v_ids);
  delete from app_private.routine_schedule_positions where organization_id=any(v_ids);
  delete from app_private.asset_adherence_routine_events where organization_id=any(v_ids);
  delete from app_private.adherence_transfer_receipts where organization_id=any(v_ids);
  delete from app_private.asset_adherence_rules where organization_id=any(v_ids);
  delete from app_private.routine_contact_policies where organization_id=any(v_ids);
  delete from app_private.agent_gap_reviews where organization_id=any(v_ids);
  -- O módulo de investigação já existe no banco conectado, mas é opcional em bases antigas.
  if to_regclass('app_private.delivery_investigation_snapshots') is not null then
    execute 'delete from app_private.delivery_investigation_snapshots where diagnostic_id in (select id from public.diagnostics where organization_id=any($1))' using v_ids;
  end if;
  if to_regclass('app_private.diagnostic_investigation_revisions') is not null then
    execute 'delete from app_private.diagnostic_investigation_revisions where organization_id=any($1)' using v_ids;
  end if;
  delete from app_private.acquisition_account_setups where organization_id=any(v_ids);
  delete from public.acquisition_leads where organization_id=any(v_ids);
  delete from app_private.slack_identity_links where organization_id=any(v_ids);
  delete from app_private.slack_identity_challenges where organization_id=any(v_ids);
  delete from app_private.slack_event_receipts where team_id in (select team_id from app_private.slack_installations where organization_id=any(v_ids));
  delete from app_private.slack_delivery_jobs where organization_id=any(v_ids);
  -- Respostas precedem links; pesquisas precedem pessoas/setores (FKs RESTRICT).
  delete from public.response_sessions where diagnostic_id in (select id from public.diagnostics where organization_id=any(v_ids));
  delete from public.diagnostics where organization_id=any(v_ids);
  -- Evita SET NULL composto em organization_id, que é NOT NULL, ao remover versões.
  update public.management_assets set current_published_version_id=null where organization_id=any(v_ids);
  delete from public.management_assets where organization_id=any(v_ids);
  delete from public.organizations where id=any(v_ids);

  foreach v_user in array v_users loop
    v_retained := v_user=p_actor_user_id;
    -- Qualquer referência de domínio sobrevivente pertence a dados fora do lote.
    -- Perfis/credenciais/sessões são pessoais e serão removidos por suas FKs CASCADE.
    for v_ref in
      select n.nspname,c.relname,a.attname from pg_catalog.pg_constraint fk
      join pg_catalog.pg_class c on c.oid=fk.conrelid
      join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      join pg_catalog.pg_attribute a on a.attrelid=c.oid and a.attnum=fk.conkey[1]
      where fk.contype='f' and fk.confrelid='next_auth.users'::regclass
        and n.nspname in ('public','app_private')
        and fk.conrelid not in ('public.account_profiles'::regclass,'app_private.user_password_credentials'::regclass,
          'app_private.user_session_versions'::regclass,'app_private.password_reset_requests'::regclass,
          'app_private.password_change_attempts'::regclass)
    loop
      exit when v_retained;
      execute format('select exists(select 1 from %I.%I where %I=$1)',v_ref.nspname,v_ref.relname,v_ref.attname)
        into v_retained using v_user;
    end loop;
    if v_retained then
      v_retained_users := v_retained_users+1;
    else
      delete from next_auth.verification_tokens where identifier in (select email from next_auth.users where id=v_user);
      delete from next_auth.users where id=v_user;
      get diagnostics v_count=row_count;
      v_deleted_users := v_deleted_users+v_count;
    end if;
  end loop;
  return jsonb_build_object('deletedCompanyIds',(select jsonb_agg('company_'||id::text order by id) from unnest(v_ids) id),
    'deletedUsers',v_deleted_users,'retainedUsers',v_retained_users);
end $$;

revoke all on function app_private.delete_admin_companies(uuid,uuid[],text) from public,anon,authenticated;
grant execute on function app_private.delete_admin_companies(uuid,uuid[],text) to service_role;
-- Históricos continuam sem DELETE público; somente o servidor pode executar a operação.
grant delete on app_private.routine_supervision_events,app_private.routine_reply_proposals,
  app_private.routine_event_occurrences,app_private.routine_contact_reservations,app_private.routine_contact_jobs,
  app_private.routine_reminder_checks,app_private.asset_adherence_facts,app_private.asset_adherence_cycles,
  app_private.routine_result_baselines,app_private.routine_schedule_positions,app_private.asset_adherence_routine_events,
  app_private.adherence_transfer_receipts,app_private.asset_adherence_rules,app_private.routine_contact_policies,
  app_private.agent_gap_reviews,
  app_private.acquisition_account_setups,app_private.slack_identity_links,app_private.slack_identity_challenges,
  app_private.slack_event_receipts,app_private.slack_delivery_jobs to service_role;

do $$ begin
  if to_regclass('app_private.delivery_investigation_snapshots') is not null then
    grant delete on app_private.delivery_investigation_snapshots to service_role;
  end if;
  if to_regclass('app_private.diagnostic_investigation_revisions') is not null then
    grant delete on app_private.diagnostic_investigation_revisions to service_role;
  end if;
end $$;
