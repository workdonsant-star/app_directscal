begin;
do $$
declare v_org uuid:=gen_random_uuid();v_other uuid:=gen_random_uuid();v_op uuid:=gen_random_uuid();v_client uuid:=gen_random_uuid();
 v_audit uuid:=gen_random_uuid();v_good uuid:=gen_random_uuid();v_id uuid:=gen_random_uuid();v_next uuid:=gen_random_uuid();v_input jsonb;v_read jsonb;
begin
 insert into next_auth.users(id,email,name) values(v_op,v_op::text||'@fixture.invalid','Operação fictícia'),(v_client,v_client::text||'@fixture.invalid','Cliente fictício');
 insert into public.organizations(id,name) values(v_org,'Fixture lacunas'),(v_other,'Outra fixture lacunas');
 insert into public.organization_members(organization_id,user_id,role) values(v_org,v_op,'superadmin'),(v_org,v_client,'cliente');
 insert into public.asset_question_audits(id,organization_id,question,answer,answer_status,confidence) values(v_audit,v_org,'Pergunta fictícia','Sem fonte','insuficiente','insuficiente'),(v_good,v_org,'Pergunta respondida','Resposta','respondida','alta');
 v_input:=jsonb_build_object('id',v_id,'auditId',v_audit,'expectedEventId',null,'status','em_andamento','reason','Revisar ativo e repetir consulta','assigneeUserId',v_op,'evidenceUrl',null,'dueAt',clock_timestamp()+interval '1 day');
 begin perform app_private.save_agent_gap_review(v_org,v_client,v_input);raise exception 'Cliente escreveu';exception when insufficient_privilege then null;end;
 begin perform app_private.save_agent_gap_review(v_other,v_op,v_input);raise exception 'Outro tenant';exception when sqlstate 'PT404' then null;end;
 begin perform app_private.save_agent_gap_review(v_org,v_op,v_input||jsonb_build_object('auditId',v_good));raise exception 'Sem lacuna';exception when sqlstate 'PT409' then null;end;
 begin perform app_private.save_agent_gap_review(v_org,v_op,v_input||jsonb_build_object('assigneeUserId',v_client));raise exception 'Responsável cliente';exception when sqlstate 'PT400' then null;end;
 if app_private.save_agent_gap_review(v_org,v_op,v_input)<>v_id or app_private.save_agent_gap_review(v_org,v_op,v_input)<>v_id then raise exception 'Reentrada falhou';end if;
 begin perform app_private.save_agent_gap_review(v_org,v_op,v_input||'{"reason":"Outro texto"}');raise exception 'Reentrada divergente';exception when sqlstate 'PT409' then null;end;
 begin perform app_private.save_agent_gap_review(v_org,v_op,v_input||jsonb_build_object('id',v_next));raise exception 'Revisão antiga';exception when sqlstate 'PT409' then null;end;
 v_input:=v_input||jsonb_build_object('id',v_next,'expectedEventId',v_id,'status','resolvida','dueAt',null);
 begin perform app_private.save_agent_gap_review(v_org,v_op,v_input);raise exception 'Resolveu sem evidência';exception when sqlstate 'PT400' then null;end;
 perform app_private.save_agent_gap_review(v_org,v_op,v_input||'{"evidenceUrl":"https://example.invalid/ativo/publicado","reason":"Ativo publicado e consulta conferida"}');
 v_read:=app_private.get_agent_operations(v_org,v_op,array[v_audit]);
 if jsonb_array_length(v_read->'reviews')<>2 or v_read->'health'->>'queries30Days'<>'2' or v_read->'reviews'->1->>'status'<>'resolvida' then raise exception 'Leitura incompleta';end if;
 if jsonb_array_length(app_private.get_agent_operations(v_other,v_op,array[v_audit])->'reviews')<>0 then raise exception 'Vazamento';end if;
 begin perform app_private.get_agent_operations(v_org,v_client);raise exception 'Cliente leu privado';exception when insufficient_privilege then null;end;
 if (select answer from public.asset_question_audits where id=v_audit)<>'Sem fonte' then raise exception 'Alterou resposta original';end if;
 -- Reabrir conserva todas as decisões anteriores.
 perform app_private.save_agent_gap_review(v_org,v_op,v_input||jsonb_build_object('id',gen_random_uuid(),'expectedEventId',v_next,'status','aberta','evidenceUrl',null));
 if (select count(*) from app_private.agent_gap_reviews where audit_id=v_audit)<>3 then raise exception 'Histórico perdido';end if;
 if has_function_privilege('authenticated','app_private.save_agent_gap_review(uuid,uuid,jsonb)','execute') or has_table_privilege('authenticated','app_private.agent_gap_reviews','select') or has_table_privilege('service_role','app_private.agent_gap_reviews','update') then raise exception 'Grants excessivos';end if;
end $$;
select 'agent_gap_reviews_ok' as result;
rollback;
