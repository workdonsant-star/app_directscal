-- Rascunhos privados não alteram o snapshot consumido pelo cliente.
create table if not exists app_private.admin_delivery_drafts (
  diagnostic_id uuid primary key references public.diagnostics(id) on delete cascade,
  payload jsonb not null,
  updated_by uuid not null references next_auth.users(id),
  updated_at timestamptz not null default now()
);
create table if not exists app_private.admin_delivery_versions (
  id uuid primary key default gen_random_uuid(),
  diagnostic_id uuid not null references public.diagnostics(id) on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists admin_delivery_versions_diagnostic_idx
  on app_private.admin_delivery_versions(diagnostic_id, created_at desc);
alter table app_private.admin_delivery_drafts enable row level security;
alter table app_private.admin_delivery_versions enable row level security;
revoke all on app_private.admin_delivery_drafts, app_private.admin_delivery_versions from public, anon, authenticated;
grant select, insert, update, delete on app_private.admin_delivery_drafts to service_role;
grant select, insert on app_private.admin_delivery_versions to service_role;

-- Preserva a versão vigente antes de habilitar novas revisões.
insert into app_private.admin_delivery_versions(diagnostic_id, snapshot)
select d.diagnostic_id, to_jsonb(d) from public.admin_deliveries d
where d.status = 'publicada' and not exists (
  select 1 from app_private.admin_delivery_versions v where v.diagnostic_id = d.diagnostic_id
);

create or replace function app_private.get_admin_delivery_draft(p_diagnostic_id uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select payload from app_private.admin_delivery_drafts where diagnostic_id = p_diagnostic_id;
$$;

create or replace function app_private.save_admin_delivery_revision(
  p_diagnostic_id uuid, p_actor_user_id uuid, p_input jsonb
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_diagnostic public.diagnostics;
  v_row public.admin_deliveries;
  v_status text;
  v_ready boolean;
  v_published_at timestamptz;
  v_payload jsonb;
  v_ids text[];
  v_now timestamptz := clock_timestamp();
begin
  if not exists (select 1 from public.organization_members
    where user_id = p_actor_user_id and role = 'superadmin') then
    raise exception 'Acesso restrito à operação Directscal.' using errcode = '42501';
  end if;
  select * into v_diagnostic from public.diagnostics where id = p_diagnostic_id for update;
  if not found or v_diagnostic.status <> 'encerrado' then
    raise exception 'A entrega precisa pertencer a um diagnóstico encerrado.';
  end if;
  if p_input->>'intent' is null or p_input->>'intent' not in ('save','publish') then
    raise exception 'Operação inválida.';
  end if;
  select coalesce(array_agg(distinct value), '{}'::text[]) into v_ids
    from jsonb_array_elements_text(p_input->'selectedActionPointIds');
  -- A ordem editorial também é a ordem de exibição e exportação.
  select coalesce(array_agg(value order by first_position), '{}'::text[]) into v_ids
  from (select value, min(ord) first_position
    from jsonb_array_elements_text(p_input->'selectedActionPointIds') with ordinality t(value,ord)
    group by value) selected;
  v_ready := nullif(p_input->>'specialistId','') is not null
    and cardinality(v_ids) > 0
    and (select count(*) = 6 and bool_and(char_length(trim(value)) >= 20)
      from jsonb_each_text(p_input->'report'));
  if p_input->>'intent' = 'publish' and not coalesce(v_ready,false) then
    raise exception 'Complete o relatório, especialista e ações antes de publicar.';
  end if;
  v_status := case when p_input->>'intent' = 'publish' then 'publicada'
    when nullif(p_input->>'specialistId','') is null then 'sem_especialista'
    when v_ready then 'pronta_para_publicar' else 'em_analise' end;
  v_published_at := case when v_status = 'publicada' then v_now else null end;
  v_payload := jsonb_build_object(
    'diagnosticId',p_diagnostic_id,'organizationId',v_diagnostic.organization_id,
    'specialistId',p_input->'specialistId','status',v_status,
    'report',p_input->'report','dimensionReadings',p_input->'dimensionReadings',
    'selectedActionPointIds',to_jsonb(v_ids),'publishedAt',v_published_at,'updatedAt',v_now);
  if v_status <> 'publicada' then
    insert into app_private.admin_delivery_drafts(diagnostic_id,payload,updated_by,updated_at)
    values(p_diagnostic_id,v_payload,p_actor_user_id,v_now)
    on conflict(diagnostic_id) do update set payload=excluded.payload,
      updated_by=excluded.updated_by,updated_at=excluded.updated_at;
  end if;
  -- Uma revisão salva nunca sobrescreve a entrega pública já aprovada.
  insert into public.admin_deliveries(diagnostic_id,organization_id,specialist_id,status,
    report_content,dimension_readings,selected_action_point_ids,published_at,published_by_user_id)
  values(p_diagnostic_id,v_diagnostic.organization_id,p_input->>'specialistId',v_status,
    p_input->'report',p_input->'dimensionReadings',v_ids,v_published_at,
    case when v_status='publicada' then p_actor_user_id else null end)
  on conflict(diagnostic_id) do update set specialist_id=excluded.specialist_id,status=excluded.status,
    report_content=excluded.report_content,dimension_readings=excluded.dimension_readings,
    selected_action_point_ids=excluded.selected_action_point_ids,published_at=excluded.published_at,
    published_by_user_id=excluded.published_by_user_id
  where public.admin_deliveries.status <> 'publicada' or v_status='publicada'
  returning * into v_row;
  if v_status='publicada' then
    insert into app_private.admin_delivery_versions(diagnostic_id,snapshot)
      values(p_diagnostic_id,to_jsonb(v_row));
    delete from app_private.admin_delivery_drafts where diagnostic_id=p_diagnostic_id;
  end if;
  return v_payload;
end;
$$;
revoke all on function app_private.get_admin_delivery_draft(uuid) from public,anon,authenticated;
revoke all on function app_private.save_admin_delivery_revision(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function app_private.get_admin_delivery_draft(uuid) to service_role;
grant execute on function app_private.save_admin_delivery_revision(uuid,uuid,jsonb) to service_role;
