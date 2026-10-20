-- Base de aderência: acordos imutáveis, oportunidades explícitas e fatos auditáveis.
-- Nenhum ciclo é inferido de consulta ao agente ou de progresso de implantação.
create table app_private.asset_adherence_rules (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null,
  revision integer not null check(revision>0),
  organization_id uuid not null references public.organizations(id),
  diagnostic_id uuid not null references public.diagnostics(id),
  action_point_id text not null check (char_length(trim(action_point_id)) between 1 and 200),
  asset_id uuid not null,
  asset_version_id uuid not null,
  question_id uuid not null references public.questions(id),
  sector_id uuid not null,
  assignee_team_id text not null check (char_length(trim(assignee_team_id)) between 1 and 200),
  assignee_user_id text not null check (char_length(trim(assignee_user_id)) between 1 and 200),
  schedule jsonb not null,
  expectation text not null check (char_length(trim(expectation)) between 1 and 2000),
  created_by uuid not null references next_auth.users(id),
  created_at timestamptz not null default clock_timestamp(),
  unique(id,organization_id,routine_id), unique(routine_id,revision),
  foreign key(asset_id,organization_id) references public.management_assets(id,organization_id),
  foreign key(asset_version_id,organization_id) references public.management_asset_versions(id,organization_id),
  foreign key(sector_id,organization_id) references public.organization_sectors(id,organization_id),
  check (coalesce(jsonb_typeof(schedule)='object' and schedule->>'timeZone'='America/Sao_Paulo' and (
    (schedule->>'kind'='periodica' and schedule->>'cadence' in ('diaria','semanal','quinzenal','mensal','trimestral','semestral','anual') and schedule ?& array['kind','cadence','timeZone'] and schedule - array['kind','cadence','timeZone']='{}'::jsonb) or
    (schedule->>'kind'='por_evento' and char_length(trim(schedule->>'eventKey')) between 1 and 200 and schedule ?& array['kind','eventKey','timeZone'] and jsonb_typeof(schedule->'eventKey')='string' and schedule - array['kind','eventKey','timeZone']='{}'::jsonb)
  ),false))
);
create index asset_adherence_rules_diagnostic_idx on app_private.asset_adherence_rules(diagnostic_id);
create index asset_adherence_rules_asset_idx on app_private.asset_adherence_rules(asset_id,organization_id);
create index asset_adherence_rules_version_idx on app_private.asset_adherence_rules(asset_version_id,organization_id);
create index asset_adherence_rules_question_idx on app_private.asset_adherence_rules(question_id);
create index asset_adherence_rules_sector_idx on app_private.asset_adherence_rules(sector_id,organization_id);
create index asset_adherence_rules_actor_idx on app_private.asset_adherence_rules(created_by);
create index asset_adherence_rules_org_idx on app_private.asset_adherence_rules(organization_id,created_at,id);

create table app_private.asset_adherence_cycles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  rule_id uuid not null,
  routine_id uuid not null,
  opportunity_key text not null check(char_length(trim(opportunity_key)) between 1 and 200),
  opens_at timestamptz not null,
  due_at timestamptz not null check(due_at>=opens_at),
  created_at timestamptz not null default clock_timestamp(),
  unique(routine_id,opportunity_key), unique(id,organization_id),
  foreign key(rule_id,organization_id,routine_id) references app_private.asset_adherence_rules(id,organization_id,routine_id)
);
create index asset_adherence_cycles_rule_idx on app_private.asset_adherence_cycles(rule_id,organization_id,routine_id);
create index asset_adherence_cycles_org_due_idx on app_private.asset_adherence_cycles(organization_id,due_at,id);

create table app_private.asset_adherence_facts (
  id uuid primary key, -- chave idempotente gerada pelo chamador, sem identidade embutida
  sequence bigint generated always as identity unique,
  organization_id uuid not null references public.organizations(id),
  cycle_id uuid not null,
  actor_user_id uuid not null references next_auth.users(id),
  payload jsonb not null check(jsonb_typeof(payload)='object' and payload->>'kind' in
    ('leitura_confirmada','execucao_relatada','evidencia_revisada','excecao_solicitada','excecao_revisada','resultado_registrado')),
  recorded_at timestamptz not null default clock_timestamp(),
  foreign key(cycle_id,organization_id) references app_private.asset_adherence_cycles(id,organization_id)
);
create index asset_adherence_facts_cycle_idx on app_private.asset_adherence_facts(cycle_id,organization_id,sequence);
create index asset_adherence_facts_org_idx on app_private.asset_adherence_facts(organization_id,sequence);
create index asset_adherence_facts_actor_idx on app_private.asset_adherence_facts(actor_user_id);

