create table app_private.slack_delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_id text not null references app_private.slack_installations(team_id),
  question jsonb not null check(jsonb_typeof(question)='object'),
  status text not null default 'recebido' check(status in('recebido','processando','concluido','falhou','incerto')),
  attempts integer not null default 0 check(attempts between 0 and 5),
  retryable boolean not null default true,
  available_at timestamptz not null default now(),
  lease_id uuid,
  lease_until timestamptz,
  reply jsonb check(reply is null or jsonb_typeof(reply)='object'),
  send_started_at timestamptz,
  delivered_ts text,
  error_code text,
  received_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check((lease_id is null)=(lease_until is null)),
  check(status<>'processando' or lease_id is not null),
  check(delivered_ts is null or status='concluido')
);
create index slack_delivery_jobs_org_idx on app_private.slack_delivery_jobs(organization_id,received_at desc,id);
create index slack_delivery_jobs_team_idx on app_private.slack_delivery_jobs(team_id);
create index slack_delivery_jobs_ready_idx on app_private.slack_delivery_jobs(available_at,id) where status in('recebido','falhou','processando');
alter table app_private.slack_delivery_jobs enable row level security;
revoke all on app_private.slack_delivery_jobs from public,anon,authenticated,service_role;
grant select,insert,update on app_private.slack_delivery_jobs to service_role;

create function app_private.enqueue_slack_delivery(p_event_id text,p_team_id text,p_question jsonb) returns uuid
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_org uuid; v_job app_private.slack_delivery_jobs;
begin
  if length(p_event_id) not between 1 and 200 or jsonb_typeof(p_question)<>'object' or octet_length(p_question::text)>24000 then
    raise exception using errcode='22023',message='Evento inválido'; end if;
  select organization_id into v_org from app_private.slack_installations where team_id=p_team_id and revoked_at is null;
  if v_org is null then return null; end if;
  if p_question->>'teamId' is distinct from p_team_id then raise exception using errcode='22023',message='Workspace divergente'; end if;
  -- Recibos antigos não são reexecutados durante a implantação da fila.
  if exists(select 1 from app_private.slack_event_receipts where event_id=p_event_id) then return null; end if;
  insert into app_private.slack_delivery_jobs(event_id,organization_id,team_id,question)
    values(p_event_id,v_org,p_team_id,p_question) on conflict(event_id) do nothing;
  select * into v_job from app_private.slack_delivery_jobs where event_id=p_event_id;
  if v_job.organization_id<>v_org or v_job.team_id<>p_team_id or v_job.question<>p_question then
    raise exception using errcode='PT409',message='Evento divergente'; end if;
  return v_job.id;
end $$;

create function app_private.claim_slack_delivery(p_job_id uuid default null) returns jsonb
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_job app_private.slack_delivery_jobs;
begin
  -- Um processo morto durante envio não prova que o Slack deixou de receber.
  update app_private.slack_delivery_jobs set status='incerto',retryable=false,lease_id=null,lease_until=null,error_code='envio_sem_confirmacao',updated_at=clock_timestamp()
    where status='processando' and lease_until<clock_timestamp() and send_started_at is not null and (p_job_id is null or id=p_job_id);
  update app_private.slack_delivery_jobs set status='falhou',retryable=false,lease_id=null,lease_until=null,error_code='provedor_indisponivel',updated_at=clock_timestamp()
    where status='processando' and lease_until<clock_timestamp() and send_started_at is null and attempts>=5 and (p_job_id is null or id=p_job_id);
  select * into v_job from app_private.slack_delivery_jobs where (p_job_id is null or id=p_job_id) and attempts<5 and
    ((status in('recebido','falhou') and retryable and available_at<=clock_timestamp()) or (status='processando' and lease_until<clock_timestamp() and send_started_at is null))
    order by available_at,id for update skip locked limit 1;
  if not found then return null; end if;
  update app_private.slack_delivery_jobs set status='processando',attempts=attempts+1,lease_id=gen_random_uuid(),lease_until=clock_timestamp()+interval '3 minutes',updated_at=clock_timestamp()
    where id=v_job.id returning * into v_job;
  return to_jsonb(v_job);
end $$;

