create table if not exists app_private.organization_specialist_assignments (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  specialist_id text references public.specialists(id),
  updated_by uuid not null references next_auth.users(id),
  updated_at timestamptz not null default now()
);
create index if not exists organization_specialist_assignments_specialist_idx
  on app_private.organization_specialist_assignments(specialist_id);
alter table app_private.organization_specialist_assignments enable row level security;
revoke all on app_private.organization_specialist_assignments from public, anon, authenticated;
grant select, insert, update on app_private.organization_specialist_assignments to service_role;

create or replace function app_private.assign_organization_specialist(
  p_organization_id uuid, p_actor_user_id uuid, p_specialist_id text, p_expected_updated_at timestamptz
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_current app_private.organization_specialist_assignments;
  v_now timestamptz := clock_timestamp();
begin
  if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then
    raise exception 'Acesso restrito à operação.' using errcode='42501';
  end if;
  perform 1 from public.organizations where id=p_organization_id for update;
  if not found then raise exception 'Empresa indisponível.' using errcode='PT404'; end if;
  select * into v_current from app_private.organization_specialist_assignments where organization_id=p_organization_id;
  if v_current.updated_at is distinct from p_expected_updated_at then
    raise exception 'A atribuição foi alterada em outra sessão.' using errcode='PT409';
  end if;
  if p_specialist_id is not null then
    perform 1 from public.specialists where id=p_specialist_id and status='ativo' and not archived and not deleted for share;
    if not found then raise exception 'Selecione um especialista ativo.' using errcode='PT400'; end if;
  end if;
  insert into app_private.organization_specialist_assignments(organization_id,specialist_id,updated_by,updated_at)
    values(p_organization_id,p_specialist_id,p_actor_user_id,v_now)
    on conflict(organization_id) do update set specialist_id=excluded.specialist_id,updated_by=excluded.updated_by,updated_at=excluded.updated_at;
  return jsonb_build_object('specialistId',p_specialist_id,'updatedAt',v_now);
end;
$$;
revoke all on function app_private.assign_organization_specialist(uuid,uuid,text,timestamptz) from public, anon, authenticated;
grant execute on function app_private.assign_organization_specialist(uuid,uuid,text,timestamptz) to service_role;

create or replace function app_private.get_organization_operations(p_organization_id uuid,p_actor_user_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
  if not exists(select 1 from public.organization_members where user_id=p_actor_user_id and role='superadmin') then
    raise exception 'Acesso restrito à operação.' using errcode='42501';
  end if;
  if not exists(select 1 from public.organizations where id=p_organization_id) then
    raise exception 'Empresa indisponível.' using errcode='PT404';
  end if;
  return jsonb_build_object(
    'assignment',coalesce((select jsonb_build_object('specialistId',specialist_id,'updatedAt',updated_at)
      from app_private.organization_specialist_assignments where organization_id=p_organization_id),
      jsonb_build_object('specialistId',null,'updatedAt',null)),
    'deliveries',coalesce((select jsonb_agg(jsonb_build_object(
      'id',d.id,'diagnosticName',d.name,'closedAt',coalesce(d.closed_at,d.updated_at),
      'specialistId',case when r.payload is not null then r.payload->>'specialistId' when p.diagnostic_id is not null then p.specialist_id else principal.id end,
      'status',coalesce(r.payload->>'status',p.status::text,case when principal.id is not null then 'aguardando_analise' else 'sem_especialista' end),
      'responseCount',(select count(*) from public.response_sessions s where s.diagnostic_id=d.id and s.status='concluido'),
      'canAnalyze',exists(select 1 from public.response_sessions s join public.likert_answers a on a.response_session_id=s.id
        where s.diagnostic_id=d.id and s.group_id='fundador' and s.status='concluido'))
      order by coalesce(d.closed_at,d.updated_at) desc,d.id)
      from public.diagnostics d
      left join public.admin_deliveries p on p.diagnostic_id=d.id and p.organization_id=d.organization_id
      left join app_private.admin_delivery_drafts r on r.diagnostic_id=d.id
      left join app_private.organization_specialist_assignments assignment on assignment.organization_id=d.organization_id
      left join public.specialists principal on principal.id=assignment.specialist_id and principal.status='ativo' and not principal.archived and not principal.deleted
      where d.organization_id=p_organization_id and d.status='encerrado'),'[]'::jsonb));
end;
$$;
revoke all on function app_private.get_organization_operations(uuid,uuid) from public, anon, authenticated;
grant execute on function app_private.get_organization_operations(uuid,uuid) to service_role;
