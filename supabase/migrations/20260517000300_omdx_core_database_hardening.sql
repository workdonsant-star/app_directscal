create index if not exists accounts_user_id_idx
  on next_auth.accounts ("userId");

create index if not exists sessions_user_id_idx
  on next_auth.sessions ("userId");

create index if not exists diagnostics_organization_id_idx
  on public.diagnostics (organization_id);

create index if not exists diagnostics_template_id_idx
  on public.diagnostics (template_id);

create index if not exists likert_answers_question_id_idx
  on public.likert_answers (question_id);

create index if not exists organization_members_user_id_idx
  on public.organization_members (user_id);

create index if not exists questions_dimension_id_idx
  on public.questions (dimension_id);

create index if not exists response_sessions_diagnostic_id_idx
  on public.response_sessions (diagnostic_id);

create index if not exists response_sessions_share_link_id_idx
  on public.response_sessions (share_link_id);

create index if not exists respondents_diagnostic_id_idx
  on public.respondents (diagnostic_id);

create or replace function next_auth.uid()
returns uuid
language sql
stable
set search_path = pg_catalog, pg_temp
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid
$$;

create or replace function app_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app_private.prevent_locked_omdx_template_changes()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  if tg_op = 'DELETE' and old.is_locked then
    raise exception 'Locked OMDx template rows cannot be deleted';
  end if;

  if tg_op = 'UPDATE' and old.is_locked then
    raise exception 'Locked OMDx template rows cannot be updated';
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function app_private.prevent_locked_omdx_question_changes()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  if tg_op = 'DELETE' and old.is_locked then
    raise exception 'Locked OMDx question rows cannot be deleted';
  end if;

  if tg_op = 'UPDATE' and old.is_locked then
    raise exception 'Locked OMDx question rows cannot be updated';
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function app_private.prevent_locked_omdx_scale_changes()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1
    from public.diagnostic_templates dt
    where dt.id = old.template_id
      and dt.is_locked
  ) then
    raise exception 'Locked OMDx scale rows cannot be changed';
  end if;

  return coalesce(new, old);
end;
$$;

revoke execute on all functions in schema app_private from public, anon;
grant execute on all functions in schema app_private to authenticated, service_role;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;

drop policy if exists diagnostic_share_links_member_select on public.diagnostic_share_links;
drop policy if exists diagnostic_share_links_member_write on public.diagnostic_share_links;

create policy diagnostic_share_links_member_select on public.diagnostic_share_links
for select to authenticated
using (app_private.can_access_diagnostic(diagnostic_id));

create policy diagnostic_share_links_member_insert on public.diagnostic_share_links
for insert to authenticated
with check (app_private.can_access_diagnostic(diagnostic_id));

create policy diagnostic_share_links_member_update on public.diagnostic_share_links
for update to authenticated
using (app_private.can_access_diagnostic(diagnostic_id))
with check (app_private.can_access_diagnostic(diagnostic_id));

create policy diagnostic_share_links_member_delete on public.diagnostic_share_links
for delete to authenticated
using (app_private.can_access_diagnostic(diagnostic_id));

drop policy if exists organization_members_admin_write on public.organization_members;
drop policy if exists organization_members_member_select on public.organization_members;

create policy organization_members_member_select on public.organization_members
for select to authenticated
using (app_private.is_org_member(organization_id));

create policy organization_members_admin_insert on public.organization_members
for insert to authenticated
with check (app_private.is_superadmin());

create policy organization_members_admin_update on public.organization_members
for update to authenticated
using (app_private.is_superadmin())
with check (app_private.is_superadmin());

create policy organization_members_admin_delete on public.organization_members
for delete to authenticated
using (app_private.is_superadmin());

drop policy if exists respondents_member_select on public.respondents;
drop policy if exists respondents_member_write on public.respondents;

create policy respondents_member_select on public.respondents
for select to authenticated
using (app_private.can_access_diagnostic(diagnostic_id));

create policy respondents_member_insert on public.respondents
for insert to authenticated
with check (app_private.can_access_diagnostic(diagnostic_id));

create policy respondents_member_update on public.respondents
for update to authenticated
using (app_private.can_access_diagnostic(diagnostic_id))
with check (app_private.can_access_diagnostic(diagnostic_id));

create policy respondents_member_delete on public.respondents
for delete to authenticated
using (app_private.can_access_diagnostic(diagnostic_id));

drop policy if exists response_sessions_member_select on public.response_sessions;
drop policy if exists response_sessions_member_write on public.response_sessions;

create policy response_sessions_member_select on public.response_sessions
for select to authenticated
using (app_private.can_access_diagnostic(diagnostic_id));

create policy response_sessions_member_insert on public.response_sessions
for insert to authenticated
with check (app_private.can_access_diagnostic(diagnostic_id));

create policy response_sessions_member_update on public.response_sessions
for update to authenticated
using (app_private.can_access_diagnostic(diagnostic_id))
with check (app_private.can_access_diagnostic(diagnostic_id));

create policy response_sessions_member_delete on public.response_sessions
for delete to authenticated
using (app_private.can_access_diagnostic(diagnostic_id));

drop policy if exists likert_answers_member_select on public.likert_answers;
drop policy if exists likert_answers_member_write on public.likert_answers;

create policy likert_answers_member_select on public.likert_answers
for select to authenticated
using (
  exists (
    select 1
    from public.response_sessions rs
    where rs.id = response_session_id
      and app_private.can_access_diagnostic(rs.diagnostic_id)
  )
);

create policy likert_answers_member_insert on public.likert_answers
for insert to authenticated
with check (
  exists (
    select 1
    from public.response_sessions rs
    where rs.id = response_session_id
      and app_private.can_access_diagnostic(rs.diagnostic_id)
  )
);

create policy likert_answers_member_update on public.likert_answers
for update to authenticated
using (
  exists (
    select 1
    from public.response_sessions rs
    where rs.id = response_session_id
      and app_private.can_access_diagnostic(rs.diagnostic_id)
  )
)
with check (
  exists (
    select 1
    from public.response_sessions rs
    where rs.id = response_session_id
      and app_private.can_access_diagnostic(rs.diagnostic_id)
  )
);

create policy likert_answers_member_delete on public.likert_answers
for delete to authenticated
using (
  exists (
    select 1
    from public.response_sessions rs
    where rs.id = response_session_id
      and app_private.can_access_diagnostic(rs.diagnostic_id)
  )
);
