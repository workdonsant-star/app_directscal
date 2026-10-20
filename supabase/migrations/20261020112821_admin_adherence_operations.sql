alter table app_private.asset_adherence_rules
  add column title text check(title is null or char_length(trim(title)) between 1 and 200),
  add column success_indicator text check(success_indicator is null or char_length(trim(success_indicator)) between 1 and 1000),
  add column change_reason text check(change_reason is null or char_length(trim(change_reason)) between 1 and 2000),
  add column write_payload jsonb;

create table app_private.adherence_transfer_receipts (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id),
  actor_user_id uuid not null references next_auth.users(id),
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default clock_timestamp()
);
create index adherence_transfer_receipts_org_idx on app_private.adherence_transfer_receipts(organization_id);
create index adherence_transfer_receipts_actor_idx on app_private.adherence_transfer_receipts(actor_user_id);
alter table app_private.adherence_transfer_receipts enable row level security;
revoke all on app_private.adherence_transfer_receipts from public,anon,authenticated,service_role;
grant select,insert on app_private.adherence_transfer_receipts to service_role;

create function app_private.save_admin_adherence_routine(
  p_organization_id uuid,p_actor_user_id uuid,p_id uuid,p_routine_id uuid,
  p_expected_rule_id uuid,p_expected_assignment_at timestamptz,p_input jsonb
) returns uuid language plpgsql security invoker set search_path='' set lock_timeout='5s' as $$
declare
  v_diagnostic uuid:=(p_input->>'diagnosticId')::uuid; v_action text:=p_input->>'actionPointId';
  v_current app_private.asset_adherence_rules; v_existing app_private.asset_adherence_rules;
  v_assignment public.action_point_assignments; v_name text; v_new_revision integer;
