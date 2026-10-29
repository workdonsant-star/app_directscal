begin;
set local statement_timeout='30s';
do $$
declare
  v_actor uuid:=gen_random_uuid(); v_owner uuid:=gen_random_uuid(); v_shared uuid:=gen_random_uuid();
  v_global uuid:=gen_random_uuid(); v_org uuid:=gen_random_uuid(); v_org2 uuid:=gen_random_uuid(); v_other uuid:=gen_random_uuid();
  v_template uuid:=gen_random_uuid(); v_dimension uuid:=gen_random_uuid(); v_question uuid:=gen_random_uuid();
  v_diag uuid:=gen_random_uuid(); v_asset uuid:=gen_random_uuid(); v_version uuid:=gen_random_uuid(); v_sector uuid:=gen_random_uuid();
  v_rule uuid:=gen_random_uuid(); v_routine uuid:=gen_random_uuid(); v_cycle uuid:=gen_random_uuid(); v_link uuid:=gen_random_uuid();
  v_campaign text:='fixture-'||gen_random_uuid(); v_team text:='TFIXTURE'||gen_random_uuid(); v_job uuid:=gen_random_uuid();
  v_lead uuid:=gen_random_uuid(); v_result jsonb; v_ref record; v_count integer; v_security text;
begin
  insert into next_auth.users(id,email,name) values
    (v_actor,v_actor||'@fixture.invalid','Operação fictícia'),(v_owner,v_owner||'@fixture.invalid','Conta exclusiva'),(v_shared,v_shared||'@fixture.invalid','Conta compartilhada');
  insert into public.organizations(id,name) values(v_global,'Operação fixture'),(v_org,'Empresa fixture'),(v_org2,'Segunda fixture'),(v_other,'Empresa preservada');
  insert into public.organization_members(organization_id,user_id,role) values
    (v_global,v_actor,'superadmin'),(v_org,v_owner,'cliente'),(v_org,v_shared,'admin'),(v_other,v_shared,'cliente');
  insert into public.account_profiles(user_id,name) values(v_owner,'Conta exclusiva');
  insert into app_private.user_password_credentials(user_id,password_hash) values(v_owner,'fixture-not-a-valid-hash');
  insert into next_auth.accounts(type,provider,"providerAccountId","userId") values('oauth','google',v_owner::text,v_owner);
  insert into next_auth.sessions(expires,"sessionToken","userId") values(now()+interval '1 day',v_owner::text,v_owner);
  insert into next_auth.verification_tokens(identifier,token,expires) values(v_owner||'@fixture.invalid',v_owner::text,now()+interval '1 day');
  insert into public.organization_people(organization_id,auth_user_id,email,position) values(v_org,v_owner,v_owner||'@fixture.invalid','Direção');
  insert into public.acquisition_campaigns(id,module_id,name,source,token,public_path) values(v_campaign,'module_omdx','Campanha fixture','Fixture',v_campaign,'/a/'||v_campaign);
  insert into public.acquisition_leads(id,module_id,campaign_id,user_id,organization_id,name,email,company_name,status)
    values(v_lead,'module_omdx',v_campaign,v_owner,v_org,'Pessoa fictícia',v_owner||'@fixture.invalid','Empresa fixture','account_created');
  insert into app_private.acquisition_account_setups(user_id,organization_id,lead_id,payload_hash) values(v_owner,v_org,v_lead,repeat('a',64));

  insert into public.diagnostic_templates(id,slug,version,name,description,is_locked) values(v_template,'fixture-'||v_template,1,'Instrumento fixture','Somente teste',false);
  insert into public.dimensions(id,slug,number,name,short_name,question,description) values(v_dimension,'fixture-'||v_dimension,1,'Dimensão fixture','Fixture','Questão fixture','Teste');
  insert into public.questions(id,template_id,dimension_id,order_index,text,is_locked) values(v_question,v_template,v_dimension,1,'Pergunta fictícia',false);
  if to_regclass('app_private.omdx_instrument_releases') is not null then
    insert into app_private.omdx_instrument_releases(template_id,approved_by,approved_at,approval_reference,scoring_version) values(v_template,v_actor,now(),'fixture','fixture');
  end if;
  insert into public.diagnostics(id,organization_id,template_id,name,status) values(v_diag,v_org,v_template,'Pesquisa fixture','encerrado');
  insert into public.diagnostic_share_links(id,diagnostic_id,group_id,token) values(v_link,v_diag,'fundador',v_link::text);
  insert into public.response_sessions(diagnostic_id,share_link_id,group_id) values(v_diag,v_link,'fundador');
  insert into public.admin_deliveries(diagnostic_id,organization_id,status,published_at,selected_action_point_ids)
    values(v_diag,v_org,'publicada',now(),array['action_processos_ritual']);
  insert into public.organization_sectors(id,organization_id,name) values(v_sector,v_org,'Setor fixture');
  insert into public.action_point_assignments(diagnostic_id,action_point_id,organization_id,assignee_team_id,assignee_slack_user_id,assignee_name)
    values(v_diag,'action_processos_ritual',v_org,v_team,'UFIXTURE','Pessoa fictícia');
  insert into public.management_assets(id,organization_id,type,title,status) values(v_asset,v_org,'sop','Ativo fixture','rascunho');
  insert into public.management_asset_versions(id,asset_id,organization_id,version_number,content_format,content,review_status,published_at,index_status)
    values(v_version,v_asset,v_org,1,'json','{}','publicado',now(),'pronto');
  update public.management_assets set status='publicado',current_published_version_id=v_version where id=v_asset;
  insert into public.management_asset_chunks(organization_id,asset_id,version_id,ordinal,heading_path,content) values(v_org,v_asset,v_version,0,'Fixture','Conteúdo fictício');
  insert into app_private.asset_adherence_rules(id,routine_id,revision,organization_id,diagnostic_id,action_point_id,asset_id,asset_version_id,question_id,sector_id,assignee_team_id,assignee_user_id,schedule,expectation,created_by)
    values(v_rule,v_routine,1,v_org,v_diag,'action_processos_ritual',v_asset,v_version,v_question,v_sector,v_team,'UFIXTURE','{"kind":"periodica","cadence":"semanal","timeZone":"America/Sao_Paulo"}','Conferir rotina',v_actor);
  insert into app_private.asset_adherence_cycles(id,organization_id,rule_id,routine_id,opportunity_key,opens_at,due_at)
    values(v_cycle,v_org,v_rule,v_routine,'fixture',now()-interval '2 days',now()-interval '1 day');
  insert into app_private.asset_adherence_facts(id,organization_id,cycle_id,actor_user_id,payload)
    values(gen_random_uuid(),v_org,v_cycle,v_owner,'{"kind":"leitura_confirmada"}');
  insert into app_private.routine_reminder_checks(cycle_id) values(v_cycle);
  insert into app_private.slack_installations(team_id,team_name,organization_id,bot_user_id,bot_token,scope)
    values(v_team,'Workspace fictício',v_org,'BFIXTURE','fixture-invalid-token','');
  insert into app_private.slack_event_receipts(event_id,team_id) values(v_job::text,v_team);
  insert into app_private.slack_delivery_jobs(id,event_id,organization_id,team_id,question,status,lease_id,lease_until)
    values(v_job,v_job::text,v_org,v_team,'{}','processando',gen_random_uuid(),now()+interval '3 minutes');

  if has_function_privilege('anon','app_private.delete_admin_companies(uuid,uuid[],text)','execute') or
     has_function_privilege('authenticated','app_private.delete_admin_companies(uuid,uuid[],text)','execute') then raise exception 'RPC pública'; end if;
  execute 'set local role service_role';
  begin
    perform app_private.delete_admin_companies(v_owner,array[v_org],'EXCLUIR');
    raise exception 'Cliente excluiu empresa';
  exception when insufficient_privilege then null; end;
  begin
    perform app_private.delete_admin_companies(v_actor,array[v_org],'');
    raise exception 'Confirmação ausente aceita';
  exception when sqlstate 'PT400' then null; end;
  begin
    perform app_private.delete_admin_companies(v_actor,array[v_org,v_org],'EXCLUIR');
    raise exception 'Duplicata aceita';
  exception when sqlstate 'PT400' then null; end;
  begin
    perform app_private.delete_admin_companies(v_actor,array[v_org,gen_random_uuid()],'EXCLUIR');
    raise exception 'Lote parcialmente existente aceito';
  exception when sqlstate 'PT404' then null; end;
  begin
    perform app_private.delete_admin_companies(v_actor,array[v_org],'EXCLUIR');
    raise exception 'Envio em andamento não bloqueou';
  exception when sqlstate 'PT409' then null; end;
  execute 'reset role';
  if not exists(select 1 from public.management_asset_versions where id=v_version) or not exists(select 1 from public.acquisition_leads where id=v_lead) then raise exception 'Falha apagou dados'; end if;
  update app_private.slack_delivery_jobs set status='recebido',lease_id=null,lease_until=null where id=v_job;
  v_security:=app_private.get_user_session_version(v_shared);
  -- Uma falha posterior à remoção deve restaurar todo o lote e seus usuários.
  begin
    execute 'set local role service_role';
    perform app_private.delete_admin_companies(v_actor,array[v_org,v_org2,v_global],'EXCLUIR');
    raise exception using errcode='PT418',message='Falha fictícia após exclusão';
  exception when sqlstate 'PT418' then null; end;
  if not exists(select 1 from public.organizations where id=v_org2) or not exists(select 1 from public.management_asset_versions where id=v_version)
    or not exists(select 1 from app_private.asset_adherence_rules where id=v_rule) or not exists(select 1 from next_auth.users where id=v_owner)
    or app_private.get_user_session_version(v_shared)<>v_security then raise exception 'Rollback incompleto'; end if;
  execute 'set local role service_role';
  v_result:=app_private.delete_admin_companies(v_actor,array[v_org,v_org2,v_global],'EXCLUIR');
  execute 'reset role';
  set constraints all immediate;
  if jsonb_array_length(v_result->'deletedCompanyIds')<>3 or (v_result->>'deletedUsers')::integer<>1 or (v_result->>'retainedUsers')::integer<>2 then raise exception 'Contagens incorretas: %',v_result; end if;
  if exists(select 1 from public.organizations where id=v_global) or not exists(
    select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
    where m.user_id=v_actor and m.role='superadmin' and o.domain='global-admin.directscal.invalid'
  ) then raise exception 'Acesso global não foi preservado'; end if;
  begin
    perform app_private.delete_admin_companies(v_actor,array[(select id from public.organizations where domain='global-admin.directscal.invalid')],'EXCLUIR');
    raise exception 'Registro interno apagado';
  exception when sqlstate 'PT403' then null; end;
  if exists(select 1 from next_auth.users where id=v_owner) or not exists(select 1 from next_auth.users where id=v_shared) then raise exception 'Exclusividade da conta incorreta'; end if;
  if not exists(select 1 from public.organization_members where user_id=v_shared and organization_id=v_other) then raise exception 'Membership externo removido'; end if;
  if app_private.get_user_session_version(v_shared)=v_security then raise exception 'Sessão compartilhada não revogada'; end if;
  if exists(select 1 from next_auth.accounts where "userId"=v_owner) or exists(select 1 from next_auth.sessions where "userId"=v_owner)
    or exists(select 1 from next_auth.verification_tokens where identifier=v_owner||'@fixture.invalid')
    or exists(select 1 from app_private.user_password_credentials where user_id=v_owner)
    or exists(select 1 from public.account_profiles where user_id=v_owner) then raise exception 'Dados pessoais órfãos'; end if;
  for v_ref in select table_schema,table_name from information_schema.columns where column_name='organization_id' and table_schema in('public','app_private') loop
    execute format('select count(*) from %I.%I where organization_id=any($1)',v_ref.table_schema,v_ref.table_name) into v_count using array[v_org,v_org2,v_global];
    if v_count<>0 then raise exception 'Dados órfãos em %.%',v_ref.table_schema,v_ref.table_name; end if;
  end loop;
  if exists(select 1 from public.response_sessions where diagnostic_id=v_diag) or exists(select 1 from app_private.routine_reminder_checks where cycle_id=v_cycle)
    or exists(select 1 from app_private.slack_event_receipts where team_id=v_team) then raise exception 'Histórico órfão'; end if;
  if not exists(select 1 from public.acquisition_campaigns where id=v_campaign) or not exists(select 1 from public.organizations where id=v_other) then raise exception 'Dados externos apagados'; end if;
end $$;
select 'admin-company-deletion: autorização, lote atômico, cascatas, contas exclusivas/compartilhadas e sessões OK' as result;
rollback;
