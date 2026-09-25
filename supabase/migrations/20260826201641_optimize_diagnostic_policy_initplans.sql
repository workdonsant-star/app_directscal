alter policy diagnostics_scoped_insert on public.diagnostics
with check (
  (select app_private.is_org_member(organization_id))
  and created_by_user_id = (select next_auth.uid())
);

alter policy diagnostics_scoped_update on public.diagnostics
using ((select app_private.can_manage_diagnostic(id)))
with check (
  (select app_private.is_org_member(organization_id))
  and (
    created_by_user_id = (select next_auth.uid())
    or (select app_private.is_company_owner(organization_id))
  )
);

alter policy diagnostic_share_links_scoped_select
on public.diagnostic_share_links
using (
  (select app_private.can_view_diagnostic(diagnostic_id))
  and (
    (
      group_id = 'fundador'
      and exists (
        select 1
        from public.diagnostics diagnostic
        where diagnostic.id = diagnostic_share_links.diagnostic_id
          and (
            select app_private.is_company_owner(diagnostic.organization_id)
          )
      )
    )
    or group_id = 'lideranca'
    or (
      group_id = 'operacao'
      and (
        (select app_private.can_manage_diagnostic(diagnostic_id))
        or exists (
          select 1
          from public.diagnostic_sector_scopes scope
          join public.diagnostic_leader_assignments assignment
            on assignment.diagnostic_sector_scope_id = scope.id
          join public.organization_people person
            on person.id = assignment.person_id
          where scope.diagnostic_id = diagnostic_share_links.diagnostic_id
            and scope.sector_id = diagnostic_share_links.sector_id
            and person.auth_user_id = (select next_auth.uid())
        )
      )
    )
  )
);