-- Revalidação dos vínculos e do responsável, sem copiar o diretório Slack.
create function app_private.validate_asset_adherence_rule() returns trigger
language plpgsql security invoker set search_path='' set lock_timeout='5s' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.routine_id::text,0));
  if exists(select 1 from app_private.asset_adherence_rules where routine_id=new.routine_id and organization_id<>new.organization_id) then
    raise exception 'Rotina pertence a outra empresa.' using errcode='42501'; end if;
  if new.revision<>coalesce((select max(revision) from app_private.asset_adherence_rules where routine_id=new.routine_id),0)+1 then
    raise exception 'A revisão da rotina mudou.' using errcode='PT409'; end if;
  if not exists(select 1 from public.organization_members where user_id=new.created_by
    and (role='superadmin' or (role='cliente' and organization_id=new.organization_id))) then
    raise exception 'Ator sem acesso à empresa.' using errcode='42501'; end if;
  if not exists(select 1 from public.diagnostics d join public.questions q on q.template_id=d.template_id
    join public.admin_deliveries p on p.diagnostic_id=d.id and p.organization_id=d.organization_id
    where d.id=new.diagnostic_id and d.organization_id=new.organization_id and q.id=new.question_id
      and p.status='publicada' and new.action_point_id=any(p.selected_action_point_ids)) then
    raise exception 'Origem não publicada nesta empresa ou pergunta incompatível.' using errcode='PT409'; end if;
  if not exists(select 1 from public.management_assets a join public.management_asset_versions v
    on v.id=a.current_published_version_id and v.asset_id=a.id and v.organization_id=a.organization_id
    where a.id=new.asset_id and a.organization_id=new.organization_id and v.id=new.asset_version_id
      and a.status='publicado' and a.archived_at is null and v.published_at is not null) then
    raise exception 'Selecione a versão publicada vigente.' using errcode='PT409'; end if;
  if not exists(select 1 from public.action_point_assignments where diagnostic_id=new.diagnostic_id
    and organization_id=new.organization_id and action_point_id=new.action_point_id
    and assignee_team_id=new.assignee_team_id and assignee_slack_user_id=new.assignee_user_id) then
    raise exception 'Responsável difere da atribuição atual.' using errcode='PT409'; end if;
  return new;
end;
$$;
create trigger validate_asset_adherence_rule before insert on app_private.asset_adherence_rules
for each row execute function app_private.validate_asset_adherence_rule();

create function app_private.validate_asset_adherence_cycle() returns trigger
language plpgsql security invoker set search_path='' set lock_timeout='5s' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.routine_id::text,0));
  if exists(select 1 from app_private.asset_adherence_rules where id=new.rule_id and organization_id<>new.organization_id) then
    raise exception 'Acordo pertence a outra empresa.' using errcode='42501'; end if;
  if new.rule_id is distinct from (select id from app_private.asset_adherence_rules
    where routine_id=new.routine_id and organization_id=new.organization_id order by revision desc limit 1) then
    raise exception 'Use o acordo vigente para novas oportunidades.' using errcode='PT409'; end if;
  return new;
end;
$$;
create trigger validate_asset_adherence_cycle before insert on app_private.asset_adherence_cycles
for each row execute function app_private.validate_asset_adherence_cycle();

-- Apenas fatos adicionais: correções não apagam o relato ou a revisão anterior.
create function app_private.record_asset_adherence_fact(
  p_organization_id uuid,p_cycle_id uuid,p_actor_user_id uuid,p_id uuid,p_payload jsonb
) returns jsonb language plpgsql security invoker set search_path='' set lock_timeout='5s' as $$
declare
  v_existing app_private.asset_adherence_facts;
  v_ref app_private.asset_adherence_facts;
  v_kind text:=p_payload->>'kind';
  v_sequence bigint;
  v_recorded timestamptz;
  v_opens timestamptz;