begin
  if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then
    raise exception 'Acesso restrito à operação.' using errcode='42501'; end if;
  perform 1 from public.diagnostics where id=v_diagnostic and organization_id=p_organization_id for update;
  if not found then raise exception 'Diagnóstico indisponível.' using errcode='PT404'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_routine_id::text,0));
  select * into v_existing from app_private.asset_adherence_rules where id=p_id;
  if found then
    if v_existing.routine_id=p_routine_id and v_existing.organization_id=p_organization_id
      and v_existing.created_by=p_actor_user_id and v_existing.write_payload=p_input then return v_existing.id; end if;
    raise exception 'Tentativa já utilizada.' using errcode='PT409'; end if;
  select * into v_current from app_private.asset_adherence_rules where routine_id=p_routine_id order by revision desc limit 1;
  if v_current.id is distinct from p_expected_rule_id then raise exception 'O acordo mudou.' using errcode='PT409'; end if;
  if v_current.id is not null and (v_current.organization_id<>p_organization_id or v_current.diagnostic_id<>v_diagnostic or v_current.action_point_id<>v_action) then
    raise exception 'Origem da rotina não pode ser trocada.' using errcode='PT409'; end if;
  if not exists(select 1 from public.admin_deliveries where diagnostic_id=v_diagnostic and organization_id=p_organization_id
    and status='publicada' and v_action=any(selected_action_point_ids)) then
    raise exception 'Action point não publicado.' using errcode='PT409'; end if;
  if not exists(select 1 from app_private.slack_installations where organization_id=p_organization_id and revoked_at is null
    and team_id=p_input->'assignee'->>'teamId') then raise exception 'Workspace alterado ou desconectado.' using errcode='PT409'; end if;
  if not exists(select 1 from public.organization_sectors where id=(p_input->>'sectorId')::uuid and organization_id=p_organization_id and active) then
    raise exception 'Setor indisponível.' using errcode='PT409'; end if;
  if coalesce(char_length(trim(p_input->>'title')),0) not between 1 and 200 or
     coalesce(char_length(trim(p_input->>'successIndicator')),0) not between 1 and 1000 or
     coalesce(char_length(trim(p_input->>'reason')),0) not between 1 and 2000 then
    raise exception 'Defina título, indicador e motivo.' using errcode='PT400'; end if;
  select * into v_assignment from public.action_point_assignments where diagnostic_id=v_diagnostic and action_point_id=v_action;
  if v_assignment.updated_at is distinct from p_expected_assignment_at then raise exception 'A atribuição mudou.' using errcode='PT409'; end if;
  if v_assignment.diagnostic_id is not null and (v_assignment.assignee_team_id is distinct from p_input->'assignee'->>'teamId' or
    v_assignment.assignee_slack_user_id is distinct from p_input->'assignee'->>'userId') then
    raise exception 'Use a transferência para trocar o responsável.' using errcode='PT409'; end if;
  if v_assignment.diagnostic_id is null then
    insert into public.action_point_assignments(diagnostic_id,action_point_id,organization_id,assignee_team_id,assignee_slack_user_id,assignee_name,assignee_avatar_url)
      values(v_diagnostic,v_action,p_organization_id,p_input->'assignee'->>'teamId',p_input->'assignee'->>'userId',p_input->'assignee'->>'name',p_input->'assignee'->>'avatarUrl');
    select coalesce(name,'Operação DirectScal') into v_name from next_auth.users where id=p_actor_user_id;
    insert into public.action_point_events(diagnostic_id,action_point_id,organization_id,kind,author_name,body,detail)
      values(v_diagnostic,v_action,p_organization_id,'atribuicao',v_name,'atribuiu o responsável pela operação DirectScal',p_input->>'reason');
  end if;
  v_new_revision:=coalesce(v_current.revision,0)+1;
  insert into app_private.asset_adherence_rules(id,routine_id,revision,organization_id,diagnostic_id,action_point_id,asset_id,asset_version_id,
    question_id,sector_id,assignee_team_id,assignee_user_id,schedule,expectation,created_by,title,success_indicator,change_reason,write_payload)
    values(p_id,p_routine_id,v_new_revision,p_organization_id,v_diagnostic,v_action,(p_input->>'assetId')::uuid,(p_input->>'assetVersionId')::uuid,
      (p_input->>'questionId')::uuid,(p_input->>'sectorId')::uuid,p_input->'assignee'->>'teamId',p_input->'assignee'->>'userId',
      p_input->'schedule',p_input->>'expectation',p_actor_user_id,trim(p_input->>'title'),trim(p_input->>'successIndicator'),trim(p_input->>'reason'),p_input);
  return p_id;
end;
$$;

create function app_private.transfer_admin_action_routines(
  p_organization_id uuid,p_actor_user_id uuid,p_id uuid,p_input jsonb
) returns jsonb language plpgsql security invoker set search_path='' set lock_timeout='5s' as $$
declare
  v_diagnostic uuid:=(p_input->>'diagnosticId')::uuid; v_action text:=p_input->>'actionPointId';
  v_assignment public.action_point_assignments; v_receipt app_private.adherence_transfer_receipts;
  v_rule app_private.asset_adherence_rules; v_rules jsonb; v_now timestamptz; v_name text; v_result jsonb;
