create or replace function app_private.open_routine_event_contact(p_organization_id uuid,p_actor_user_id uuid,p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_rule app_private.asset_adherence_rules;v_policy app_private.routine_contact_policies;v_receipt app_private.routine_event_occurrences;
 v_happened timestamptz;v_opens timestamptz;v_due timestamptz;v_cycle uuid;v_job uuid;v_key text;
begin
 if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then raise exception using errcode='42501',message='Acesso restrito';end if;
 select * into v_receipt from app_private.routine_event_occurrences where id=(p_input->>'id')::uuid;
 if found then
   if v_receipt.organization_id=p_organization_id and v_receipt.created_by=p_actor_user_id and v_receipt.write_payload=p_input then return jsonb_build_object('cycleId',v_receipt.cycle_id,'jobId',v_receipt.job_id);end if;
   raise exception using errcode='PT409',message='Tentativa divergente';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('routine-policy:'||p_organization_id::text,0));
 select * into v_policy from app_private.routine_contact_policies where organization_id=p_organization_id order by revision desc limit 1;
 if not coalesce(v_policy.enabled,false) or v_policy.revision is distinct from (p_input->>'expectedPolicyRevision')::integer then raise exception using errcode='PT409',message='Confira a autorização e a revisão da política de contato';end if;
 select * into v_rule from app_private.asset_adherence_rules where id=(p_input->>'ruleId')::uuid and organization_id=p_organization_id;
 if not found then raise exception using errcode='PT404',message='Rotina indisponível';end if;
 perform 1 from public.diagnostics where id=v_rule.diagnostic_id and organization_id=p_organization_id for update;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_rule.routine_id::text,0));
 if v_rule.id is distinct from (select id from app_private.asset_adherence_rules where routine_id=v_rule.routine_id order by revision desc limit 1) or
 v_rule.schedule->>'kind'<>'por_evento' or not v_rule.sector_id=any(v_policy.sector_ids) or
 (select action from app_private.asset_adherence_routine_events where routine_id=v_rule.routine_id and organization_id=p_organization_id order by sequence desc limit 1)='pausar' then raise exception using errcode='PT409',message='Acordo mudou ou está pausado';end if;
 select * into v_receipt from app_private.routine_event_occurrences where organization_id=p_organization_id and routine_id=v_rule.routine_id and source_key=p_input->>'sourceKey';
 if found then
   if v_receipt.created_by=p_actor_user_id and v_receipt.write_payload-'id'=p_input-'id' then return jsonb_build_object('cycleId',v_receipt.cycle_id,'jobId',v_receipt.job_id);end if;
   raise exception using errcode='PT409',message='A ocorrência já possui outro registro';
 end if;
 if not exists(select 1 from public.organization_sectors where id=v_rule.sector_id and organization_id=p_organization_id and active) or
 not exists(select 1 from public.management_assets where id=v_rule.asset_id and organization_id=p_organization_id and status='publicado' and current_published_version_id=v_rule.asset_version_id) or
 not exists(select 1 from public.admin_deliveries where diagnostic_id=v_rule.diagnostic_id and organization_id=p_organization_id and status='publicada' and v_rule.action_point_id=any(selected_action_point_ids)) or
 not exists(select 1 from public.action_point_assignments where diagnostic_id=v_rule.diagnostic_id and action_point_id=v_rule.action_point_id and organization_id=p_organization_id and assignee_team_id=v_rule.assignee_team_id and assignee_slack_user_id=v_rule.assignee_user_id) or
 not exists(select 1 from app_private.slack_installations where team_id=v_rule.assignee_team_id and organization_id=p_organization_id and revoked_at is null) then raise exception using errcode='PT409',message='Origem, ativo, setor ou responsável mudou';end if;
 v_happened:=(p_input->>'happenedLocal')::timestamp at time zone v_policy.time_zone;
 v_due:=(p_input->>'dueLocal')::timestamp at time zone v_policy.time_zone;
 v_opens:=greatest(v_happened,v_rule.created_at,v_policy.enabled_at);
 if v_happened>clock_timestamp() or v_happened<date_trunc('second',v_rule.created_at) or v_due<v_opens or v_due>clock_timestamp()+interval '370 days' then raise exception using errcode='PT400',message='Confira ocorrência e prazo no fuso da política';end if;
 v_key:='evento:'||encode(pg_catalog.sha256(pg_catalog.convert_to((v_rule.schedule->>'eventKey')||':'||(p_input->>'sourceKey'),'UTF8')),'hex');
 insert into app_private.asset_adherence_cycles(organization_id,rule_id,routine_id,opportunity_key,opens_at,due_at) values(p_organization_id,v_rule.id,v_rule.routine_id,v_key,v_opens,v_due) returning id into v_cycle;
 insert into app_private.slack_delivery_jobs(event_id,organization_id,team_id,question) values('routine:'||v_cycle::text,p_organization_id,v_rule.assignee_team_id,jsonb_build_object('kind','rotina','teamId',v_rule.assignee_team_id,'userId',v_rule.assignee_user_id,'channel','pendente','ts','0.0','cycleId',v_cycle)) returning id into v_job;
 insert into app_private.routine_contact_jobs(job_id,cycle_id,organization_id,team_id,user_id) values(v_job,v_cycle,p_organization_id,v_rule.assignee_team_id,v_rule.assignee_user_id);
 insert into app_private.routine_event_occurrences(id,organization_id,routine_id,rule_id,source_key,reference_url,description,happened_at,cycle_id,job_id,created_by,write_payload)
 values((p_input->>'id')::uuid,p_organization_id,v_rule.routine_id,v_rule.id,p_input->>'sourceKey',p_input->>'referenceUrl',p_input->>'description',v_happened,v_cycle,v_job,p_actor_user_id,p_input);
 return jsonb_build_object('cycleId',v_cycle,'jobId',v_job);
end $$;
notify pgrst,'reload schema';