begin
  if not exists(select 1 from public.organization_members where user_id=p_actor_user_id
    and (role='superadmin' or (role='cliente' and organization_id=p_organization_id))) then
    raise exception 'Ator sem acesso à empresa.' using errcode='42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('adherence-cycle:'||p_cycle_id::text,0));
  select opens_at into v_opens from app_private.asset_adherence_cycles
    where id=p_cycle_id and organization_id=p_organization_id;
  if not found then raise exception 'Ciclo indisponível.' using errcode='PT404'; end if;
  select * into v_existing from app_private.asset_adherence_facts where id=p_id;
  if found then
    if v_existing.cycle_id=p_cycle_id and v_existing.organization_id=p_organization_id
      and v_existing.actor_user_id=p_actor_user_id and v_existing.payload=p_payload then
      return jsonb_build_object('id',v_existing.id,'sequence',v_existing.sequence,'recordedAt',v_existing.recorded_at);
    end if;
    raise exception 'Chave de tentativa já utilizada.' using errcode='PT409';
  end if;
  if clock_timestamp()<v_opens then raise exception 'O ciclo ainda não abriu.' using errcode='PT409'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object' or v_kind is null or v_kind not in
    ('leitura_confirmada','execucao_relatada','evidencia_revisada','excecao_solicitada','excecao_revisada','resultado_registrado') then
    raise exception 'Tipo de fato inválido.' using errcode='PT400'; end if;
  if p_payload - (case v_kind
    when 'leitura_confirmada' then array['kind']
    when 'execucao_relatada' then array['kind','performed','evidence']
    when 'evidencia_revisada' then array['kind','executionId','accepted','reason']
    when 'excecao_solicitada' then array['kind','reason']
    when 'excecao_revisada' then array['kind','requestId','accepted','reason']
    else array['kind','indicator','baseline','observed','unit','source','reason'] end) <> '{}'::jsonb then
    raise exception 'Campos de fato desconhecidos.' using errcode='PT400'; end if;
  if v_kind='execucao_relatada' then
    if jsonb_typeof(p_payload->'performed') is distinct from 'boolean' or jsonb_typeof(p_payload->'evidence') is distinct from 'array' then
      raise exception 'Relato inválido.' using errcode='PT400'; end if;
    if jsonb_array_length(p_payload->'evidence')>20 or exists(select 1 from jsonb_array_elements(p_payload->'evidence') x
      where jsonb_typeof(x) is distinct from 'string' or x#>>'{}' !~ '^https://[^[:space:]]+$' or char_length(x#>>'{}')>2000) then
      raise exception 'Referências de evidência inválidas.' using errcode='PT400'; end if;
  end if;
  if v_kind in ('evidencia_revisada','excecao_revisada','excecao_solicitada','resultado_registrado') and
    (jsonb_typeof(p_payload->'reason') is distinct from 'string' or char_length(trim(p_payload->>'reason')) not between 1 and 2000) then
    raise exception 'Registre a justificativa.' using errcode='PT400'; end if;
  if v_kind in ('evidencia_revisada','excecao_revisada') then
    if jsonb_typeof(p_payload->'accepted') is distinct from 'boolean' then raise exception 'Revisão inválida.' using errcode='PT400'; end if;
    select * into v_ref from app_private.asset_adherence_facts where cycle_id=p_cycle_id and organization_id=p_organization_id
      and payload->>'kind'=case when v_kind='evidencia_revisada' then 'execucao_relatada' else 'excecao_solicitada' end
      order by sequence desc limit 1;
    if v_ref.id is null or v_ref.id::text is distinct from p_payload->>(case when v_kind='evidencia_revisada' then 'executionId' else 'requestId' end) then
      raise exception 'A revisão não corresponde ao registro vigente.' using errcode='PT409'; end if;
    if v_kind='evidencia_revisada' and (p_payload->>'accepted')::boolean and
      ((v_ref.payload->>'performed')::boolean is not true or jsonb_array_length(v_ref.payload->'evidence')=0) then
      raise exception 'Não há execução com evidência para validar.' using errcode='PT409'; end if;
  end if;
  if v_kind='resultado_registrado' and (
    jsonb_typeof(p_payload->'baseline') is distinct from 'number' or jsonb_typeof(p_payload->'observed') is distinct from 'number' or
    coalesce(char_length(trim(p_payload->>'indicator')),0) not between 1 and 200 or
    coalesce(char_length(trim(p_payload->>'unit')),0) not between 1 and 200 or
    coalesce(p_payload->>'source','') !~ '^https://[^[:space:]]+$' or char_length(p_payload->>'source')>2000) then
    raise exception 'Resultado sem indicador, base ou fonte.' using errcode='PT400'; end if;
  insert into app_private.asset_adherence_facts(id,organization_id,cycle_id,actor_user_id,payload)
    values(p_id,p_organization_id,p_cycle_id,p_actor_user_id,p_payload) returning sequence,recorded_at into v_sequence,v_recorded;
  return jsonb_build_object('id',p_id,'sequence',v_sequence,'recordedAt',v_recorded);
end;
$$;

alter table app_private.asset_adherence_rules enable row level security;
alter table app_private.asset_adherence_cycles enable row level security;
alter table app_private.asset_adherence_facts enable row level security;
revoke all on app_private.asset_adherence_rules,app_private.asset_adherence_cycles,app_private.asset_adherence_facts from public,anon,authenticated,service_role;
grant select,insert on app_private.asset_adherence_rules,app_private.asset_adherence_cycles,app_private.asset_adherence_facts to service_role;
revoke all on sequence app_private.asset_adherence_facts_sequence_seq from public,anon,authenticated,service_role;
grant usage,select on sequence app_private.asset_adherence_facts_sequence_seq to service_role;
revoke all on function app_private.validate_asset_adherence_cycle() from public,anon,authenticated;
revoke all on function app_private.validate_asset_adherence_rule() from public,anon,authenticated;
revoke all on function app_private.record_asset_adherence_fact(uuid,uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function app_private.record_asset_adherence_fact(uuid,uuid,uuid,uuid,jsonb) to service_role;