begin
  if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then
    raise exception 'Acesso restrito à operação.' using errcode='42501'; end if;
  perform 1 from public.diagnostics where id=v_diagnostic and organization_id=p_organization_id for update;
  if not found then raise exception 'Diagnóstico indisponível.' using errcode='PT404'; end if;
  select * into v_receipt from app_private.adherence_transfer_receipts where id=p_id;
  if found then
    if v_receipt.organization_id=p_organization_id and v_receipt.actor_user_id=p_actor_user_id and v_receipt.payload=p_input then return v_receipt.result; end if;
    raise exception 'Tentativa já utilizada.' using errcode='PT409'; end if;
  if not exists(select 1 from public.admin_deliveries where diagnostic_id=v_diagnostic and organization_id=p_organization_id and status='publicada' and v_action=any(selected_action_point_ids)) then
    raise exception 'Action point não publicado.' using errcode='PT409'; end if;
  if not exists(select 1 from app_private.slack_installations where organization_id=p_organization_id and revoked_at is null and team_id=p_input->'assignee'->>'teamId') then
    raise exception 'Workspace alterado ou desconectado.' using errcode='PT409'; end if;
  if coalesce(char_length(trim(p_input->>'reason')),0) not between 1 and 1000 then raise exception 'Registre o motivo.' using errcode='PT400'; end if;
  -- Mesmo lock de pausa/criação de oportunidades, em ordem estável.
  for v_rule in select distinct on(routine_id) * from app_private.asset_adherence_rules
    where organization_id=p_organization_id and diagnostic_id=v_diagnostic and action_point_id=v_action order by routine_id,revision desc loop
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_rule.routine_id::text,0));
  end loop;
  select coalesce(jsonb_agg(jsonb_build_object('routineId',routine_id,'ruleId',id) order by routine_id),'[]'::jsonb) into v_rules
    from(select distinct on(routine_id) * from app_private.asset_adherence_rules
      where organization_id=p_organization_id and diagnostic_id=v_diagnostic and action_point_id=v_action order by routine_id,revision desc) latest;
  if v_rules is distinct from p_input->'expectedRules' then raise exception 'As rotinas mudaram. Revise a transferência.' using errcode='PT409'; end if;
  select * into v_assignment from public.action_point_assignments where diagnostic_id=v_diagnostic and action_point_id=v_action;
  if v_assignment.diagnostic_id is null or v_assignment.organization_id<>p_organization_id then raise exception 'Atribuição indisponível.' using errcode='PT404'; end if;
  if v_assignment.updated_at is distinct from (p_input->>'expectedUpdatedAt')::timestamptz then raise exception 'A atribuição mudou.' using errcode='PT409'; end if;
  if v_assignment.assignee_team_id=p_input->'assignee'->>'teamId' and v_assignment.assignee_slack_user_id=p_input->'assignee'->>'userId' then
    raise exception 'Escolha outra pessoa.' using errcode='PT400'; end if;
  update public.action_point_assignments set assignee_team_id=p_input->'assignee'->>'teamId',assignee_slack_user_id=p_input->'assignee'->>'userId',
    assignee_name=p_input->'assignee'->>'name',assignee_avatar_url=p_input->'assignee'->>'avatarUrl',updated_at=clock_timestamp()
    where diagnostic_id=v_diagnostic and action_point_id=v_action returning updated_at into v_now;
  for v_rule in select distinct on(routine_id) * from app_private.asset_adherence_rules
    where organization_id=p_organization_id and diagnostic_id=v_diagnostic and action_point_id=v_action order by routine_id,revision desc loop
    insert into app_private.asset_adherence_rules(routine_id,revision,organization_id,diagnostic_id,action_point_id,asset_id,asset_version_id,question_id,sector_id,
      assignee_team_id,assignee_user_id,schedule,expectation,created_by,title,success_indicator,change_reason)
      values(v_rule.routine_id,v_rule.revision+1,p_organization_id,v_diagnostic,v_action,v_rule.asset_id,v_rule.asset_version_id,v_rule.question_id,v_rule.sector_id,
        p_input->'assignee'->>'teamId',p_input->'assignee'->>'userId',v_rule.schedule,v_rule.expectation,p_actor_user_id,v_rule.title,v_rule.success_indicator,p_input->>'reason');
  end loop;
  select coalesce(name,'Operação DirectScal') into v_name from next_auth.users where id=p_actor_user_id;
  insert into public.action_point_events(diagnostic_id,action_point_id,organization_id,kind,author_name,body,detail)
    values(v_diagnostic,v_action,p_organization_id,'atribuicao',v_name,'transferiu o responsável e os acordos das rotinas',p_input->>'reason');
  v_result:=jsonb_build_object('updatedAt',v_now,'routineCount',jsonb_array_length(v_rules));
  insert into app_private.adherence_transfer_receipts(id,organization_id,actor_user_id,payload,result) values(p_id,p_organization_id,p_actor_user_id,p_input,v_result);
  return v_result;
end;
$$;

