-- Conflitos permanentes não podem disparar retries de serialização no PostgREST.
-- Preserva integralmente regras, assinaturas, privilégios e demais configurações.
do $$
declare
  v_function record;
  v_definition text;
begin
  for v_function in
    select p.oid from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid=p.pronamespace
    where n.nspname='app_private' and p.proname in (
      'save_management_asset_category','management_asset_category_document_count',
      'delete_management_asset_category','update_customer_assets_metadata','save_action_point_update'
    ) and p.prosrc like '%40001%'
  loop
    v_definition:=pg_catalog.pg_get_functiondef(v_function.oid);
    execute replace(v_definition,'''40001''','''PT409''');
  end loop;
end;
$$;
