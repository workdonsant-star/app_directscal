begin;
do $$
declare
  v_owner uuid := gen_random_uuid();
  v_admin uuid := gen_random_uuid();
  v_org uuid := gen_random_uuid();
  v_other_org uuid := gen_random_uuid();
  v_team text := 'T' || upper(replace(gen_random_uuid()::text, '-', ''));
  v_result jsonb;
  v_leader uuid;
  v_sector uuid;
  v_diagnostic uuid;
  v_template uuid;
  v_person uuid;
  v_legacy_sector uuid;
  v_count integer;
begin
  insert into next_auth.users(id,email,name) values
    (v_owner, v_owner::text || '@fixture.invalid', 'Fixture owner'),
    (v_admin, v_admin::text || '@fixture.invalid', 'Fixture admin');
  insert into public.organizations(id,name) values (v_org,'Fixture Slack'), (v_other_org,'Fixture other');
  insert into public.organization_members(organization_id,user_id,role) values
    (v_org,v_owner,'cliente'), (v_org,v_admin,'admin');
  insert into app_private.slack_installations(team_id,organization_id,bot_token,scope)
    values(v_team,v_org,'fixture-not-a-real-token','users:read,im:write');

  v_result := app_private.create_slack_sector_leader(v_org,v_owner,'Operações',v_team,'UQA123',null);
  v_leader := (v_result->>'leaderId')::uuid;
  v_sector := (v_result->>'sectorId')::uuid;
  if exists(select 1 from public.organization_people where organization_id=v_org) then
    raise exception 'Diretório foi copiado para organization_people';
  end if;
  select count(*) into v_count from public.organization_members where organization_id=v_org;
  if v_count <> 2 then raise exception 'Liderança recebeu acesso ao painel'; end if;

  begin
    perform app_private.create_slack_sector_leader(v_org,v_admin,'Negado',v_team,'UQA123',null);
    raise exception 'Admin criou liderança';
  exception when insufficient_privilege then null; end;
  begin
    perform app_private.create_slack_sector_leader(v_other_org,v_owner,'Outra empresa',v_team,'UQA123',null);
    raise exception 'Vazamento entre empresas';
  exception when insufficient_privilege then null; end;
  begin
    perform app_private.create_slack_sector_leader(v_org,v_owner,'Outro Slack','TOUTRO','UQA123',null);
    raise exception 'Workspace incorreto aceito';
  exception when invalid_parameter_value then null; end;
  begin
    perform app_private.create_slack_sector_leader(v_org,v_owner,'Operações',v_team,'UQA999',null);
    raise exception 'Setor duplicado aceito';
  exception when unique_violation then null; end;

  select id into v_template from public.diagnostic_templates limit 1;
  insert into public.diagnostics(organization_id,template_id,name,created_by_user_id,status)
    values(v_org,v_template,'Fixture pesquisa',v_owner,'rascunho') returning id into v_diagnostic;
  perform app_private.sync_diagnostic_leaders(v_diagnostic,v_owner,array[v_leader]);
  select count(*) into v_count from app_private.diagnostic_slack_leader_assignments assignment
    join public.diagnostic_sector_scopes scope on scope.id=assignment.diagnostic_sector_scope_id
    where scope.diagnostic_id=v_diagnostic and assignment.slack_leader_id=v_leader;
  if v_count <> 1 then raise exception 'Referência Slack não vinculada ao diagnóstico'; end if;
  perform app_private.activate_diagnostic_with_links(v_diagnostic,v_owner,now());
  if not exists(select 1 from public.diagnostic_share_links where diagnostic_id=v_diagnostic and sector_id=v_sector and group_id='operacao') then
    raise exception 'Link setorial não criado';
  end if;
  begin
    perform app_private.sync_diagnostic_leaders(v_diagnostic,v_owner,array[v_leader]);
    raise exception 'Pesquisa ativa foi reconfigurada';
  exception when invalid_parameter_value then null; end;

  -- Compatibilidade com lideranças que já existiam antes do novo fluxo.
  update public.diagnostics set status='rascunho' where id=v_diagnostic;
  insert into public.organization_people(organization_id,auth_user_id,email,position,status)
    values(v_org,v_admin,v_admin::text || '@fixture.invalid','Gestora','ativo') returning id into v_person;
  insert into public.organization_sectors(organization_id,name) values(v_org,'Legado') returning id into v_legacy_sector;
  insert into public.organization_sector_memberships(organization_id,sector_id,person_id,role)
    values(v_org,v_legacy_sector,v_person,'lideranca');
  perform app_private.sync_diagnostic_leaders(v_diagnostic,v_owner,array[v_leader,v_person]);
  select count(*) into v_count from public.diagnostic_sector_scopes where diagnostic_id=v_diagnostic;
  if v_count <> 2 then raise exception 'Seleção mista perdeu setores'; end if;
  perform app_private.sync_diagnostic_leaders(v_diagnostic,v_owner,array[v_leader,v_person]);
  select count(*) into v_count from app_private.diagnostic_slack_leader_assignments where organization_id=v_org;
  if v_count <> 1 then raise exception 'Reconfiguração duplicou vínculo Slack'; end if;
  perform app_private.sync_diagnostic_leaders(v_diagnostic,v_owner,array[]::uuid[]);
  if exists(select 1 from public.diagnostic_sector_scopes where diagnostic_id=v_diagnostic) then
    raise exception 'Seleção vazia não limpou escopos';
  end if;
end $$;
rollback;
select true as slack_leadership_transaction_checks_passed;
