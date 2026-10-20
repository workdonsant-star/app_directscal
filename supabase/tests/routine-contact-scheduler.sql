begin;
create function pg_temp.reject_fixture_occurrence() returns trigger language plpgsql as $$
begin
 if new.description='Falha controlada fixture' and new.organization_id::text=TG_ARGV[0] then raise exception using errcode='P0999',message='Falha controlada';end if;
 return new;
end $$;
do $$
declare v_org uuid:=gen_random_uuid(); v_other uuid:=gen_random_uuid(); v_owner uuid:=gen_random_uuid(); v_operator uuid:=gen_random_uuid();
 v_sector uuid:=gen_random_uuid(); v_diag uuid:=gen_random_uuid(); v_template uuid; v_question uuid; v_asset uuid:=gen_random_uuid(); v_version uuid:=gen_random_uuid();
 v_rule uuid:=gen_random_uuid(); v_rule2 uuid:=gen_random_uuid(); v_routine uuid:=gen_random_uuid(); v_routine2 uuid:=gen_random_uuid(); v_policy uuid:=gen_random_uuid();
 v_event_rule uuid:=gen_random_uuid();v_event_routine uuid:=gen_random_uuid();v_event_input jsonb;v_event_result jsonb;v_count_cycles integer;v_count_jobs integer;v_trigger text:='qa_event_'||replace(gen_random_uuid()::text,'-','');
 v_team text:='TQA-'||gen_random_uuid()::text; v_input jsonb; v_job uuid; v_job2 uuid; v_lease uuid; v_lease2 uuid; v_value jsonb; v_context jsonb; v_pause uuid:=gen_random_uuid(); v_opens timestamptz;
