create table app_private.acquisition_account_setups (
 user_id uuid primary key references next_auth.users(id) on delete cascade,
 organization_id uuid not null unique references public.organizations(id),
 lead_id uuid not null unique references public.acquisition_leads(id),
 payload_hash text not null check(payload_hash~'^[0-9a-f]{64}$'),created_at timestamptz not null default clock_timestamp()
);
alter table app_private.acquisition_account_setups enable row level security;
revoke all on app_private.acquisition_account_setups from public,anon,authenticated,service_role;
grant select,insert on app_private.acquisition_account_setups to service_role;
create function app_private.complete_acquisition_account(p_user_id uuid,p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' set lock_timeout='5s' as $$
declare v_email text:=lower(trim(p_input->>'email'));v_provider text:=p_input->>'provider';v_user next_auth.users;
 v_campaign public.acquisition_campaigns;v_receipt app_private.acquisition_account_setups;v_lead public.acquisition_leads;
 v_org uuid;v_domain text:=nullif(lower(trim(p_input->>'domain')),'');v_hash text:=encode(sha256(convert_to((p_input-'passwordHash')::text,'UTF8')),'hex');
begin
 if jsonb_typeof(p_input) is distinct from 'object' or coalesce(v_provider,'') not in('google','password') or
   coalesce(char_length(v_email),0) not between 3 and 320 or coalesce(char_length(trim(p_input->>'name')),0) not between 1 and 160 or
   coalesce(char_length(trim(p_input->>'companyName')),0) not between 1 and 300 or jsonb_typeof(p_input->'values') is distinct from 'object' or
   jsonb_typeof(p_input->'employeeCount') is distinct from 'number' or (p_input->>'employeeCount')::integer<1 or
   p_input-array['provider','campaignId','email','name','companyName','companySize','employeeCount','domain','values','phone','role','objective','passwordHash']<>'{}'::jsonb then
   raise exception using errcode='PT400',message='Revise os dados do cadastro';end if;
 if v_domain is not null and v_domain<>split_part(v_email,'@',2) then raise exception using errcode='PT400',message='Domínio inválido';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('acquisition-account:'||v_email,0));
 select * into v_campaign from public.acquisition_campaigns where id=p_input->>'campaignId' and status='ativo' for share;
 if not found then raise exception using errcode='PT409',message='Campanha indisponível';end if;
 if v_provider='password' then
   if p_user_id is not null or exists(select 1 from next_auth.users where lower(trim(email))=v_email) or
     exists(select 1 from public.acquisition_leads where normalized_email=v_email and status='account_created') then
     raise exception using errcode='PT409',message='E-mail já cadastrado. Entre ou recupere o acesso';end if;
   if coalesce(p_input->>'passwordHash','') !~ '^scrypt\$16384\$8\$1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{86}$' then raise exception using errcode='PT400',message='Credencial inválida';end if;
   insert into next_auth.users(id,email,name) values(gen_random_uuid(),v_email,trim(p_input->>'name')) returning * into v_user;
 else
   if p_user_id is null or p_input ? 'passwordHash' then raise exception using errcode='42501',message='Confirme sua conta Google';end if;
   select * into v_user from next_auth.users where id=p_user_id and lower(trim(email))=v_email for update;
   if not found then raise exception using errcode='42501',message='Confirme sua conta Google';end if;
   select * into v_receipt from app_private.acquisition_account_setups where user_id=v_user.id;
   if found then
     if v_receipt.payload_hash<>v_hash or not exists(select 1 from public.organization_members where user_id=v_user.id and organization_id=v_receipt.organization_id and role in('cliente','admin')) or
       exists(select 1 from public.organization_members where user_id=v_user.id and role='superadmin') then raise exception using errcode='PT409',message='Cadastro já concluído ou acesso removido. Entre ou fale com a DirectScal';end if;
     select * into v_lead from public.acquisition_leads where id=v_receipt.lead_id;
     return jsonb_build_object('user',jsonb_build_object('id',v_user.id,'email',v_user.email,'name',v_user.name,'image',v_user.image),'lead',to_jsonb(v_lead));
   end if;
   if exists(select 1 from public.organization_members where user_id=v_user.id) or exists(select 1 from public.acquisition_leads where user_id=v_user.id and status='account_created') then
     raise exception using errcode='PT409',message='E-mail já cadastrado. Entre ou recupere o acesso';end if;
 end if;
 -- Domínio é metadado da nova empresa; nunca autorização para usar uma existente.
 if v_domain is not null and exists(select 1 from public.organizations where domain=v_domain) then v_domain:=null;end if;
 begin
   insert into public.organizations(name,domain,employee_count,operational_onboarding_required)
   values(trim(p_input->>'companyName'),v_domain,(p_input->>'employeeCount')::integer,true) returning id into v_org;
 exception when unique_violation then
   insert into public.organizations(name,employee_count,operational_onboarding_required)
   values(trim(p_input->>'companyName'),(p_input->>'employeeCount')::integer,true) returning id into v_org;
 end;
 insert into public.organization_members(organization_id,user_id,role) values(v_org,v_user.id,'cliente');
 if v_provider='password' then insert into app_private.user_password_credentials(user_id,password_hash) values(v_user.id,p_input->>'passwordHash');end if;
 insert into public.acquisition_leads(module_id,campaign_id,user_id,organization_id,name,email,phone,role,company_name,company_size,objective,field_values,status,account_provider)
 values(v_campaign.module_id,v_campaign.id,v_user.id,v_org,trim(p_input->>'name'),v_email,p_input->>'phone',p_input->>'role',trim(p_input->>'companyName'),p_input->>'companySize',p_input->>'objective',p_input->'values','account_created',v_provider::public.acquisition_account_provider)
 on conflict(campaign_id,normalized_email) do update set user_id=excluded.user_id,organization_id=excluded.organization_id,name=excluded.name,phone=excluded.phone,role=excluded.role,
   company_name=excluded.company_name,company_size=excluded.company_size,objective=excluded.objective,field_values=excluded.field_values,status=excluded.status,account_provider=excluded.account_provider
 returning * into v_lead;
 insert into app_private.acquisition_account_setups(user_id,organization_id,lead_id,payload_hash) values(v_user.id,v_org,v_lead.id,v_hash);
 return jsonb_build_object('user',jsonb_build_object('id',v_user.id,'email',v_user.email,'name',v_user.name,'image',v_user.image),'lead',to_jsonb(v_lead));
end $$;
revoke all on function app_private.complete_acquisition_account(uuid,jsonb) from public,anon,authenticated;
grant execute on function app_private.complete_acquisition_account(uuid,jsonb) to service_role;
notify pgrst,'reload schema';
