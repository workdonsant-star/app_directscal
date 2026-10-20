begin;
create function pg_temp.reject_fixture_reply_event() returns trigger language plpgsql as $$
begin
 if new.organization_id::text=current_setting('qa.reply_org',true) and current_setting('qa.reject_reply',true)='yes' then
   raise exception using errcode='P0999',message='Falha controlada no histórico'; end if;
 return new;
end $$;
create trigger qa_reject_routine_reply before insert on public.action_point_events for each row execute function pg_temp.reject_fixture_reply_event();
do $$
declare
 v_org uuid:=gen_random_uuid(); v_other uuid:=gen_random_uuid(); v_owner uuid:=gen_random_uuid(); v_admin uuid:=gen_random_uuid(); v_challenge uuid:=gen_random_uuid();
 v_sector uuid:=gen_random_uuid(); v_diag uuid:=gen_random_uuid(); v_template uuid; v_question uuid;
 v_asset uuid:=gen_random_uuid(); v_version uuid:=gen_random_uuid(); v_rule uuid:=gen_random_uuid(); v_routine uuid:=gen_random_uuid();
 v_cycle uuid:=gen_random_uuid(); v_cycle2 uuid:=gen_random_uuid(); v_out uuid:=gen_random_uuid(); v_out2 uuid:=gen_random_uuid();
 v_team text:='TQA-'||gen_random_uuid()::text; v_source uuid; v_confirm uuid; v_lease uuid; v_confirm_lease uuid;
 v_value jsonb; v_proposal jsonb; v_id uuid; v_count integer; v_event_count integer; v_operation jsonb;
