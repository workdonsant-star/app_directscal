alter table public.management_asset_versions
  add column if not exists last_edited_by_user_id uuid references next_auth.users(id) on delete set null;

comment on column public.management_asset_versions.last_edited_by_user_id is
  'Última pessoa que salvou o conteúdo desta versão. NULL para histórico sem autoria verificável.';
