create function app_private.get_customer_routine_records(p_organization_id uuid,p_actor_user_id uuid,p_diagnostic_id uuid,p_before_at timestamptz default null,p_before_id uuid default null)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare v_owner boolean;
begin
 -- A mesma autorização dos acordos exige membership e acesso ao diagnóstico.
 perform app_private.get_customer_adherence_agreements(p_organization_id,p_actor_user_id,p_diagnostic_id);
 select exists(select 1 from public.organization_members where organization_id=p_organization_id and user_id=p_actor_user_id and role='cliente') into v_owner;
 if (p_before_at is null)<>(p_before_id is null) then raise exception using errcode='PT400',message='Cursor inválido';end if;
 return coalesce((select jsonb_agg(jsonb_build_object(
   'createdAt',c.created_at,
   'cycle',jsonb_build_object('id',c.id,'opportunityKey',c.opportunity_key,'opensAt',c.opens_at,'dueAt',c.due_at,
     'rule',jsonb_build_object('id',r.id,'routineId',r.routine_id,'revision',r.revision,'organizationId',r.organization_id,'diagnosticId',r.diagnostic_id,
       'actionPointId',r.action_point_id,'assetId',r.asset_id,'assetVersionId',r.asset_version_id,'questionId',r.question_id,'sectorId',r.sector_id,
       'assignee',jsonb_build_object('teamId',r.assignee_team_id,'userId',r.assignee_user_id),'schedule',r.schedule,'expectation',r.expectation,'createdAt',r.created_at),
     'facts',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'cycleId',f.cycle_id,'sequence',f.sequence,'recordedAt',f.recorded_at,'actorUserId',f.actor_user_id,
       'payload',f.payload,'origin',f.origin,'slackTeamId',f.slack_team_id,'slackUserId',f.slack_user_id,'slackEventJobId',f.slack_event_job_id) order by f.sequence)
       from app_private.asset_adherence_facts f where f.cycle_id=c.id and f.organization_id=p_organization_id),'[]'::jsonb)),
   'proposals',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'operation',p.operation,'status',p.status,'expiresAt',p.expires_at,'createdAt',p.created_at,
       'resolvedAt',p.resolved_at,'actorName',p.actor_name,'factId',p.fact_id) order by p.created_at,p.id)
       from app_private.routine_reply_proposals p where p.cycle_id=c.id and p.organization_id=p_organization_id),'[]'::jsonb),
   'messages',coalesce((select jsonb_agg(m.entry order by m.sent_at,m.sort_id) from (
     select j.received_at sent_at,j.id::text||':source' sort_id,jsonb_build_object('id',j.id::text||':source','actor','pessoa','name',p.actor_name,'text',j.question->>'text','at',j.received_at) entry
       from app_private.routine_reply_proposals p join app_private.slack_delivery_jobs j on j.id=p.source_job_id
       where p.cycle_id=c.id and p.organization_id=p_organization_id
     union all
     select j.updated_at,j.id::text||':agent',jsonb_build_object('id',j.id::text||':agent','actor','agente','name','DirectScal','text',j.reply->>'text','at',j.updated_at)
       from app_private.slack_delivery_jobs j where j.organization_id=p_organization_id and j.delivered_ts is not null and (
       exists(select 1 from app_private.routine_contact_jobs contact where contact.job_id=j.id and contact.cycle_id=c.id and contact.organization_id=p_organization_id) or
       exists(select 1 from app_private.routine_reply_proposals p where p.cycle_id=c.id and p.organization_id=p_organization_id and (p.source_job_id=j.id or p.resolution_job_id=j.id)))
     union all
     select j.received_at,j.id::text||':decision',jsonb_build_object('id',j.id::text||':decision','actor','pessoa','name',p.actor_name,'text',j.question->>'text','at',j.received_at)
       from app_private.routine_reply_proposals p join app_private.slack_delivery_jobs j on j.id=p.resolution_job_id
       where p.cycle_id=c.id and p.organization_id=p_organization_id
   ) m),'[]'::jsonb)
 ) order by c.created_at desc,c.id desc) from (
   select c.* from app_private.asset_adherence_cycles c join app_private.asset_adherence_rules r on r.id=c.rule_id and r.organization_id=c.organization_id
   join public.admin_deliveries d on d.diagnostic_id=r.diagnostic_id and d.organization_id=r.organization_id and d.status='publicada' and r.action_point_id=any(d.selected_action_point_ids)
   where c.organization_id=p_organization_id and r.diagnostic_id=p_diagnostic_id and c.opens_at<=now()
   and (p_before_at is null or (c.created_at,c.id)<(p_before_at,p_before_id))
   and (v_owner or exists(select 1 from app_private.slack_identity_links l
     join app_private.slack_installations i on i.team_id=l.slack_team_id and i.organization_id=l.organization_id and i.revoked_at is null
     where l.organization_id=p_organization_id and l.user_id=p_actor_user_id and l.slack_team_id=r.assignee_team_id and l.slack_user_id=r.assignee_user_id))
   order by c.created_at desc,c.id desc limit 100
 ) c join app_private.asset_adherence_rules r on r.id=c.rule_id and r.organization_id=c.organization_id),'[]'::jsonb);
end $$;
revoke all on function app_private.get_customer_routine_records(uuid,uuid,uuid,timestamptz,uuid) from public,anon,authenticated;
grant execute on function app_private.get_customer_routine_records(uuid,uuid,uuid,timestamptz,uuid) to service_role;
notify pgrst,'reload schema';
