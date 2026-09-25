create index if not exists organization_people_auth_user_idx
  on public.organization_people (auth_user_id)
  where auth_user_id is not null;

create index if not exists organization_sector_memberships_person_org_idx
  on public.organization_sector_memberships (person_id, organization_id);

create index if not exists organization_sector_memberships_sector_org_idx
  on public.organization_sector_memberships (sector_id, organization_id);

create index if not exists leadership_invitations_created_by_idx
  on app_private.leadership_invitations (created_by)
  where created_by is not null;

create index if not exists leadership_invitations_person_org_idx
  on app_private.leadership_invitations (person_id, organization_id);

create index if not exists leadership_invitations_sector_org_idx
  on app_private.leadership_invitations (sector_id, organization_id);
