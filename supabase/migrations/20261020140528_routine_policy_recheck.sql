-- Política nova reavalia adiamento, sem antecipar Retry-After ou bloquear linhas de envio ao salvar a política.
create or replace function app_private.claim_slack_delivery(p_job_id uuid default null) returns jsonb
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare v_job app_private.slack_delivery_jobs;
begin
  -- Um processo morto durante envio não prova que o Slack deixou de receber.
  update app_private.slack_delivery_jobs set status='incerto',retryable=false,lease_id=null,lease_until=null,error_code='envio_sem_confirmacao',updated_at=clock_timestamp()
    where status='processando' and lease_until<clock_timestamp() and send_started_at is not null and (p_job_id is null or id=p_job_id);
  update app_private.slack_delivery_jobs set status='falhou',retryable=false,lease_id=null,lease_until=null,error_code='provedor_indisponivel',updated_at=clock_timestamp()
    where status='processando' and lease_until<clock_timestamp() and send_started_at is null and attempts>=5 and (p_job_id is null or id=p_job_id);
  select * into v_job from app_private.slack_delivery_jobs j where (p_job_id is null or id=p_job_id) and attempts<5 and
    ((status in('recebido','falhou') and retryable and (available_at<=clock_timestamp() or
      (status='recebido' and question->>'kind'='rotina' and exists(select 1 from app_private.routine_contact_policies p where p.organization_id=j.organization_id and p.created_at>j.updated_at)))) or (status='processando' and lease_until<clock_timestamp() and send_started_at is null))
    order by available_at,id for update skip locked limit 1;
  if not found then return null; end if;
  update app_private.slack_delivery_jobs set status='processando',attempts=attempts+1,lease_id=gen_random_uuid(),lease_until=clock_timestamp()+interval '3 minutes',updated_at=clock_timestamp()
    where id=v_job.id returning * into v_job;
  return to_jsonb(v_job);
end $$;

notify pgrst,'reload schema';
