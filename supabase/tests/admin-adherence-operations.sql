begin;
set local statement_timeout='15s';
create function pg_temp.fail_last_transfer_rule() returns trigger language plpgsql as $$
begin
  if new.assignee_user_id='UFIXTURE3' and new.routine_id=TG_ARGV[0]::uuid then raise exception 'Falha controlada de transferência' using errcode='P0999'; end if;
  return new;
end;
$$;
do $$
declare
  v_routine_b uuid:=gen_random_uuid(); v_failure_attempt uuid:=gen_random_uuid(); v_trigger text:='qa_transfer_'||replace(gen_random_uuid()::text,'-',''); v_attempt uuid:=gen_random_uuid(); v_save_rule uuid:=gen_random_uuid(); v_assignment_at timestamptz; v_expected_rules jsonb; v_transfer jsonb; v_workspace jsonb; v_failed_routine uuid:=gen_random_uuid(); v_operator uuid:=gen_random_uuid(); v_pause uuid:=gen_random_uuid(); v_current_rule uuid; v_owner uuid:=gen_random_uuid(); v_other_owner uuid:=gen_random_uuid(); v_org uuid:=gen_random_uuid(); v_other uuid:=gen_random_uuid();
  v_diag uuid:=gen_random_uuid(); v_template uuid; v_question uuid; v_sector uuid:=gen_random_uuid();
  v_asset uuid:=gen_random_uuid(); v_version uuid:=gen_random_uuid(); v_rule uuid:=gen_random_uuid(); v_routine uuid:=gen_random_uuid();
  v_cycle uuid:=gen_random_uuid(); v_other_cycle uuid:=gen_random_uuid(); v_event uuid:=gen_random_uuid(); v_event2 uuid:=gen_random_uuid(); v_request uuid:=gen_random_uuid();
  v_payload jsonb; v_first jsonb; v_retry jsonb;
