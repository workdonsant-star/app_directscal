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
 -- A07 usa o admin fictício como operador global, sem tocar contas reais.
 update public.organization_members set role='superadmin' where user_id=v_admin and organization_id=v_org;
 select count(*) into v_count from app_private.asset_adherence_facts where organization_id=v_org;
 select count(*) into v_event_count from public.action_point_events where organization_id=v_org;
 v_operation:=jsonb_build_object('id',gen_random_uuid(),'cycleId',v_cycle,'operation','evidencia','expectedEventId',null,'factId',(select id from app_private.asset_adherence_facts where cycle_id=v_cycle and payload->>'kind'='execucao_relatada' order by sequence desc limit 1),'accepted',true,'reason','Conferência da ata fixture');
 begin perform app_private.save_routine_supervision(v_org,v_owner,v_operation);raise exception 'Cliente fez revisão interna';exception when insufficient_privilege then null;end;
 perform set_config('qa.reject_reply','yes',true);
 begin perform app_private.save_routine_supervision(v_org,v_admin,v_operation);raise exception 'Não injetou falha A07';exception when sqlstate 'P0999' then null;end;
 if (select count(*) from app_private.asset_adherence_facts where organization_id=v_org)<>v_count or exists(select 1 from app_private.routine_supervision_events where organization_id=v_org) then raise exception 'Revisão parcial após falha';end if;
 perform set_config('qa.reject_reply','no',true);
 v_id:=app_private.save_routine_supervision(v_org,v_admin,v_operation);
 if app_private.save_routine_supervision(v_org,v_admin,v_operation)<>v_id then raise exception 'Duplicou revisão';end if;
 if (select count(*) from app_private.asset_adherence_facts where organization_id=v_org)<>v_count+1 then raise exception 'Revisão sem fato ou duplicada';end if;
 if not exists(select 1 from app_private.asset_adherence_facts where id=v_id and actor_user_id=v_admin and origin='manual' and payload->>'kind'='evidencia_revisada' and (payload->>'accepted')::boolean) then raise exception 'Revisão sem autoria';end if;
 begin perform app_private.save_routine_supervision(v_org,v_admin,v_operation||jsonb_build_object('id',gen_random_uuid()));raise exception 'Aceitou revisão antiga';exception when sqlstate 'PT409' then null;end;
 v_operation:=jsonb_build_object('id',gen_random_uuid(),'cycleId',v_cycle,'operation','orientar','expectedEventId',v_id,'reason','Revisar os encaminhamentos pendentes');
 v_id:=app_private.save_routine_supervision(v_org,v_admin,v_operation);
 v_operation:=jsonb_build_object('id',gen_random_uuid(),'cycleId',v_cycle,'operation','prazo','expectedEventId',v_id,'reason','Retorno acordado com a liderança','responseDueAt',clock_timestamp()+interval '2 days');
 v_id:=app_private.save_routine_supervision(v_org,v_admin,v_operation);
 if not exists(select 1 from app_private.asset_adherence_cycles where id=v_cycle and due_at<=clock_timestamp()) then raise exception 'Adiamento alterou prazo/denominador original';end if;
 if (select progress from public.action_point_assignments where diagnostic_id=v_diag)<>0 then raise exception 'Revisão alterou implantação';end if;
 if app_private.get_customer_routine_records(v_org,v_owner,v_diag)::text not like '%Retorno acordado com a liderança%' then raise exception 'Cliente não recebeu orientação e prazo';end if;
 if jsonb_array_length(app_private.get_admin_routine_cycles(v_org,v_admin)->'cycles')<>2 then raise exception 'Fila não leu ciclos';end if;
 begin perform app_private.get_admin_routine_cycles(v_org,v_owner);raise exception 'Cliente leu fila interna';exception when insufficient_privilege then null;end;
 -- Um novo relato tira a validade de uma revisão direcionada ao anterior.
 perform app_private.record_asset_adherence_fact(v_org,v_cycle,v_owner,gen_random_uuid(),'{"kind":"execucao_relatada","performed":true,"evidence":[]}');
 v_operation:=jsonb_build_object('id',gen_random_uuid(),'cycleId',v_cycle,'operation','evidencia','expectedEventId',v_id,'factId',(select id from app_private.asset_adherence_facts where cycle_id=v_cycle and payload->>'kind'='execucao_relatada' order by sequence desc limit 1),'accepted',true,'reason','Não pode validar sem prova');
 begin perform app_private.save_routine_supervision(v_org,v_admin,v_operation);raise exception 'Validou sem evidência';exception when sqlstate 'PT409' then null;end;
 v_operation:=v_operation||jsonb_build_object('accepted',false,'reason','Anexe uma referência antes da nova revisão');
 v_id:=app_private.save_routine_supervision(v_org,v_admin,v_operation);
 perform app_private.record_asset_adherence_fact(v_org,v_cycle,v_owner,gen_random_uuid(),'{"kind":"excecao_solicitada","reason":"Ocorrência fixture não elegível"}');
 v_operation:=jsonb_build_object('id',gen_random_uuid(),'cycleId',v_cycle,'operation','excecao','expectedEventId',v_id,'factId',(select id from app_private.asset_adherence_facts where cycle_id=v_cycle and payload->>'kind'='excecao_solicitada' order by sequence desc limit 1),'accepted',true,'reason','Ocorrência e critério conferidos');
 v_id:=app_private.save_routine_supervision(v_org,v_admin,v_operation);
 if not exists(select 1 from app_private.asset_adherence_facts where id=v_id and payload->>'kind'='excecao_revisada' and (payload->>'accepted')::boolean) then raise exception 'Exceção sem revisão';end if;
 if has_table_privilege('authenticated','app_private.routine_supervision_events','select') or has_table_privilege('service_role','app_private.routine_supervision_events','update') then raise exception 'Histórico não é privado/imutável';end if;
 perform set_config('role','service_role',true);
 perform app_private.get_admin_routine_cycles(v_org,v_admin);
 perform app_private.get_customer_routine_records(v_org,v_owner,v_diag);
end $$;
select 'routine_human_supervision_ok' as result;
rollback;