begin
 insert into next_auth.users(id,email,name) values(v_owner,v_owner::text||'@fixture.invalid','Dono fixture'),(v_operator,v_operator::text||'@fixture.invalid','Operação fixture');
 insert into public.organizations(id,name) values(v_org,'Fixture agendamento'),(v_other,'Fixture outra empresa');
 insert into public.organization_members(organization_id,user_id,role) values(v_org,v_owner,'cliente'),(v_other,v_operator,'superadmin');
 insert into public.organization_sectors(id,organization_id,name) values(v_sector,v_org,'Setor fixture');
 select template_id,id into v_template,v_question from public.questions limit 1;
 insert into public.diagnostics(id,organization_id,template_id,name,status) values(v_diag,v_org,v_template,'Fixture coleta','encerrado');
 insert into public.admin_deliveries(diagnostic_id,organization_id,status,published_at,selected_action_point_ids) values(v_diag,v_org,'publicada',now(),array['action_processos_ritual']);
 insert into public.action_point_assignments(diagnostic_id,action_point_id,organization_id,assignee_team_id,assignee_slack_user_id,assignee_name) values(v_diag,'action_processos_ritual',v_org,v_team,'UQA','Pessoa fixture');
 insert into app_private.slack_installations(team_id,organization_id,bot_token,scope) values(v_team,v_org,'token-ficticio','users:read,im:write,chat:write');
 insert into public.management_assets(id,organization_id,type,title,status) values(v_asset,v_org,'sop','Ativo fixture','rascunho');
 insert into public.management_asset_versions(id,asset_id,organization_id,version_number,content_format,content,review_status,published_at,index_status) values(v_version,v_asset,v_org,'1','json','{}','publicado',now(),'pronto');
 update public.management_assets set status='publicado',current_published_version_id=v_version where id=v_asset;
 insert into app_private.asset_adherence_rules(id,routine_id,revision,organization_id,diagnostic_id,action_point_id,asset_id,asset_version_id,question_id,sector_id,assignee_team_id,assignee_user_id,schedule,expectation,created_by)
 values(v_rule,v_routine,1,v_org,v_diag,'action_processos_ritual',v_asset,v_version,v_question,v_sector,v_team,'UQA','{"kind":"periodica","cadence":"semanal","timeZone":"America/Sao_Paulo"}','Conferir rotina',v_owner),
 (v_rule2,v_routine2,1,v_org,v_diag,'action_processos_ritual',v_asset,v_version,v_question,v_sector,v_team,'UQA','{"kind":"periodica","cadence":"semanal","timeZone":"America/Sao_Paulo"}','Conferir segunda rotina',v_owner);
 v_input:=jsonb_build_object('id',v_policy,'expectedRevision',0,'enabled',true,'sectorIds',jsonb_build_array(v_sector),'weekdays','[1,2,3,4,5]'::jsonb,'startHour',6,'endHour',22,'timeZone','America/Sao_Paulo','maxCompanyPerDay',1,'maxPersonPerDay',1,'reason','Contato acordado em fixture');
 begin perform app_private.save_routine_contact_policy(v_org,v_owner,v_input);raise exception 'Cliente ativou';exception when insufficient_privilege then null;end;
 if app_private.save_routine_contact_policy(v_org,v_operator,v_input)<>1 or app_private.save_routine_contact_policy(v_org,v_operator,v_input)<>1 then raise exception 'Reentrada de política';end if;
 begin perform app_private.save_routine_contact_policy(v_org,v_operator,v_input||jsonb_build_object('id',gen_random_uuid()));raise exception 'Versão antiga';exception when sqlstate 'PT409' then null;end;
 if (app_private.get_routine_contact_policy(v_org,v_operator)->>'revision')::integer<>1 then raise exception 'Leitura da política';end if;

 insert into app_private.asset_adherence_rules select (jsonb_populate_record(null::app_private.asset_adherence_rules,to_jsonb(r)||jsonb_build_object('id',v_event_rule,'routine_id',v_event_routine,'schedule',jsonb_build_object('kind','por_evento','eventKey','entrega_confirmada','timeZone','America/Sao_Paulo')))).* from app_private.asset_adherence_rules r where id=v_rule;
 v_event_input:=jsonb_build_object('id',gen_random_uuid(),'ruleId',v_event_rule,'expectedPolicyRevision',1,'sourceKey','delivery-001','referenceUrl','https://example.invalid/delivery/001','description','Entrega fixture confirmada',
 'happenedLocal',to_char(clock_timestamp() at time zone 'America/Sao_Paulo','YYYY-MM-DD"T"HH24:MI:SS'),'dueLocal',to_char((clock_timestamp()+interval '1 day') at time zone 'America/Sao_Paulo','YYYY-MM-DD"T"HH24:MI:SS'));
 begin perform app_private.open_routine_event_contact(v_org,v_owner,v_event_input);raise exception 'Cliente abriu ocorrência';exception when insufficient_privilege then null;end;
 v_event_result:=app_private.open_routine_event_contact(v_org,v_operator,v_event_input);
 if app_private.open_routine_event_contact(v_org,v_operator,v_event_input)<>v_event_result or app_private.open_routine_event_contact(v_org,v_operator,v_event_input||jsonb_build_object('id',gen_random_uuid()))<>v_event_result then raise exception 'Duplicou evento';end if;
 begin perform app_private.open_routine_event_contact(v_org,v_operator,v_event_input||jsonb_build_object('id',gen_random_uuid(),'description','Outro relato'));raise exception 'Conflito de origem ignorado';exception when sqlstate 'PT409' then null;end;
 execute format('create trigger %I before insert on app_private.routine_event_occurrences for each row execute function pg_temp.reject_fixture_occurrence(%L)',v_trigger,v_org::text);
 select count(*) into v_count_cycles from app_private.asset_adherence_cycles where organization_id=v_org;
 select count(*) into v_count_jobs from app_private.slack_delivery_jobs where organization_id=v_org;
 begin perform app_private.open_routine_event_contact(v_org,v_operator,v_event_input||jsonb_build_object('id',gen_random_uuid(),'sourceKey','delivery-failure','description','Falha controlada fixture'));raise exception 'Não injetou falha';exception when sqlstate 'P0999' then null;end;
 if (select count(*) from app_private.asset_adherence_cycles where organization_id=v_org)<>v_count_cycles or (select count(*) from app_private.slack_delivery_jobs where organization_id=v_org)<>v_count_jobs then raise exception 'Falha parcial deixou ciclo ou job';end if;
 begin perform app_private.open_routine_event_contact(v_org,v_operator,v_event_input||jsonb_build_object('id',gen_random_uuid(),'sourceKey','future','happenedLocal',to_char((clock_timestamp()+interval '1 hour') at time zone 'America/Sao_Paulo','YYYY-MM-DD"T"HH24:MI:SS')));raise exception 'Evento futuro presumido';exception when sqlstate 'PT400' then null;end;

 v_opens:=clock_timestamp();
 v_job:=app_private.enqueue_routine_contact(v_org,v_policy,v_rule,'calendario:semanal:fixture',v_opens,v_opens+interval '1 day');
 if v_job is null or app_private.enqueue_routine_contact(v_org,v_policy,v_rule,'calendario:semanal:fixture',v_opens,v_opens+interval '1 day')<>v_job then raise exception 'Duplicou contato';end if;
 if (select count(*) from app_private.asset_adherence_cycles where routine_id=v_routine)<>1 then raise exception 'Duplicou oportunidade';end if;
 v_job2:=app_private.enqueue_routine_contact(v_org,v_policy,v_rule2,'calendario:semanal:fixture',v_opens,v_opens+interval '1 day');
 v_value:=app_private.claim_slack_delivery(v_job);v_lease:=(v_value->>'lease_id')::uuid;
 v_value:=app_private.claim_slack_delivery(v_job2);v_lease2:=(v_value->>'lease_id')::uuid;
 begin perform app_private.get_routine_contact_context(v_job,gen_random_uuid(),true);raise exception 'Lease falso';exception when sqlstate 'PT409' then null;end;
 v_context:=app_private.get_routine_contact_context(v_job,v_lease,true);
 if v_context->>'disposition'='enviar' then
   perform app_private.get_routine_contact_context(v_job,v_lease,true);
   if (select count(*) from app_private.routine_contact_reservations where job_id=v_job)<>1 then raise exception 'Reserva duplicada';end if;
   if app_private.get_routine_contact_context(v_job2,v_lease2,true)->>'disposition'<>'adiar' then raise exception 'Ignorou limite';end if;
   if (select count(*) from app_private.routine_contact_reservations where job_id=v_job2)<>0 then raise exception 'Reservou fora da cota';end if;
 else
   if v_context->>'disposition'<>'adiar' then raise exception 'Sem janela válida';end if;
 end if;
 v_context:=app_private.get_routine_contact_context(v_job2,v_lease2,false);
 perform app_private.defer_slack_delivery(v_job2,v_lease2,(v_context->>'availableAt')::timestamptz);
 if not exists(select 1 from app_private.slack_delivery_jobs where id=v_job2 and status='recebido' and attempts=0 and lease_id is null) then raise exception 'Adiamento consumiu tentativa';end if;
 insert into public.management_asset_versions(asset_id,organization_id,version_number,content_format,content,review_status,published_at,index_status) values(v_asset,v_org,'2','json','{}','publicado',now(),'pronto') returning id into v_version;
 update public.management_assets set current_published_version_id=v_version where id=v_asset;
 if app_private.get_routine_contact_context(v_job,v_lease,false)->>'disposition'<>'cancelar' then raise exception 'Contatou versão anterior';end if;
 if app_private.enqueue_routine_contact(v_org,v_policy,v_rule,'calendario:semanal:versao-antiga',v_opens,v_opens+interval '1 day') is not null then raise exception 'Criou ciclo com versão antiga';end if;
 update public.management_assets set current_published_version_id=(select asset_version_id from app_private.asset_adherence_rules where id=v_rule) where id=v_asset;
 update public.management_assets set status='arquivado' where id=v_asset;
 if app_private.get_routine_contact_context(v_job,v_lease,false)->>'disposition'<>'cancelar' then raise exception 'Contatou ativo arquivado';end if;
 update public.management_assets set status='publicado' where id=v_asset;
 update app_private.slack_installations set revoked_at=clock_timestamp() where team_id=v_team;
 if app_private.get_routine_contact_context(v_job,v_lease,false)->>'disposition'<>'cancelar' then raise exception 'Contatou workspace revogado';end if;
 update app_private.slack_installations set revoked_at=null where team_id=v_team;
 perform app_private.transition_asset_adherence_routine(v_org,v_routine,v_operator,v_pause,null,'pausar','Pausa fixture');
 if app_private.get_routine_contact_context(v_job,v_lease,false)->>'disposition'<>'cancelar' then raise exception 'Contatou rotina pausada';end if;
 if (select count(*) from app_private.asset_adherence_cycles where routine_id=v_routine)<>1 then raise exception 'Pausa apagou denominador';end if;
 perform app_private.touch_routine_contact_schedule(v_rule,false);
 if not exists(select 1 from app_private.routine_schedule_positions where routine_id=v_routine and rule_id=v_rule and not last_error) then raise exception 'Cursor não persistiu';end if;
 perform app_private.transition_slack_delivery(v_job,v_lease,'preparar','{"text":"Resposta fixture preparada"}');
 perform app_private.transition_slack_delivery(v_job,v_lease,'enviar');
 perform app_private.transition_slack_delivery(v_job,v_lease,'falhar','{"code":"rate_limited","retryable":true,"retryAfter":120}');
 v_input:=v_input||jsonb_build_object('id',gen_random_uuid(),'expectedRevision',1,'enabled',false,'reason','Pausa da empresa fixture');
 if app_private.save_routine_contact_policy(v_org,v_operator,v_input)<>2 then raise exception 'Não versionou pausa';end if;
 if app_private.claim_slack_delivery(v_job) is not null then raise exception 'Política antecipou Retry-After';end if;
 v_value:=app_private.claim_slack_delivery(v_job2);v_lease2:=(v_value->>'lease_id')::uuid;
 if v_value is null then raise exception 'Nova política não reavaliou adiamento';end if;
 if app_private.get_routine_contact_context(v_job2,v_lease2,false)->>'disposition'<>'cancelar' then raise exception 'Empresa pausada contatou';end if;
 perform app_private.transition_slack_delivery(v_job2,v_lease2,'ignorar');
 if has_table_privilege('authenticated','app_private.routine_contact_policies','select') or has_function_privilege('anon','app_private.get_routine_contact_schedule()','execute') then raise exception 'Escopo indevido';end if;
 perform set_config('role','service_role',true);
 perform app_private.get_routine_contact_policy(v_org,v_operator);
 perform app_private.get_routine_contact_schedule();
 perform app_private.touch_routine_contact_schedule(v_rule,true);
end $$;
select 'routine_contact_scheduler_ok' as result;
rollback;
