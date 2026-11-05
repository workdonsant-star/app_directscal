-- O plano Hobby da Vercel não aceita cron subdiário. O banco apenas assina e agenda
-- uma chamada HTTP; o processamento e a idempotência permanecem no app.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function app_private.dispatch_scheduled_manual_action_points()
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_secret text;
  v_timestamp text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
    where name = 'directscal_action_point_cron_secret';
  if v_secret is null or length(v_secret) < 32 then
    raise exception 'action_point_cron_secret_missing';
  end if;
  v_timestamp := (floor(extract(epoch from clock_timestamp()) / 300)::bigint * 300)::text;
  return net.http_get(
    url := 'https://app.directscal.com/api/internal/manual-action-points',
    headers := pg_catalog.jsonb_build_object(
      'x-directscal-cron-timestamp', v_timestamp,
      'x-directscal-cron-signature', pg_catalog.encode(extensions.hmac('manual-action-points:' || v_timestamp, v_secret, 'sha256'), 'hex')
    ),
    timeout_milliseconds := 300000
  );
end;
$$;

revoke all on function app_private.dispatch_scheduled_manual_action_points() from public, anon, authenticated;

select cron.schedule(
  'directscal-manual-action-points',
  '*/5 * * * *',
  'select app_private.dispatch_scheduled_manual_action_points();'
);
