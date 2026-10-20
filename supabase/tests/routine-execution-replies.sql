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
 v_operation:='{"kind":"execucao","performed":true,"evidence":["https://example.invalid/ata"],"description":"Fiz a rotina com evidência"}';
 v_proposal:=app_private.propose_routine_reply(v_source,v_lease,v_cycle,'Pessoa fixture',v_operation);v_id:=(v_proposal->>'id')::uuid;
 if v_id is null or app_private.propose_routine_reply(v_source,v_lease,v_cycle,'Pessoa fixture',v_operation)<>v_proposal then raise exception 'Proposta duplicada';end if;
 if exists(select 1 from app_private.asset_adherence_facts where organization_id=v_org) then raise exception 'Gravou antes da confirmação';end if;
 -- Outro evento, pessoa e canal não podem tomar a proposta.
 v_confirm:=app_private.enqueue_slack_delivery('fixture-other-'||gen_random_uuid(),v_team,jsonb_build_object('kind','direct','teamId',v_team,'userId','OUTRA','channel','DQA','ts','201.1','text','confirmar '||v_id));
 v_value:=app_private.claim_slack_delivery(v_confirm);v_confirm_lease:=(v_value->>'lease_id')::uuid;
 if app_private.resolve_routine_reply(v_confirm,v_confirm_lease,v_id,true)->>'status' is distinct from 'indisponivel' then raise exception 'Outra pessoa confirmou';end if;
 v_confirm:=app_private.enqueue_slack_delivery('fixture-confirm-'||gen_random_uuid(),v_team,jsonb_build_object('kind','direct','teamId',v_team,'userId','UQA','channel','DQA','ts','202.1','text','confirmar '||v_id));
 v_value:=app_private.claim_slack_delivery(v_confirm);v_confirm_lease:=(v_value->>'lease_id')::uuid;
 perform set_config('qa.reject_reply','yes',true);
 begin perform app_private.resolve_routine_reply(v_confirm,v_confirm_lease,v_id,true);raise exception 'Não injetou falha';exception when sqlstate 'P0999' then null;end;
 if exists(select 1 from app_private.asset_adherence_facts where organization_id=v_org) or
   (select status from app_private.routine_reply_proposals where id=v_id)<>'pendente' then raise exception 'Deixou confirmação parcial';end if;
 perform set_config('qa.reject_reply','no',true);
 if app_private.resolve_routine_reply(v_confirm,v_confirm_lease,v_id,true)->>'status' is distinct from 'confirmada' then raise exception 'Não confirmou';end if;
 if app_private.resolve_routine_reply(v_confirm,v_confirm_lease,v_id,true)->>'status' is distinct from 'confirmada' then raise exception 'Reentrada falhou';end if;
 if (select count(*) from app_private.asset_adherence_facts where organization_id=v_org)<>1 or
   (select count(*) from public.action_point_events where organization_id=v_org)<>1 then raise exception 'Duplicou fato/histórico';end if;
 if not exists(select 1 from app_private.asset_adherence_facts where cycle_id=v_cycle and origin='slack' and actor_user_id is null and slack_user_id='UQA' and slack_event_job_id=v_confirm and payload->'evidence'='["https://example.invalid/ata"]'::jsonb) then raise exception 'Perdeu identidade/evidência';end if;
 if (select progress from public.action_point_assignments where diagnostic_id=v_diag)<>0 then raise exception 'Confundiu execução com implantação';end if;
 -- Novo relato concorrente impede a confirmação antiga.
 v_source:=app_private.enqueue_slack_delivery('fixture-stale-'||gen_random_uuid(),v_team,jsonb_build_object('kind','direct','teamId',v_team,'userId','UQA','channel','DQA','ts','203.1','text','Bloqueado: dependência'));
 v_value:=app_private.claim_slack_delivery(v_source);v_lease:=(v_value->>'lease_id')::uuid;
 v_proposal:=app_private.propose_routine_reply(v_source,v_lease,v_cycle,'Pessoa fixture','{"kind":"bloqueio","reason":"Dependência"}');v_id:=(v_proposal->>'id')::uuid;
 perform app_private.record_asset_adherence_fact(v_org,v_cycle,v_owner,gen_random_uuid(),'{"kind":"execucao_relatada","performed":false,"evidence":[]}');
 v_confirm:=app_private.enqueue_slack_delivery('fixture-stale-confirm-'||gen_random_uuid(),v_team,jsonb_build_object('kind','direct','teamId',v_team,'userId','UQA','channel','DQA','ts','204.1','text','confirmar '||v_id));
 v_value:=app_private.claim_slack_delivery(v_confirm);v_confirm_lease:=(v_value->>'lease_id')::uuid;
 if app_private.resolve_routine_reply(v_confirm,v_confirm_lease,v_id,true)->>'status' is distinct from 'mudou' then raise exception 'Sobrescreveu relato mais recente';end if;
 -- Solicitação de exceção não aprova exceção; progresso nunca conclui a etapa.
 for v_operation in select value from jsonb_array_elements('[{"kind":"excecao","reason":"Sem oportunidade"},{"kind":"progresso","value":50,"reason":"Primeira etapa pronta"},{"kind":"leitura"}]'::jsonb) loop
   v_source:=app_private.enqueue_slack_delivery('fixture-kind-'||gen_random_uuid(),v_team,jsonb_build_object('kind','direct','teamId',v_team,'userId','UQA','channel','DQA','ts','205.1','text','Relato fixture'));
   v_value:=app_private.claim_slack_delivery(v_source);v_lease:=(v_value->>'lease_id')::uuid;
   v_proposal:=app_private.propose_routine_reply(v_source,v_lease,v_cycle,'Pessoa fixture',v_operation);v_id:=(v_proposal->>'id')::uuid;
   v_confirm:=app_private.enqueue_slack_delivery('fixture-kind-confirm-'||gen_random_uuid(),v_team,jsonb_build_object('kind','direct','teamId',v_team,'userId','UQA','channel','DQA','ts','206.1','text','confirmar '||v_id));
   v_value:=app_private.claim_slack_delivery(v_confirm);v_confirm_lease:=(v_value->>'lease_id')::uuid;
   if app_private.resolve_routine_reply(v_confirm,v_confirm_lease,v_id,true)->>'status' is distinct from 'confirmada' then raise exception 'Tipo não confirmado';end if;
 end loop;
 if (select progress from public.action_point_assignments where diagnostic_id=v_diag)<>50 or (select stage from public.action_point_assignments where diagnostic_id=v_diag)<>'atribuido' then raise exception 'Progresso mudou etapa';end if;
 if exists(select 1 from app_private.asset_adherence_facts where organization_id=v_org and payload->>'kind'='excecao_revisada') then raise exception 'Exceção autoaprovada';end if;
 -- Expiração, cancelamento, revogação e mudança de publicação não escrevem fatos.
 v_source:=app_private.enqueue_slack_delivery('fixture-expiry-'||gen_random_uuid(),v_team,jsonb_build_object('kind','direct','teamId',v_team,'userId','UQA','channel','DQA','ts','207.1','text','Li'));
 v_value:=app_private.claim_slack_delivery(v_source);v_lease:=(v_value->>'lease_id')::uuid;
 v_proposal:=app_private.propose_routine_reply(v_source,v_lease,v_cycle,'Pessoa fixture','{"kind":"leitura"}');v_id:=(v_proposal->>'id')::uuid;
 v_confirm:=app_private.enqueue_slack_delivery('fixture-expiry-confirm-'||gen_random_uuid(),v_team,jsonb_build_object('kind','direct','teamId',v_team,'userId','UQA','channel','DQA','ts','208.1','text','confirmar '||v_id));
 v_value:=app_private.claim_slack_delivery(v_confirm);v_confirm_lease:=(v_value->>'lease_id')::uuid;
 update app_private.routine_reply_proposals set expires_at=clock_timestamp()-interval '1 second' where id=v_id;
 if app_private.resolve_routine_reply(v_confirm,v_confirm_lease,v_id,true)->>'status' is distinct from 'expirou' then raise exception 'Aceitou proposta expirada';end if;
 update app_private.routine_reply_proposals set expires_at=clock_timestamp()+interval '30 minutes' where id=v_id;
 update public.admin_deliveries set selected_action_point_ids='{}' where diagnostic_id=v_diag;
 if app_private.resolve_routine_reply(v_confirm,v_confirm_lease,v_id,true)->>'status' is distinct from 'indisponivel' then raise exception 'Confirmou origem retirada';end if;
 update public.admin_deliveries set selected_action_point_ids=array['action_processos_ritual'] where diagnostic_id=v_diag;
 update app_private.slack_installations set revoked_at=clock_timestamp() where team_id=v_team;
 if app_private.resolve_routine_reply(v_confirm,v_confirm_lease,v_id,true)->>'status' is distinct from 'indisponivel' then raise exception 'Confirmou workspace revogado';end if;
 update app_private.slack_installations set revoked_at=null where team_id=v_team;
 v_confirm:=app_private.enqueue_slack_delivery('fixture-cancel-'||gen_random_uuid(),v_team,jsonb_build_object('kind','direct','teamId',v_team,'userId','UQA','channel','DQA','ts','209.1','text','cancelar '||v_id));
 v_value:=app_private.claim_slack_delivery(v_confirm);v_confirm_lease:=(v_value->>'lease_id')::uuid;
 if app_private.resolve_routine_reply(v_confirm,v_confirm_lease,v_id,false)->>'status' is distinct from 'cancelada' then raise exception 'Não cancelou';end if;
 v_value:=app_private.get_customer_routine_records(v_org,v_owner,v_diag);
 if jsonb_array_length(v_value)<>2 or jsonb_array_length(v_value->0->'cycle'->'facts')+jsonb_array_length(v_value->1->'cycle'->'facts')<>4 then raise exception 'Perdeu fatos na leitura';end if;
 if v_value::text not like '%https://example.invalid/ata%' or v_value::text like '%token-ficticio%' then raise exception 'Evidência ausente ou segredo exposto';end if;
 if app_private.get_customer_routine_records(v_org,v_admin,v_diag)<>'[]'::jsonb then raise exception 'Admin leu relatos sem vínculo';end if;
 insert into app_private.slack_identity_challenges(id,organization_id,user_id,code_hash) values(v_challenge,v_org,v_admin,encode(sha256(convert_to(gen_random_uuid()::text,'UTF8')),'hex'));
 insert into app_private.slack_identity_links(organization_id,user_id,slack_team_id,slack_user_id,challenge_id) values(v_org,v_admin,v_team,'UQA',v_challenge);
 if jsonb_array_length(app_private.get_customer_routine_records(v_org,v_admin,v_diag))<>2 then raise exception 'Pessoa vinculada não leu próprio ciclo';end if;
 begin perform app_private.get_customer_routine_records(v_other,v_owner,v_diag);raise exception 'Outra empresa leu relatos';exception when insufficient_privilege then null;end;
 if has_table_privilege('authenticated','app_private.routine_reply_proposals','select') or has_function_privilege('anon','app_private.resolve_routine_reply(uuid,uuid,uuid,boolean)','execute') then raise exception 'Acesso indevido';end if;
 perform set_config('role','service_role',true);
 perform app_private.get_routine_reply_contexts(v_source,v_lease,v_cycle);
 perform app_private.get_customer_routine_records(v_org,v_owner,v_diag);
end $$;
select 'routine_execution_replies_ok' as result;
rollback;
