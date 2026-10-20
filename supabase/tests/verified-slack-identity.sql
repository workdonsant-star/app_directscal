begin;
do $$
declare v_org uuid:=gen_random_uuid(); v_other uuid:=gen_random_uuid(); v_user uuid:=gen_random_uuid(); v_admin uuid:=gen_random_uuid(); v_user2 uuid:=gen_random_uuid();
 v_team text:='TQA-'||gen_random_uuid()::text; v_other_team text:='TQA-'||gen_random_uuid()::text;
 v_code text:='dsc_'||repeat('a',43); v_code2 text:='dsc_'||repeat('b',43); v_hash text; v_job uuid; v_wrong uuid; v_lease uuid; v_value jsonb; v_question jsonb;
begin
 insert into next_auth.users(id,email,name) values(v_user,v_user::text||'@fixture.invalid','Pessoa fixture'),(v_user2,v_user2::text||'@fixture.invalid','Pessoa fixture 2'),(v_admin,v_admin::text||'@fixture.invalid','Operação fixture');
 insert into public.organizations(id,name) values(v_org,'Fixture identidade'),(v_other,'Fixture outra identidade');
 insert into public.organization_members(organization_id,user_id,role) values(v_org,v_user,'cliente'),(v_org,v_user2,'admin'),(v_other,v_admin,'superadmin');
 insert into app_private.slack_installations(team_id,organization_id,bot_token) values(v_team,v_org,'token-ficticio'),(v_other_team,v_other,'token-ficticio');
 v_hash:=encode(sha256(convert_to(v_code,'UTF8')),'hex');
 begin perform app_private.start_slack_identity(v_org,v_admin,v_hash); raise exception 'Operação forjou identidade'; exception when insufficient_privilege then null; end;
 perform app_private.start_slack_identity(v_org,v_user,v_hash);
 begin perform app_private.start_slack_identity(v_org,v_user,encode(sha256(convert_to(v_code2,'UTF8')),'hex')); raise exception 'Sem limite de geração'; exception when sqlstate 'PT429' then null; end;
 v_question:=jsonb_build_object('kind','direct','teamId',v_team,'userId','UQA1','channel','DQA','ts','100.001','text','vincular '||v_code);
 v_job:=app_private.enqueue_slack_delivery('QA-identity-'||gen_random_uuid()::text,v_team,v_question);
 v_value:=app_private.claim_slack_delivery(v_job);v_lease:=(v_value->>'lease_id')::uuid;
 begin perform app_private.complete_slack_identity(v_job,gen_random_uuid()); raise exception 'Lease forjado'; exception when sqlstate 'PT409' then null; end;
 -- Workspace diferente nunca encontra o desafio da empresa original.
 v_wrong:=app_private.enqueue_slack_delivery('QA-identity-'||gen_random_uuid()::text,v_other_team,v_question||jsonb_build_object('teamId',v_other_team));
 v_value:=app_private.claim_slack_delivery(v_wrong);
 if app_private.complete_slack_identity(v_wrong,(v_value->>'lease_id')::uuid) then raise exception 'Cruza empresa'; end if;
 if not app_private.complete_slack_identity(v_job,v_lease) or not app_private.complete_slack_identity(v_job,v_lease) then raise exception 'Não confirmou ou reentrou'; end if;
 v_value:=app_private.get_verified_slack_identities(v_org);
 if jsonb_array_length(v_value)<>1 or v_value->0->>'appUserId'<>v_user::text or v_value->0->>'slackIdentity'<>v_team||':UQA1' then raise exception 'Leitura da prova inválida'; end if;
 if jsonb_array_length(app_private.get_verified_slack_identities(v_other))<>0 then raise exception 'Vazou vínculo'; end if;
 -- Reutilizar código em outro evento/pessoa não transfere controle.
 v_wrong:=app_private.enqueue_slack_delivery('QA-identity-'||gen_random_uuid()::text,v_team,v_question||'{"userId":"UQA2"}');
 v_value:=app_private.claim_slack_delivery(v_wrong);
 if app_private.complete_slack_identity(v_wrong,(v_value->>'lease_id')::uuid) then raise exception 'Reuso do código aceito'; end if;
 perform app_private.start_slack_identity(v_org,v_user2,encode(sha256(convert_to(v_code2,'UTF8')),'hex'));
 v_wrong:=app_private.enqueue_slack_delivery('QA-identity-'||gen_random_uuid()::text,v_team,v_question||jsonb_build_object('text','vincular '||v_code2));
 v_value:=app_private.claim_slack_delivery(v_wrong);
 if app_private.complete_slack_identity(v_wrong,(v_value->>'lease_id')::uuid) then raise exception 'Pessoa Slack em duas contas'; end if;
 -- Vínculo deixa de valer com revogação da instalação ou remoção do acesso.
 update app_private.slack_installations set revoked_at=clock_timestamp() where team_id=v_team;
 if jsonb_array_length(app_private.get_verified_slack_identities(v_org))<>0 then raise exception 'Instalação revogada conciliou'; end if;
 update app_private.slack_installations set revoked_at=null where team_id=v_team;
 delete from public.organization_members where organization_id=v_org and user_id=v_user;
 if jsonb_array_length(app_private.get_verified_slack_identities(v_org))<>0 then raise exception 'Membership removido conciliou'; end if;
 if app_private.complete_slack_identity(v_job,v_lease) then raise exception 'Reentrada após remoção de acesso'; end if;
 insert into public.organization_members(organization_id,user_id,role) values(v_org,v_user,'cliente');
 perform app_private.unlink_slack_identity(v_org,v_user);
 if jsonb_array_length(app_private.get_verified_slack_identities(v_org))<>0 or app_private.complete_slack_identity(v_job,v_lease) then raise exception 'Desvinculação reativou prova antiga'; end if;
 -- Expiração e revogação são definitivas para desafios não consumidos.
 update app_private.slack_identity_challenges set expires_at=clock_timestamp()-interval '1 second' where organization_id=v_org and user_id=v_user2;
 if app_private.complete_slack_identity(v_wrong,(v_value->>'lease_id')::uuid) then raise exception 'Código expirado aceito'; end if;
 if has_table_privilege('authenticated','app_private.slack_identity_links','select') or has_function_privilege('anon','app_private.complete_slack_identity(uuid,uuid)','execute') then raise exception 'Privilégio indevido'; end if;
 perform set_config('role','service_role',true);
 perform app_private.get_verified_slack_identities(v_org);
 perform app_private.unlink_slack_identity(v_org,v_user2);
end $$;
select 'verified_slack_identity_ok' as result;
rollback;