-- Troca pelo caminho de cliente não pode deixar acordos atuais divergentes.
create function app_private.check_action_routine_assignees() returns trigger language plpgsql security invoker set search_path='' as $$
declare v_assignment public.action_point_assignments;
begin
  select * into v_assignment from public.action_point_assignments where diagnostic_id=old.diagnostic_id and action_point_id=old.action_point_id;
  if exists(select 1 from(select distinct on(routine_id) assignee_team_id,assignee_user_id from app_private.asset_adherence_rules
    where diagnostic_id=old.diagnostic_id and action_point_id=old.action_point_id and organization_id=old.organization_id order by routine_id,revision desc) r
    where v_assignment.diagnostic_id is null or r.assignee_team_id is distinct from v_assignment.assignee_team_id or r.assignee_user_id is distinct from v_assignment.assignee_slack_user_id) then
    raise exception 'Transfira as rotinas pela operação DirectScal para preservar os acordos.' using errcode='PT409'; end if;
  return null;
end;
$$;
create constraint trigger action_routine_assignees_consistent after update or delete on public.action_point_assignments
  deferrable initially deferred for each row execute function app_private.check_action_routine_assignees();

revoke all on function app_private.save_admin_adherence_routine(uuid,uuid,uuid,uuid,uuid,timestamptz,jsonb) from public,anon,authenticated;
revoke all on function app_private.transfer_admin_action_routines(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function app_private.check_action_routine_assignees() from public,anon,authenticated;
grant execute on function app_private.save_admin_adherence_routine(uuid,uuid,uuid,uuid,uuid,timestamptz,jsonb) to service_role;
grant execute on function app_private.transfer_admin_action_routines(uuid,uuid,uuid,jsonb) to service_role;

create function app_private.get_admin_adherence_workspace(p_organization_id uuid,p_actor_user_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then raise exception 'Acesso restrito à operação.' using errcode='42501'; end if;
  if not exists(select 1 from public.organizations where id=p_organization_id) then raise exception 'Empresa indisponível.' using errcode='PT404'; end if;
  return jsonb_build_object(
    'companyName',(select name from public.organizations where id=p_organization_id),
    'actions',coalesce((select jsonb_agg(jsonb_build_object('diagnosticId',d.id,'diagnosticName',d.name,'actionPointId',selected.id,
      'assignment',case when a.diagnostic_id is not null then jsonb_build_object('teamId',a.assignee_team_id,'userId',a.assignee_slack_user_id,'name',a.assignee_name,'updatedAt',a.updated_at) else null end) order by d.name,selected.id)
      from public.admin_deliveries p join public.diagnostics d on d.id=p.diagnostic_id and d.organization_id=p.organization_id
      cross join lateral(select distinct unnest(p.selected_action_point_ids) id) selected
      left join public.action_point_assignments a on a.diagnostic_id=p.diagnostic_id and a.action_point_id=selected.id and a.organization_id=p.organization_id
      where p.organization_id=p_organization_id and p.status='publicada'),'[]'::jsonb),
    'questions',coalesce((select jsonb_agg(jsonb_build_object('id',q.id,'diagnosticId',d.id,'text',q.text) order by d.id,q.order_index,q.id)
      from public.diagnostics d join public.questions q on q.template_id=d.template_id
      where d.organization_id=p_organization_id and exists(select 1 from public.admin_deliveries p where p.diagnostic_id=d.id and p.organization_id=p_organization_id and p.status='publicada')),'[]'::jsonb),
    'assets',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'versionId',v.id,'title',a.title,'version',v.version_number) order by a.title,a.id)
      from public.management_assets a join public.management_asset_versions v on v.id=a.current_published_version_id and v.asset_id=a.id and v.organization_id=a.organization_id
      where a.organization_id=p_organization_id and a.status='publicado' and a.archived_at is null and v.published_at is not null),'[]'::jsonb),
    'sectors',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by name,id) from public.organization_sectors where organization_id=p_organization_id and active),'[]'::jsonb),
    'rules',coalesce((select jsonb_agg(to_jsonb(r)-'write_payload'||jsonb_build_object('actorName',coalesce(u.name,'Operação DirectScal')) order by r.created_at desc,r.id)
      from app_private.asset_adherence_rules r left join next_auth.users u on u.id=r.created_by where r.organization_id=p_organization_id),'[]'::jsonb),
    'events',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'routineId',e.routine_id,'action',e.action,'reason',e.reason,'recordedAt',e.recorded_at,'actorName',coalesce(u.name,'Operação DirectScal'),'sequence',e.sequence) order by e.sequence desc)
      from app_private.asset_adherence_routine_events e left join next_auth.users u on u.id=e.actor_user_id where e.organization_id=p_organization_id),'[]'::jsonb));
