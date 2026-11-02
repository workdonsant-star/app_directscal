-- Executar após 20261102230000_user_access_snapshot.sql. Fixtures fictícias e ROLLBACK.
begin;
do $$
declare
  v_owner uuid := gen_random_uuid();
  v_global uuid := gen_random_uuid();
  v_org uuid := gen_random_uuid();
  v_second_org uuid := gen_random_uuid();
  v_snapshot jsonb;
begin
  insert into next_auth.users(id,email,name,image) values
    (v_owner, v_owner::text || '@fixture.invalid', 'Fixture owner', 'https://fixture.invalid/a.png'),
    (v_global, v_global::text || '@fixture.invalid', 'Fixture global', null);
  insert into public.organizations(id,name) values (v_org,'Fixture primeira'), (v_second_org,'Fixture segunda');
  insert into public.organization_members(organization_id,user_id,role,created_at) values
    (v_org, v_owner, 'cliente', now() - interval '1 day'),
    (v_second_org, v_owner, 'admin', now()),
    (v_second_org, v_global, 'cliente', now() - interval '1 day'),
    (v_org, v_global, 'superadmin', now());
  insert into public.organization_module_access(organization_id,module_id,enabled) values (v_org,'module_omdx',false);

  v_snapshot := app_private.get_user_access_snapshot(v_owner);
  if v_snapshot->>'session_version' <> app_private.get_user_session_version(v_owner) then raise exception 'Versão de sessão divergente'; end if;
  if v_snapshot->'user'->>'email' <> v_owner::text || '@fixture.invalid' then raise exception 'Conta incorreta'; end if;
  if jsonb_array_length(v_snapshot->'memberships') <> 2 then raise exception 'Vínculos incompletos'; end if;
  if (v_snapshot->'memberships'->0->>'organization_id')::uuid <> v_org then raise exception 'Ordem dos vínculos alterada'; end if;
  if (v_snapshot->'organization'->>'id')::uuid <> v_org then raise exception 'Empresa da sessão incorreta'; end if;
  if v_snapshot->'profile' <> 'null'::jsonb then raise exception 'Perfil inexistente apareceu'; end if;
  if jsonb_array_length(v_snapshot->'module_access') <> 1 or (v_snapshot->'module_access'->0->>'enabled')::boolean then raise exception 'Módulos incorretos'; end if;
  if (v_snapshot->>'onboarding_completed')::boolean then raise exception 'Onboarding marcado sem registro'; end if;
  if (v_snapshot->>'slack_connected')::boolean then raise exception 'Slack conectado sem instalação'; end if;

  insert into app_private.slack_installations(team_id,organization_id,bot_token,scope,revoked_at)
    values('T' || upper(replace(gen_random_uuid()::text,'-','')),v_org,'fixture-not-a-real-token','users:read',now());
  if (app_private.get_user_access_snapshot(v_owner)->>'slack_connected')::boolean then raise exception 'Instalação revogada contou como conexão'; end if;
  insert into app_private.slack_installations(team_id,organization_id,bot_token,scope)
    values('T' || upper(replace(gen_random_uuid()::text,'-','')),v_org,'fixture-not-a-real-token','users:read');
  if not (app_private.get_user_access_snapshot(v_owner)->>'slack_connected')::boolean then raise exception 'Instalação ativa ignorada'; end if;

  insert into public.account_profiles(user_id,name,avatar_url) values (v_owner,'Nome escolhido',null);
  insert into app_private.client_onboarding_completions(organization_id,completed_by) values (v_org,v_owner);
  v_snapshot := app_private.get_user_access_snapshot(v_owner);
  if v_snapshot->'profile'->>'name' <> 'Nome escolhido' then raise exception 'Perfil persistido ignorado'; end if;
  if not (v_snapshot->>'onboarding_completed')::boolean then raise exception 'Onboarding concluído ignorado'; end if;

  -- Papel global tem precedência na empresa da sessão, como em resolveSupabaseAuthUser.
  v_snapshot := app_private.get_user_access_snapshot(v_global);
  if (v_snapshot->'organization'->>'id')::uuid <> v_org then raise exception 'Superadmin sem precedência'; end if;
  if (v_snapshot->'memberships'->0->>'organization_id')::uuid <> v_second_org then raise exception 'Empresa principal deve seguir a ordem de criação'; end if;

  v_snapshot := app_private.get_user_access_snapshot(gen_random_uuid());
  if v_snapshot->'user' <> 'null'::jsonb or jsonb_array_length(v_snapshot->'memberships') <> 0 then raise exception 'Conta inexistente retornou dados'; end if;

  if has_function_privilege('anon','app_private.get_user_access_snapshot(uuid)','execute')
    or has_function_privilege('authenticated','app_private.get_user_access_snapshot(uuid)','execute') then
    raise exception 'Função exposta a anon/authenticated';
  end if;
end $$;
select 'user-access-snapshot ok' as result;
rollback;
