do $$
begin
  if exists (
    select 1
    from next_auth.users
    where email is not null
    group by lower(btrim(email))
    having count(*) > 1
  ) then
    raise notice 'Skipping next_auth.users normalized email unique index because duplicates already exist.';
  else
    create unique index if not exists next_auth_users_normalized_email_key
      on next_auth.users (lower(btrim(email)))
      where email is not null;
  end if;
end;
$$;
