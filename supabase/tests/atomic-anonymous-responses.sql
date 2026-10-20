begin;
set local lock_timeout='2s';
set local statement_timeout='10s';
create function pg_temp.fail_fixture_response_answer() returns trigger language plpgsql as $$
begin
  if current_setting('directscal.qa_fail',true)='on' then
    raise exception 'Falha controlada da resposta' using errcode='P0999';
  end if;
  return new;
end;
$$;
do $$
declare
  v_org uuid:=gen_random_uuid(); v_owner uuid:=gen_random_uuid(); v_diag uuid:=gen_random_uuid();
  v_template uuid; v_link uuid:=gen_random_uuid(); v_token text:=gen_random_uuid()::text;
  v_key uuid:=gen_random_uuid(); v_answers jsonb; v_reverse jsonb; v_count integer; v_q uuid;
  v_result jsonb; v_trigger text:='qa_atomic_'||replace(gen_random_uuid()::text,'-','');
begin
  insert into next_auth.users(id,email,name) values(v_owner,v_owner::text||'@fixture.invalid','Fixture coleta');
  insert into public.organizations(id,name) values(v_org,'Fixture coleta atômica');
  select id into v_template from public.diagnostic_templates limit 1;
  insert into public.diagnostics(id,organization_id,template_id,name,created_by_user_id,status,activated_at,deadline)
    values(v_diag,v_org,v_template,'Fixture coleta atômica',v_owner,'ativo',now(),(now() at time zone 'America/Sao_Paulo')::date+1);
  insert into public.diagnostic_share_links(id,diagnostic_id,group_id,token)
    values(v_link,v_diag,'operacao',v_token);
  select jsonb_agg(jsonb_build_object('questionId',id,'value',3) order by id),count(*),min(id::text)::uuid
    into v_answers,v_count,v_q from public.questions where template_id=v_template;
  select jsonb_agg(value order by ord desc) into v_reverse from jsonb_array_elements(v_answers) with ordinality t(value,ord);
  -- O trigger transitório só alcança a pergunta fixture e só falha nesta transação.
  execute format('create trigger %I before insert on public.likert_answers for each row when (new.question_id=%L::uuid) execute function pg_temp.fail_fixture_response_answer()',v_trigger,v_q);
  perform set_config('directscal.qa_fail','on',true);
  begin
    perform app_private.submit_anonymous_likert_response(v_token,v_key,v_answers);
    raise exception 'Falha intermediária não foi exercitada';
  exception when sqlstate 'P0999' then null; end;
  if exists(select 1 from public.response_sessions where diagnostic_id=v_diag) or
     exists(select 1 from app_private.anonymous_response_receipts where share_link_id=v_link) then
    raise exception 'Falha deixou sessão parcial ou recibo'; end if;
  perform set_config('directscal.qa_fail','off',true);
  v_result:=app_private.submit_anonymous_likert_response(v_token,v_key,v_answers);
  if v_result->>'duplicate'<>'false' then raise exception 'Primeiro envio foi marcado duplicado'; end if;
  v_result:=app_private.submit_anonymous_likert_response(v_token,v_key,v_reverse);
  if v_result->>'duplicate'<>'true' then raise exception 'Reenvio reordenado não foi reconhecido'; end if;
  if (select count(*) from public.response_sessions where diagnostic_id=v_diag and status='concluido' and respondent_id is null)<>1 then
    raise exception 'Sessão duplicada ou identificada'; end if;
  if (select count(*) from public.likert_answers a join public.response_sessions s on s.id=a.response_session_id where s.diagnostic_id=v_diag)<>v_count then
    raise exception 'Respostas perdidas ou duplicadas'; end if;
  begin
    perform app_private.submit_anonymous_likert_response(v_token,v_key,jsonb_set(v_answers,'{0,value}','4'));
    raise exception 'Mesma chave aceitou respostas diferentes';
  exception when sqlstate 'PT409' then null; end;
  begin
    perform app_private.submit_anonymous_likert_response(v_token,gen_random_uuid(),v_answers-0);
    raise exception 'Conjunto incompleto foi aceito';
  exception when sqlstate 'PT400' then null; end;
  update public.diagnostic_share_links set expires_at=now()-interval '1 day' where id=v_link;
  begin
    perform app_private.submit_anonymous_likert_response(v_token,gen_random_uuid(),v_answers);
    raise exception 'Link expirado foi aceito';
  exception when sqlstate 'PT410' then null; end;
  update public.diagnostic_share_links set expires_at=null where id=v_link;
  update public.diagnostics set deadline=(now() at time zone 'America/Sao_Paulo')::date-1 where id=v_diag;
  begin
    perform app_private.submit_anonymous_likert_response(v_token,gen_random_uuid(),v_answers);
    raise exception 'Prazo encerrado foi aceito';
  exception when sqlstate 'PT410' then null; end;
  update public.diagnostics set deadline=null,status='encerrado',closed_at=now() where id=v_diag;
  begin
    perform app_private.submit_anonymous_likert_response(v_token,gen_random_uuid(),v_answers);
    raise exception 'Coleta encerrada aceitou nova resposta';
  exception when sqlstate 'PT409' then null; end;
  -- Confirmação idempotente de uma gravação anterior não cria nova resposta.
  v_result:=app_private.submit_anonymous_likert_response(v_token,v_key,v_answers);
  if v_result->>'duplicate'<>'true' then raise exception 'Confirmação anterior foi perdida'; end if;
  if has_table_privilege('authenticated','app_private.anonymous_response_receipts','SELECT') or
    has_function_privilege('anon','app_private.submit_anonymous_likert_response(text,uuid,jsonb)','EXECUTE') then
    raise exception 'Recibo ou função exposta'; end if;
end;
$$;
select 'atomic anonymous responses: ok' as result;
rollback;