begin
 perform set_config('qa.reply_org',v_org::text,true);
 insert into next_auth.users(id,email,name) values(v_owner,v_owner::text||'@fixture.invalid','Dono fixture'),(v_admin,v_admin::text||'@fixture.invalid','Admin fixture');
 insert into public.organizations(id,name) values(v_org,'Fixture conversa'),(v_other,'Fixture outra empresa');
 insert into public.organization_members(organization_id,user_id,role) values(v_org,v_owner,'cliente'),(v_org,v_admin,'admin');
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
 values(v_rule,v_routine,1,v_org,v_diag,'action_processos_ritual',v_asset,v_version,v_question,v_sector,v_team,'UQA','{"kind":"periodica","cadence":"semanal","timeZone":"America/Sao_Paulo"}','Conferir rotina',v_owner);
 insert into app_private.asset_adherence_cycles(id,organization_id,rule_id,routine_id,opportunity_key,opens_at,due_at)
 values(v_cycle,v_org,v_rule,v_routine,'fixture-1',clock_timestamp()-interval '1 day',clock_timestamp()),
 (v_cycle2,v_org,v_rule,v_routine,'fixture-2',clock_timestamp()-interval '1 hour',clock_timestamp()+interval '1 day');
 insert into app_private.slack_delivery_jobs(id,event_id,organization_id,team_id,question,status,reply,delivered_ts)
 values(v_out,'fixture-out-'||v_out,v_org,v_team,jsonb_build_object('kind','rotina','teamId',v_team,'userId','UQA','cycleId',v_cycle),'concluido','{"channel":"DQA","text":"Contato fixture"}','100.1'),
 (v_out2,'fixture-out-'||v_out2,v_org,v_team,jsonb_build_object('kind','rotina','teamId',v_team,'userId','UQA','cycleId',v_cycle2),'concluido','{"channel":"DQA","text":"Outro contato fixture"}','100.2');
 insert into app_private.routine_contact_jobs(job_id,cycle_id,organization_id,team_id,user_id) values(v_out,v_cycle,v_org,v_team,'UQA'),(v_out2,v_cycle2,v_org,v_team,'UQA');
 v_source:=app_private.enqueue_slack_delivery('fixture-in-'||gen_random_uuid(),v_team,jsonb_build_object('kind','direct','teamId',v_team,'userId','UQA','channel','DQA','ts','200.1','text','Fiz a rotina com evidência https://example.invalid/ata'));
 v_value:=app_private.claim_slack_delivery(v_source);v_lease:=(v_value->>'lease_id')::uuid;
 if jsonb_array_length(app_private.get_routine_reply_contexts(v_source,v_lease))<>2 then raise exception 'Não preservou ambiguidade';end if;
 if jsonb_array_length(app_private.get_routine_reply_contexts(v_source,v_lease,v_cycle))<>1 then raise exception 'Referência própria ausente';end if;
 if app_private.get_routine_reply_contexts(v_source,v_lease,gen_random_uuid())<>'[]'::jsonb then raise exception 'Referência de outra origem';end if;
 begin perform app_private.get_routine_reply_contexts(v_source,gen_random_uuid());raise exception 'Aceitou lease falso';exception when sqlstate 'PT409' then null;end;
 -- Nenhuma política real é ativada: toda a empresa é fictícia e haverá ROLLBACK.
 update public.organization_members set role='superadmin' where user_id=v_admin and organization_id=v_org;
 insert into app_private.routine_contact_policies(id,organization_id,revision,enabled,sector_ids,weekdays,start_hour,end_hour,time_zone,max_company_per_day,max_person_per_day,reason,created_by,enabled_at,write_payload)
 values(gen_random_uuid(),v_org,1,true,array[v_sector],array[1,2,3,4,5],6,22,'America/Sao_Paulo',50,5,'Política fixture de lembrete',v_admin,clock_timestamp()-interval '1 day','{}');
 update app_private.slack_delivery_jobs set updated_at=clock_timestamp()-interval '49 hours' where id in(v_out,v_out2);
 v_value:=app_private.enqueue_routine_reminders();
 if (v_value->>'ensured')::integer<>2 then raise exception 'Não enfileirou dois ciclos elegíveis';end if;
 if (app_private.enqueue_routine_reminders()->>'ensured')::integer<>0 then raise exception 'Duplicou lembrete';end if;
 if (select count(*) from app_private.routine_contact_jobs where organization_id=v_org and purpose='lembrete')<>2 then raise exception 'Quantidade divergente';end if;
 select job_id into v_confirm from app_private.routine_contact_jobs where cycle_id=v_cycle and purpose='lembrete';
 v_value:=app_private.claim_slack_delivery(v_confirm);v_confirm_lease:=(v_value->>'lease_id')::uuid;
 -- A consulta recente adia o lembrete; não se transforma em execução.
 v_value:=app_private.get_routine_contact_context(v_confirm,v_confirm_lease,false);
 if v_value->>'disposition' is distinct from 'adiar' then raise exception 'Ignorou conversa recente';end if;
 if exists(select 1 from app_private.asset_adherence_facts where organization_id=v_org) then raise exception 'Consulta virou execução';end if;
 update app_private.slack_delivery_jobs set received_at=clock_timestamp()-interval '25 hours' where id=v_source;
 v_value:=app_private.get_routine_contact_context(v_confirm,v_confirm_lease,false);
 if v_value->>'disposition' not in('enviar','adiar') then raise exception 'Lembrete sem contexto';end if;
 if v_value->>'disposition'='enviar' and v_value->>'purpose' is distinct from 'lembrete' then raise exception 'Não distinguiu lembrete';end if;
 -- A thread de um lembrete aponta para um único ciclo, sem duplicar o inicial.
 update app_private.slack_delivery_jobs set status='concluido',delivered_ts='100.9',reply='{"channel":"DQA","text":"Lembrete fixture"}',lease_id=null,lease_until=null where id=v_confirm;
 update app_private.slack_delivery_jobs set question=question||'{"threadTs":"100.9"}' where id=v_source;
 if jsonb_array_length(app_private.get_routine_reply_contexts(v_source,v_lease))<>1 then raise exception 'Thread do lembrete perdeu ou duplicou ciclo';end if;
 update app_private.slack_delivery_jobs set question=question-'threadTs' where id=v_source;
 if jsonb_array_length(app_private.get_routine_reply_contexts(v_source,v_lease))<>2 then raise exception 'Duplicou ciclos por contato';end if;
 -- Relato ou intervenção entre fila e envio cancela a cobrança pendente.
 select job_id into v_confirm from app_private.routine_contact_jobs where cycle_id=v_cycle2 and purpose='lembrete';
 v_value:=app_private.claim_slack_delivery(v_confirm);v_confirm_lease:=(v_value->>'lease_id')::uuid;
 perform app_private.record_asset_adherence_fact(v_org,v_cycle2,v_owner,gen_random_uuid(),'{"kind":"execucao_relatada","performed":false,"evidence":[]}');
 if app_private.get_routine_contact_context(v_confirm,v_confirm_lease,true)->>'disposition' is distinct from 'cancelar' then raise exception 'Cobrou após relato';end if;
 if has_table_privilege('authenticated','app_private.routine_reminder_checks','select') or has_function_privilege('anon','app_private.enqueue_routine_reminders()','execute') then raise exception 'Acesso indevido';end if;
 perform set_config('role','service_role',true);
 perform app_private.get_routine_reply_contexts(v_source,v_lease,v_cycle);
 perform app_private.enqueue_routine_reminders();
end $$;
select 'bounded_routine_reminders_ok' as result;
rollback;
