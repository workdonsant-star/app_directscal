-- Credenciais globais do agente: o aplicativo cifra antes de gravar.
create table app_private.agent_provider_connections (
  provider text primary key check (provider in ('anthropic', 'openai', 'gemini')),
  model text not null check (length(trim(model)) between 1 and 120),
  sealed_key jsonb,
  selected boolean not null default false,
  updated_by uuid references next_auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create unique index agent_provider_one_selected_idx
  on app_private.agent_provider_connections (selected) where selected;

alter table app_private.agent_provider_connections enable row level security;
revoke all on app_private.agent_provider_connections from public, anon, authenticated;
grant select, insert, update, delete on app_private.agent_provider_connections to service_role;

create function app_private.save_agent_provider_connection(
  p_actor_user_id uuid, p_provider text, p_model text,
  p_sealed_key jsonb, p_select boolean
) returns void language plpgsql security invoker set search_path = public, pg_catalog as $$
begin
  if not exists (select 1 from public.organization_members where user_id = p_actor_user_id and role = 'superadmin') then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;
  if p_provider not in ('anthropic', 'openai', 'gemini') or length(trim(p_model)) not between 1 and 120 then
    raise exception 'Configuração inválida' using errcode = '22023';
  end if;
  if p_select then
    update app_private.agent_provider_connections set selected = false where selected;
  end if;
  insert into app_private.agent_provider_connections (provider, model, sealed_key, selected, updated_by)
  values (p_provider, trim(p_model), p_sealed_key, p_select, p_actor_user_id)
  on conflict (provider) do update set
    model = excluded.model,
    sealed_key = coalesce(excluded.sealed_key, agent_provider_connections.sealed_key),
    selected = p_select or agent_provider_connections.selected,
    updated_by = p_actor_user_id,
    updated_at = now();
end $$;
revoke all on function app_private.save_agent_provider_connection(uuid,text,text,jsonb,boolean) from public, anon, authenticated;
grant execute on function app_private.save_agent_provider_connection(uuid,text,text,jsonb,boolean) to service_role;
