-- Chave aleatória por navegador/link; não registra identidade, IP ou e-mail.
create table if not exists app_private.anonymous_response_receipts (
  share_link_id uuid not null references public.diagnostic_share_links(id) on delete cascade,
  submission_hash text not null,
  answers_hash text not null,
  response_session_id uuid not null references public.response_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(share_link_id,submission_hash)
);
create index if not exists anonymous_response_receipts_session_idx
  on app_private.anonymous_response_receipts(response_session_id);
alter table app_private.anonymous_response_receipts enable row level security;
revoke all on app_private.anonymous_response_receipts from public,anon,authenticated;
grant select,insert on app_private.anonymous_response_receipts to service_role;

create or replace function app_private.submit_anonymous_likert_response(
  p_token text,p_submission_id uuid,p_answers jsonb
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  v_link public.diagnostic_share_links;
  v_diagnostic public.diagnostics;
  v_receipt app_private.anonymous_response_receipts;
  v_key text;
  v_answers_hash text;
  v_count integer;
  v_session uuid;
begin
  if p_submission_id is null or p_token is null or jsonb_typeof(p_answers) is distinct from 'array' then
    raise exception 'Dados de envio inválidos.' using errcode='PT400';
  end if;
  if jsonb_array_length(p_answers) < 1 or jsonb_array_length(p_answers) > 1000 then
    raise exception 'Conjunto de respostas inválido.' using errcode='PT400';
  end if;
  if exists(select 1 from jsonb_array_elements(p_answers) a
    where jsonb_typeof(a) is distinct from 'object' or jsonb_typeof(a->'questionId') is distinct from 'string'
      or jsonb_typeof(a->'value') is distinct from 'number' or (a->>'value') !~ '^[1-5]$') then
    raise exception 'Respostas inválidas.' using errcode='PT400';
  end if;
  select * into v_link from public.diagnostic_share_links where token=p_token;
  if not found then raise exception 'Link inválido.' using errcode='PT404'; end if;
  -- Serializa envios e encerramento; um encerramento concorrente não permite nova escrita.
  select * into v_diagnostic from public.diagnostics where id=v_link.diagnostic_id for update;
  if not found then raise exception 'Coleta indisponível.' using errcode='PT409'; end if;
  select * into v_link from public.diagnostic_share_links
    where token=p_token and diagnostic_id=v_diagnostic.id for share;
  if not found then raise exception 'Link inválido.' using errcode='PT404'; end if;
  v_key:=encode(sha256(convert_to(v_link.id::text||':'||p_submission_id::text,'UTF8')),'hex');
  select encode(sha256(convert_to(jsonb_agg(jsonb_build_object('questionId',a->>'questionId','value',a->'value')
    order by a->>'questionId')::text,'UTF8')),'hex') into v_answers_hash from jsonb_array_elements(p_answers) a;
  select * into v_receipt from app_private.anonymous_response_receipts
    where share_link_id=v_link.id and submission_hash=v_key;
  if found then
    if v_receipt.answers_hash <> v_answers_hash then
      raise exception 'Esta tentativa já registrou outras respostas.' using errcode='PT409';
    end if;
    return jsonb_build_object('duplicate',true);
  end if;
  if v_link.expires_at is not null and v_link.expires_at < clock_timestamp() then
    raise exception 'Link expirado.' using errcode='PT410';
  end if;
  if v_diagnostic.status <> 'ativo' or v_diagnostic.closed_at is not null then
    raise exception 'Coleta encerrada ou indisponível.' using errcode='PT409';
  end if;
  if v_diagnostic.deadline is not null and v_diagnostic.deadline < (clock_timestamp() at time zone 'America/Sao_Paulo')::date then
    raise exception 'Prazo da pesquisa encerrado.' using errcode='PT410';
  end if;
  select count(*) into v_count from public.questions where template_id=v_diagnostic.template_id;
  if v_count=0 or v_count <> jsonb_array_length(p_answers)
    or (select count(distinct a->>'questionId') from jsonb_array_elements(p_answers) a) <> v_count
    or exists(select 1 from jsonb_array_elements(p_answers) a where not exists(
      select 1 from public.questions q where q.template_id=v_diagnostic.template_id and q.id::text=a->>'questionId')) then
    raise exception 'Responda exatamente as perguntas da coleta.' using errcode='PT400';
  end if;
  insert into public.response_sessions(diagnostic_id,group_id,share_link_id,status)
    values(v_diagnostic.id,v_link.group_id,v_link.id,'iniciado') returning id into v_session;
  insert into public.likert_answers(response_session_id,question_id,value)
    select v_session,(a->>'questionId')::uuid,(a->>'value')::integer from jsonb_array_elements(p_answers) a;
  update public.response_sessions set status='concluido',submitted_at=clock_timestamp() where id=v_session;
  insert into app_private.anonymous_response_receipts(share_link_id,submission_hash,answers_hash,response_session_id)
    values(v_link.id,v_key,v_answers_hash,v_session);
  return jsonb_build_object('duplicate',false);
end;
$$;
revoke all on function app_private.submit_anonymous_likert_response(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function app_private.submit_anonymous_likert_response(text,uuid,jsonb) to service_role;