create function app_private.transition_slack_delivery(p_id uuid,p_lease_id uuid,p_operation text,p_value jsonb default '{}'::jsonb) returns void
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_job app_private.slack_delivery_jobs; v_code text; v_retry boolean;
begin
  select * into v_job from app_private.slack_delivery_jobs where id=p_id for update;
  if not found or v_job.status<>'processando' or v_job.lease_id is distinct from p_lease_id or v_job.lease_until<clock_timestamp() then
    raise exception using errcode='PT409',message='Processamento desatualizado'; end if;
  if p_operation='preparar' then
    if v_job.send_started_at is not null or jsonb_typeof(p_value)<>'object' or coalesce(length(p_value->>'text'),0) not between 1 and 40000 or octet_length(p_value::text)>100000 then
      raise exception using errcode='22023',message='Resposta inválida'; end if;
    if v_job.reply is not null and v_job.reply<>p_value then raise exception using errcode='PT409',message='Resposta já preparada'; end if;
    update app_private.slack_delivery_jobs set reply=p_value,updated_at=clock_timestamp() where id=p_id;
  elsif p_operation='enviar' then
    if v_job.reply is null or v_job.send_started_at is not null then raise exception using errcode='PT409',message='Envio indisponível'; end if;
    update app_private.slack_delivery_jobs set send_started_at=clock_timestamp(),updated_at=clock_timestamp() where id=p_id;
  elsif p_operation='concluir' then
    if v_job.send_started_at is null or coalesce(p_value->>'ts','')!~'^[0-9]+\.[0-9]+$' then raise exception using errcode='22023',message='Confirmação inválida'; end if;
    update app_private.slack_delivery_jobs set status='concluido',delivered_ts=p_value->>'ts',retryable=false,lease_id=null,lease_until=null,error_code=null,updated_at=clock_timestamp() where id=p_id;
  elsif p_operation='ignorar' then
    if v_job.send_started_at is not null then raise exception using errcode='PT409',message='Envio iniciado'; end if;
    update app_private.slack_delivery_jobs set status='concluido',retryable=false,lease_id=null,lease_until=null,updated_at=clock_timestamp() where id=p_id;
  elsif p_operation in('falhar','incerto') then
    v_code:=p_value->>'code';
    if v_code not in('provedor_indisponivel','instalacao_indisponivel','contexto_indisponivel','rate_limited','missing_scope','invalid_auth','channel_not_found','envio_recusado','envio_sem_confirmacao') or v_code is null then
      raise exception using errcode='22023',message='Falha inválida'; end if;
    v_retry:=coalesce((p_value->>'retryable')::boolean,false) and v_job.attempts<5 and p_operation<>'incerto';
    if p_operation='incerto' and v_job.send_started_at is null then raise exception using errcode='PT409',message='Nenhum envio iniciado'; end if;
    update app_private.slack_delivery_jobs set status=case when p_operation='incerto' then 'incerto' else 'falhou' end,retryable=v_retry,
      available_at=clock_timestamp()+make_interval(secs=>greatest(30,least(3600,coalesce((p_value->>'retryAfter')::integer,60*v_job.attempts)))),
      send_started_at=case when p_operation='falhar' then null else send_started_at end,error_code=v_code,lease_id=null,lease_until=null,updated_at=clock_timestamp() where id=p_id;
  else raise exception using errcode='22023',message='Operação inválida'; end if;
end $$;

create function app_private.retry_slack_delivery(p_id uuid,p_organization_id uuid,p_actor_user_id uuid,p_expected_updated_at timestamptz) returns void
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
begin
  if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then raise exception using errcode='42501',message='Acesso restrito'; end if;
  update app_private.slack_delivery_jobs set status='recebido',retryable=true,attempts=0,available_at=clock_timestamp(),error_code=null,updated_at=clock_timestamp()
    where id=p_id and organization_id=p_organization_id and status='falhou' and updated_at=p_expected_updated_at and send_started_at is null;
  if not found then raise exception using errcode='PT409',message='Evento indisponível ou desatualizado'; end if;
end $$;
revoke all on function app_private.enqueue_slack_delivery(text,text,jsonb),app_private.claim_slack_delivery(uuid),app_private.transition_slack_delivery(uuid,uuid,text,jsonb),app_private.retry_slack_delivery(uuid,uuid,uuid,timestamptz) from public,anon,authenticated;
grant execute on function app_private.enqueue_slack_delivery(text,text,jsonb),app_private.claim_slack_delivery(uuid),app_private.transition_slack_delivery(uuid,uuid,text,jsonb),app_private.retry_slack_delivery(uuid,uuid,uuid,timestamptz) to service_role;
notify pgrst,'reload schema';
