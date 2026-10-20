begin;
create function pg_temp.reject_fixture_acquisition_receipt() returns trigger language plpgsql as $$
begin
 if exists(select 1 from next_auth.users where id=new.user_id and email=TG_ARGV[0]) then raise exception using errcode='P0999',message='Falha controlada no recibo';end if;
 return new;
end $$;
do $$
declare
 v_org uuid:=gen_random_uuid();v_owner uuid:=gen_random_uuid();v_google uuid:=gen_random_uuid();v_campaign text:='qa-'||gen_random_uuid();
 v_domain text:='corp-'||replace(gen_random_uuid()::text,'-','')||'.invalid';v_email text;v_google_email text;v_fail_email text:='fail-'||gen_random_uuid()||'@fixture.invalid';
 v_hash text:='scrypt$16384$8$1$'||repeat('a',22)||'$'||repeat('b',86);v_input jsonb;v_result jsonb;v_again jsonb;v_new_org uuid;v_new_user uuid;v_module text;
 v_trigger text:='qa_acquisition_'||replace(gen_random_uuid()::text,'-','');
begin
 v_email:='new@'||v_domain;v_google_email:='google@'||v_domain;
 select module_id into v_module from public.acquisition_campaigns limit 1;
 insert into public.acquisition_campaigns(id,module_id,name,source,status,token,public_path) values(v_campaign,coalesce(v_module,'qa-module'),'Campanha fixture','QA','ativo',gen_random_uuid()::text,'/a/'||v_campaign);
 insert into next_auth.users(id,email,name) values(v_owner,'owner@'||v_domain,'Dono fixture'),(v_google,v_google_email,'Google fixture');
 insert into public.organizations(id,name,domain,employee_count) values(v_org,'Empresa existente fixture',v_domain,7);
 insert into public.organization_members(organization_id,user_id,role) values(v_org,v_owner,'cliente');
 insert into app_private.user_password_credentials(user_id,password_hash) values(v_owner,v_hash);
 v_input:=jsonb_build_object('provider','password','campaignId',v_campaign,'email',v_email,'name','Pessoa nova fixture','companyName','Empresa existente fixture','companySize','11 a 50','employeeCount',11,'domain',v_domain,'values','{}'::jsonb,'phone',null,'role',null,'objective',null,'passwordHash',v_hash);
 v_result:=app_private.complete_acquisition_account(null,v_input);v_new_org:=(v_result->'lead'->>'organization_id')::uuid;v_new_user:=(v_result->'user'->>'id')::uuid;
 if v_new_org is null or v_new_org=v_org or exists(select 1 from public.organization_members where user_id=v_new_user and organization_id=v_org) then raise exception 'Cadastro público entrou em empresa existente';end if;
 if not exists(select 1 from public.organizations where id=v_org and name='Empresa existente fixture' and employee_count=7 and domain=v_domain) then raise exception 'Alterou empresa preexistente';end if;
 if not exists(select 1 from public.organizations where id=v_new_org and domain is null and operational_onboarding_required) then raise exception 'Domínio duplicado ou preparação dispensada';end if;
 begin perform app_private.complete_acquisition_account(null,v_input);raise exception 'Reutilizou conta por senha';exception when sqlstate 'PT409' then null;end;
 begin perform app_private.complete_acquisition_account(null,v_input||jsonb_build_object('email','owner@'||v_domain));raise exception 'Sobrescreveu senha existente';exception when sqlstate 'PT409' then null;end;
 if (select password_hash from app_private.user_password_credentials where user_id=v_owner)<>v_hash then raise exception 'Alterou credencial anterior';end if;
 -- Conta Google comprovada cria empresa isolada; repetição devolve o mesmo recibo.
 v_input:=(v_input-'passwordHash')||jsonb_build_object('provider','google','email',v_google_email,'name','Google fixture');
 v_result:=app_private.complete_acquisition_account(v_google,v_input);
 v_again:=app_private.complete_acquisition_account(v_google,v_input);
 if v_again<>v_result then raise exception 'Reentrada Google duplicou cadastro';end if;
 if (v_result->'lead'->>'organization_id')::uuid=v_org or exists(select 1 from public.organization_members where user_id=v_google and organization_id=v_org) then raise exception 'Google ganhou empresa pelo domínio/nome';end if;
 begin perform app_private.complete_acquisition_account(v_owner,v_input);raise exception 'Aceitou ID/e-mail de contas diferentes';exception when insufficient_privilege then null;end;
 begin perform app_private.complete_acquisition_account(v_google,v_input||jsonb_build_object('companyName','Outro cadastro'));raise exception 'Reentrada alterou empresa';exception when sqlstate 'PT409' then null;end;
 delete from public.organization_members where user_id=v_google and organization_id=(v_result->'lead'->>'organization_id')::uuid;
 begin perform app_private.complete_acquisition_account(v_google,v_input);raise exception 'Cadastro recriou acesso removido';exception when sqlstate 'PT409' then null;end;
 -- Falha final não deixa usuário, empresa, senha, membership ou lead parciais.
 execute format('create trigger %I before insert on app_private.acquisition_account_setups for each row execute function pg_temp.reject_fixture_acquisition_receipt(%L)',v_trigger,v_fail_email);
 v_input:=v_input||jsonb_build_object('provider','password','email',v_fail_email,'passwordHash',v_hash,'domain',null,'companyName','Falha fixture '||v_fail_email);
 begin perform app_private.complete_acquisition_account(null,v_input);raise exception 'Não injetou falha';exception when sqlstate 'P0999' then null;end;
 if exists(select 1 from next_auth.users where email=v_fail_email) or exists(select 1 from public.organizations where name='Falha fixture '||v_fail_email) or exists(select 1 from public.acquisition_leads where email=v_fail_email) then raise exception 'Cadastro parcial após falha';end if;
 if has_table_privilege('authenticated','app_private.acquisition_account_setups','select') or has_function_privilege('anon','app_private.complete_acquisition_account(uuid,jsonb)','execute') then raise exception 'Execução pública indevida';end if;
 perform set_config('role','service_role',true);
 begin
   perform app_private.complete_acquisition_account(v_google,(v_input-'passwordHash')||jsonb_build_object('provider','google','email',v_google_email,'companyName','Empresa existente fixture'));
   raise exception 'Service role recriou acesso removido';
 exception when sqlstate 'PT409' then null;end;
end $$;
select 'isolated_atomic_acquisition_ok' as result;
rollback;