end;
$$;
revoke all on function app_private.get_admin_adherence_workspace(uuid,uuid) from public,anon,authenticated;
grant execute on function app_private.get_admin_adherence_workspace(uuid,uuid) to service_role;

create function app_private.get_customer_adherence_agreements(p_organization_id uuid,p_actor_user_id uuid,p_diagnostic_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') or
    not exists(select 1 from public.organization_members where user_id=p_actor_user_id and organization_id=p_organization_id and role in ('cliente','admin')) then
    raise exception 'Acesso restrito à empresa.' using errcode='42501'; end if;
  if not exists(select 1 from public.diagnostics d where d.id=p_diagnostic_id and d.organization_id=p_organization_id and (
    d.created_by_user_id=p_actor_user_id or d.created_by_user_id is null or
    exists(select 1 from public.organization_members where user_id=p_actor_user_id and organization_id=p_organization_id and role='cliente') or
    exists(select 1 from public.diagnostic_sector_scopes s join public.diagnostic_leader_assignments l on l.diagnostic_sector_scope_id=s.id
      join public.organization_people person on person.id=l.person_id where s.diagnostic_id=d.id and person.auth_user_id=p_actor_user_id and person.status='ativo')
  )) then raise exception 'Diagnóstico indisponível.' using errcode='PT404'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'routineId',r.routine_id,'actionPointId',r.action_point_id,
    'title',r.title,'expectation',r.expectation,'successIndicator',r.success_indicator,'revision',r.revision,
    'question',q.text,'sector',s.name,'assigneeName',a.assignee_name,'assetId',asset.id,'assetType',asset.type,'assetTitle',asset.title,
    'assetVersion',v.version_number,'assetAvailable',asset.status='publicado' and asset.archived_at is null,
    'schedule',r.schedule,'paused',coalesce((select action='pausar' from app_private.asset_adherence_routine_events e where e.routine_id=r.routine_id and e.organization_id=p_organization_id order by sequence desc limit 1),false)) order by r.title,r.id)
    from(select distinct on(routine_id) * from app_private.asset_adherence_rules where organization_id=p_organization_id and diagnostic_id=p_diagnostic_id order by routine_id,revision desc) r
    join public.admin_deliveries p on p.diagnostic_id=r.diagnostic_id and p.organization_id=r.organization_id and p.status='publicada' and r.action_point_id=any(p.selected_action_point_ids)
    join public.management_assets asset on asset.id=r.asset_id and asset.organization_id=r.organization_id
    join public.management_asset_versions v on v.id=r.asset_version_id and v.asset_id=asset.id
    join public.questions q on q.id=r.question_id
    join public.organization_sectors s on s.id=r.sector_id and s.organization_id=r.organization_id
    left join public.action_point_assignments a on a.diagnostic_id=r.diagnostic_id and a.action_point_id=r.action_point_id and a.organization_id=r.organization_id),'[]'::jsonb);
end;
$$;
revoke all on function app_private.get_customer_adherence_agreements(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function app_private.get_customer_adherence_agreements(uuid,uuid,uuid) to service_role;

create index asset_adherence_rules_action_revision_idx on app_private.asset_adherence_rules(organization_id,diagnostic_id,action_point_id,routine_id,revision desc);
notify pgrst,'reload schema';