begin
  insert into next_auth.users(id,email,name) values(v_owner,v_owner::text||'@fixture.invalid','Fixture dono'),(v_other_owner,v_other_owner::text||'@fixture.invalid','Fixture outra empresa');
  insert into public.organizations(id,name) values(v_org,'Fixture aderência'),(v_other,'Fixture isolada');
  insert into public.organization_members(organization_id,user_id,role) values(v_org,v_owner,'cliente'),(v_other,v_other_owner,'cliente');
  select template_id,id into v_template,v_question from public.questions limit 1;
  insert into public.diagnostics(id,organization_id,template_id,name,status) values(v_diag,v_org,v_template,'Fixture rotina','encerrado');
  insert into public.admin_deliveries(diagnostic_id,organization_id,status,published_at,selected_action_point_ids)
    values(v_diag,v_org,'publicada',now(),array['action_processos_ritual']);
  insert into public.organization_sectors(id,organization_id,name) values(v_sector,v_org,'Setor fixture');
  insert into public.action_point_assignments(diagnostic_id,action_point_id,organization_id,assignee_team_id,assignee_slack_user_id,assignee_name)
    values(v_diag,'action_processos_ritual',v_org,'TFIXTURE','UFIXTURE','Pessoa fictícia');
  insert into public.management_assets(id,organization_id,type,title,status) values(v_asset,v_org,'sop','Fixture rotina','rascunho');
  insert into public.management_asset_versions(id,asset_id,organization_id,version_number,content_format,content,review_status,published_at,index_status)
    values(v_version,v_asset,v_org,'1','json','{}','publicado',now(),'pronto');
  update public.management_assets set status='publicado',current_published_version_id=v_version where id=v_asset;
  insert into app_private.asset_adherence_rules(id,routine_id,revision,organization_id,diagnostic_id,action_point_id,asset_id,asset_version_id,question_id,sector_id,assignee_team_id,assignee_user_id,schedule,expectation,created_by)
    values(v_rule,v_routine,1,v_org,v_diag,'action_processos_ritual',v_asset,v_version,v_question,v_sector,'TFIXTURE','UFIXTURE','{"kind":"periodica","cadence":"semanal","timeZone":"America/Sao_Paulo"}','Conferir rotina',v_owner);
  begin
    insert into app_private.asset_adherence_rules select (jsonb_populate_record(null::app_private.asset_adherence_rules,
      to_jsonb(r)||jsonb_build_object('id',gen_random_uuid(),'routine_id',gen_random_uuid(),'created_by',v_other_owner))).* from app_private.asset_adherence_rules r where id=v_rule;
    raise exception 'Ator de outra empresa criou acordo';
  exception when insufficient_privilege then null; end;
  begin
    insert into app_private.asset_adherence_rules select (jsonb_populate_record(null::app_private.asset_adherence_rules,
      to_jsonb(r)||jsonb_build_object('id',gen_random_uuid(),'routine_id',gen_random_uuid(),'action_point_id','nao_publicada'))).* from app_private.asset_adherence_rules r where id=v_rule;
    raise exception 'Origem não publicada aceita';
  exception when sqlstate 'PT409' then null; end;
  begin
    insert into app_private.asset_adherence_rules select (jsonb_populate_record(null::app_private.asset_adherence_rules,
      to_jsonb(r)||jsonb_build_object('id',gen_random_uuid(),'routine_id',gen_random_uuid(),'assignee_user_id','OUTRA_PESSOA'))).* from app_private.asset_adherence_rules r where id=v_rule;
    raise exception 'Responsável divergente aceito';
  exception when sqlstate 'PT409' then null; end;
  begin
    insert into app_private.asset_adherence_rules select (jsonb_populate_record(null::app_private.asset_adherence_rules,
      to_jsonb(r)||jsonb_build_object('id',gen_random_uuid(),'routine_id',gen_random_uuid(),'schedule','{"kind":"periodica","cadence":"semanal"}'::jsonb))).* from app_private.asset_adherence_rules r where id=v_rule;
    raise exception 'Calendário sem fuso aceito';
  exception when check_violation then null; end;
  -- Oportunidade é única por rotina, inclusive entre revisões futuras do acordo.
  insert into app_private.asset_adherence_cycles(id,organization_id,rule_id,routine_id,opportunity_key,opens_at,due_at)
    values(v_cycle,v_org,v_rule,v_routine,'2026-semana-42',now()-interval '2 days',now()-interval '1 day');
  begin
    insert into app_private.asset_adherence_cycles(organization_id,rule_id,routine_id,opportunity_key,opens_at,due_at)
      values(v_org,v_rule,v_routine,'2026-semana-42',now()-interval '2 days',now()-interval '1 day');
    raise exception 'Oportunidade duplicada';
  exception when unique_violation then null; end;
  begin
    insert into app_private.asset_adherence_cycles(organization_id,rule_id,routine_id,opportunity_key,opens_at,due_at)
      values(v_other,v_rule,v_routine,'outra',now(),now());
    raise exception 'Ciclo cruzou empresa';
  exception when insufficient_privilege then null; end;
  -- Uma revisão nova do acordo não cria outra oportunidade para o mesmo período.
  insert into app_private.asset_adherence_rules select (jsonb_populate_record(null::app_private.asset_adherence_rules,
    to_jsonb(r)||jsonb_build_object('id',gen_random_uuid(),'revision',2))).* from app_private.asset_adherence_rules r where id=v_rule;
  begin
    insert into app_private.asset_adherence_cycles(organization_id,rule_id,routine_id,opportunity_key,opens_at,due_at)
      select v_org,id,v_routine,'2026-semana-42',now()-interval '2 days',now()-interval '1 day' from app_private.asset_adherence_rules where routine_id=v_routine and revision=2;
    raise exception 'Revisão duplicou a oportunidade';
  exception when unique_violation then null; end;
  v_payload:='{"kind":"execucao_relatada","performed":true,"evidence":[]}'::jsonb;
  v_first:=app_private.record_asset_adherence_fact(v_org,v_cycle,v_owner,v_event,v_payload);
  v_retry:=app_private.record_asset_adherence_fact(v_org,v_cycle,v_owner,v_event,v_payload);
  if v_first<>v_retry or (select count(*) from app_private.asset_adherence_facts where cycle_id=v_cycle)<>1 then raise exception 'Reentrada duplicou o relato'; end if;
  begin
    perform app_private.record_asset_adherence_fact(v_org,v_cycle,v_owner,v_event,'{"kind":"leitura_confirmada"}');
    raise exception 'Tentativa reaproveitada com conteúdo diferente';
  exception when sqlstate 'PT409' then null; end;
  begin
    perform app_private.record_asset_adherence_fact(v_org,v_cycle,v_other_owner,gen_random_uuid(),'{"kind":"leitura_confirmada"}'::jsonb);
    raise exception 'Outra empresa escreveu';
  exception when insufficient_privilege then null; end;
  begin
    perform app_private.record_asset_adherence_fact(v_org,v_cycle,v_owner,gen_random_uuid(),jsonb_build_object('kind','evidencia_revisada','executionId',v_event,'accepted',true,'reason','Sem anexo'));
    raise exception 'Relato sem evidência validado';
  exception when sqlstate 'PT409' then null; end;
  perform app_private.record_asset_adherence_fact(v_org,v_cycle,v_owner,v_event2,'{"kind":"execucao_relatada","performed":true,"evidence":["https://example.invalid/prova"]}');
  begin
    perform app_private.record_asset_adherence_fact(v_org,v_cycle,v_owner,gen_random_uuid(),jsonb_build_object('kind','evidencia_revisada','executionId',v_event,'accepted',true,'reason','Relato antigo'));
    raise exception 'Revisão antiga aceita';
  exception when sqlstate 'PT409' then null; end;
  perform app_private.record_asset_adherence_fact(v_org,v_cycle,v_owner,gen_random_uuid(),jsonb_build_object('kind','evidencia_revisada','executionId',v_event2,'accepted',true,'reason','Conferência da prova'));
  perform app_private.record_asset_adherence_fact(v_org,v_cycle,v_owner,v_request,'{"kind":"excecao_solicitada","reason":"Evento não ocorreu"}');
  perform app_private.record_asset_adherence_fact(v_org,v_cycle,v_owner,gen_random_uuid(),jsonb_build_object('kind','excecao_revisada','requestId',v_request,'accepted',true,'reason','Ocorrência conferida'));
  begin
    perform app_private.record_asset_adherence_fact(v_org,v_cycle,v_owner,gen_random_uuid(),'{}');
    raise exception 'Fato inválido aceito';
  exception when sqlstate 'PT400' then null; end;
  execute 'set local role service_role';
  perform app_private.record_asset_adherence_fact(v_org,v_cycle,v_owner,gen_random_uuid(),'{"kind":"leitura_confirmada"}');
  execute 'reset role';
  if (select count(*) from app_private.asset_adherence_facts where cycle_id=v_cycle)<>6 then raise exception 'Histórico incompleto ou falha persistida'; end if;
  insert into next_auth.users(id,email,name) values(v_operator,v_operator::text||'@fixture.invalid','Fixture operação');
  insert into public.organization_members(organization_id,user_id,role) values(v_org,v_operator,'superadmin');
  begin
    perform app_private.transition_asset_adherence_routine(v_org,v_routine,v_owner,v_pause,null,'pausar','Pausa fictícia');
    raise exception 'Dono alterou operação DirectScal';
  exception when insufficient_privilege then null; end;
  execute 'set local role service_role';
  v_first:=app_private.transition_asset_adherence_routine(v_org,v_routine,v_operator,v_pause,null,'pausar','Pausa fictícia');
  v_retry:=app_private.transition_asset_adherence_routine(v_org,v_routine,v_operator,v_pause,null,'pausar','Pausa fictícia');
  execute 'reset role';
  if v_first<>v_retry then raise exception 'Reentrada da pausa divergente'; end if;
  select id into v_current_rule from app_private.asset_adherence_rules where routine_id=v_routine order by revision desc limit 1;
  begin
    insert into app_private.asset_adherence_cycles(organization_id,rule_id,routine_id,opportunity_key,opens_at,due_at)
      values(v_org,v_current_rule,v_routine,'apos-pausa',now(),now());
    raise exception 'Rotina pausada abriu oportunidade';
  exception when sqlstate 'PT409' then null; end;
  begin
    perform app_private.transition_asset_adherence_routine(v_org,v_routine,v_operator,gen_random_uuid(),null,'retomar','Tentativa antiga');
    raise exception 'Sessão antiga retomou';
  exception when sqlstate 'PT409' then null; end;
  perform app_private.transition_asset_adherence_routine(v_org,v_routine,v_operator,gen_random_uuid(),v_pause,'retomar','Retomada fictícia');
  insert into app_private.asset_adherence_cycles(organization_id,rule_id,routine_id,opportunity_key,opens_at,due_at)
    values(v_org,v_current_rule,v_routine,'apos-retomada',now(),now());
  if (select count(*) from app_private.asset_adherence_routine_events where routine_id=v_routine)<>2 then raise exception 'Histórico de pausa divergente'; end if;
  if (select count(*) from app_private.asset_adherence_facts where cycle_id=v_cycle)<>6 then raise exception 'Pausa alterou evidências anteriores'; end if;

  insert into app_private.slack_installations(team_id,organization_id,bot_token) values('TFIXTURE',v_org,'fixture-unusable');
  select updated_at into v_assignment_at from public.action_point_assignments where diagnostic_id=v_diag and action_point_id='action_processos_ritual';
  v_payload:=jsonb_build_object('diagnosticId',v_diag,'actionPointId','action_processos_ritual','title','Rotina adaptada',
    'assetId',v_asset,'assetVersionId',v_version,'questionId',v_question,'sectorId',v_sector,
    'assignee',jsonb_build_object('teamId','TFIXTURE','userId','UFIXTURE','name','Pessoa fictícia','avatarUrl',null),
    'schedule',jsonb_build_object('kind','periodica','cadence','mensal','timeZone','America/Sao_Paulo'),
    'expectation','Executar a revisão do período','successIndicator','Registro da revisão conferido','reason','Adaptação da operação');
  begin
    perform app_private.save_admin_adherence_routine(v_org,v_owner,v_save_rule,v_routine,v_current_rule,v_assignment_at,v_payload);
    raise exception 'Cliente alterou acordo administrativo';
  exception when insufficient_privilege then null; end;
  execute 'set local role service_role';
  perform app_private.save_admin_adherence_routine(v_org,v_operator,v_save_rule,v_routine,v_current_rule,v_assignment_at,v_payload);
  perform app_private.save_admin_adherence_routine(v_org,v_operator,v_save_rule,v_routine,v_current_rule,v_assignment_at,v_payload);
  execute 'reset role';
  if (select count(*) from app_private.asset_adherence_rules where routine_id=v_routine)<>3 then raise exception 'Reentrada duplicou revisão'; end if;
  begin
    perform app_private.save_admin_adherence_routine(v_org,v_operator,gen_random_uuid(),v_routine,v_current_rule,v_assignment_at,v_payload);
    raise exception 'Revisão antiga aceita';
  exception when sqlstate 'PT409' then null; end;
  -- Falha depois da primeira atribuição reverte também atribuição e evento.
  update public.admin_deliveries set selected_action_point_ids=array['action_processos_ritual','action_fixture_new'] where diagnostic_id=v_diag;
  begin
    perform app_private.save_admin_adherence_routine(v_org,v_operator,gen_random_uuid(),v_failed_routine,null,null,
      jsonb_set(jsonb_set(v_payload,'{actionPointId}','"action_fixture_new"'),'{assetVersionId}',to_jsonb(gen_random_uuid())));
    raise exception 'Vínculo inválido aceito';
  exception when sqlstate 'PT409' then null; end;
  if exists(select 1 from public.action_point_assignments where diagnostic_id=v_diag and action_point_id='action_fixture_new') or
    exists(select 1 from public.action_point_events where diagnostic_id=v_diag and action_point_id='action_fixture_new') then raise exception 'Falha deixou atribuição parcial'; end if;
  perform app_private.save_admin_adherence_routine(v_org,v_operator,gen_random_uuid(),v_routine_b,null,v_assignment_at,jsonb_set(v_payload,'{title}','"Outra rotina da mesma ação"'));
  select jsonb_agg(jsonb_build_object('routineId',routine_id,'ruleId',id) order by routine_id) into v_expected_rules from
    (select distinct on(routine_id) id,routine_id from app_private.asset_adherence_rules where diagnostic_id=v_diag order by routine_id,revision desc) r;
  v_transfer:=jsonb_build_object('diagnosticId',v_diag,'actionPointId','action_processos_ritual','expectedUpdatedAt',v_assignment_at,'expectedRules',v_expected_rules,
    'assignee',jsonb_build_object('teamId','TFIXTURE','userId','UFIXTURE2','name','Outra pessoa fictícia','avatarUrl',null),'reason','Transferência fictícia');
  execute 'set local role service_role';
  v_first:=app_private.transfer_admin_action_routines(v_org,v_operator,v_attempt,v_transfer);
  v_retry:=app_private.transfer_admin_action_routines(v_org,v_operator,v_attempt,v_transfer);
  execute 'reset role';
  if v_first<>v_retry or (v_first->>'routineCount')::int<>2 then raise exception 'Reentrada de transferência divergente'; end if;
  if (select assignee_slack_user_id from public.action_point_assignments where diagnostic_id=v_diag and action_point_id='action_processos_ritual')<>'UFIXTURE2' then raise exception 'Atribuição não transferida'; end if;
  if (select assignee_user_id from app_private.asset_adherence_rules where routine_id=v_routine order by revision desc limit 1)<>'UFIXTURE2' then raise exception 'Acordo não transferido'; end if;
  if (select r.assignee_user_id from app_private.asset_adherence_cycles c join app_private.asset_adherence_rules r on r.id=c.rule_id where c.id=v_cycle)<>'UFIXTURE' then raise exception 'Histórico de ciclo alterado'; end if;
  begin
    perform app_private.transfer_admin_action_routines(v_org,v_operator,gen_random_uuid(),v_transfer);
    raise exception 'Transferência antiga aceita';
  exception when sqlstate 'PT409' then null; end;
  select updated_at into v_assignment_at from public.action_point_assignments where diagnostic_id=v_diag and action_point_id='action_processos_ritual';
  select jsonb_agg(jsonb_build_object('routineId',routine_id,'ruleId',id) order by routine_id) into v_expected_rules from
    (select distinct on(routine_id) id,routine_id from app_private.asset_adherence_rules where diagnostic_id=v_diag order by routine_id,revision desc) r;
  v_transfer:=jsonb_set(jsonb_set(jsonb_set(v_transfer,'{expectedUpdatedAt}',to_jsonb(v_assignment_at)),'{expectedRules}',v_expected_rules),'{assignee,userId}','"UFIXTURE3"');
  execute format('create trigger %I before insert on app_private.asset_adherence_rules for each row execute function pg_temp.fail_last_transfer_rule(%L)',v_trigger,greatest(v_routine,v_routine_b)::text);
  begin
    perform app_private.transfer_admin_action_routines(v_org,v_operator,v_failure_attempt,v_transfer);
    raise exception 'Falha intermediária de transferência não exercitada';
  exception when sqlstate 'P0999' then null; end;
  if (select assignee_slack_user_id from public.action_point_assignments where diagnostic_id=v_diag)<>'UFIXTURE2' or
     exists(select 1 from app_private.asset_adherence_rules where diagnostic_id=v_diag and assignee_user_id='UFIXTURE3') or
     exists(select 1 from app_private.adherence_transfer_receipts where id=v_failure_attempt) then raise exception 'Transferência deixou estado parcial'; end if;
  -- O caminho de cliente não pode divergir atribuição e acordos existentes.
  begin
    perform app_private.save_action_point_update(v_diag,v_org,'action_processos_ritual',v_owner,'Fixture',v_assignment_at,
      '{"ok":true,"remove":false,"values":{"assignee":{"teamId":"TFIXTURE","userId":"UFIXTURE4","name":"Outra pessoa"},"stage":"atribuido","startsOn":null,"dueOn":null,"cadence":"semanal","progress":0},"events":[{"kind":"atribuicao","body":"tentou transferir"}]}');
    set constraints all immediate;
    raise exception 'Atribuição divergiu dos acordos';
  exception when sqlstate 'PT409' then null; end;
  if (select assignee_slack_user_id from public.action_point_assignments where diagnostic_id=v_diag)<>'UFIXTURE2' then raise exception 'Tentativa parcial persistiu'; end if;
  v_workspace:=app_private.get_admin_adherence_workspace(v_org,v_operator);
  if jsonb_array_length(v_workspace->'rules')<>6 or v_workspace::text like '%fixture-unusable%' then raise exception 'Workspace incompleto ou segredo exposto'; end if;
  begin
    perform app_private.get_admin_adherence_workspace(v_org,v_owner);
    raise exception 'Cliente acessou workspace interno';
  exception when insufficient_privilege then null; end;
  v_workspace:=app_private.get_customer_adherence_agreements(v_org,v_owner,v_diag);
  if jsonb_array_length(v_workspace)<>2 or v_workspace::text like '%write_payload%' or v_workspace::text like '%fixture-unusable%' then raise exception 'Acordos do cliente inválidos'; end if;
  begin
    perform app_private.get_customer_adherence_agreements(v_org,v_operator,v_diag);
    raise exception 'Superadmin acessou superfície de cliente';
  exception when insufficient_privilege then null; end;
  begin
    perform app_private.get_customer_adherence_agreements(v_org,v_other_owner,v_diag);
    raise exception 'Outra empresa leu acordo';
  exception when insufficient_privilege then null; end;
  set constraints all immediate;

  if has_table_privilege('authenticated','app_private.asset_adherence_routine_events','SELECT') or
    has_table_privilege('service_role','app_private.asset_adherence_routine_events','DELETE') then raise exception 'Histórico de rotina exposto'; end if;
  if has_table_privilege('authenticated','app_private.asset_adherence_rules','SELECT') or
    has_table_privilege('service_role','app_private.asset_adherence_facts','UPDATE') or
    has_function_privilege('anon','app_private.record_asset_adherence_fact(uuid,uuid,uuid,uuid,jsonb)','EXECUTE') then raise exception 'Grants inadequados'; end if;
end;
$$;
select 'admin adherence operations: ok' result;
rollback;
