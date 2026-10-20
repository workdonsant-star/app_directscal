begin;
do $$
declare
  v_actor uuid; v_ids uuid[]; v_version uuid; v_result jsonb; v_before jsonb;
begin
  select m.user_id, array_agg(a.id order by a.id) into v_actor, v_ids
    from public.management_assets a join public.organization_members m on m.organization_id=a.organization_id
    where m.role='cliente' and a.status='publicado' and a.archived_at is null and a.current_published_version_id is not null
    and not exists (select 1 from public.organization_members s where s.user_id=m.user_id and s.role='superadmin')
    group by m.user_id,a.organization_id having count(*) >= 2 limit 1;
  if v_ids is null then raise exception 'Não há lote disponível para teste transacional'; end if;
  v_ids := v_ids[1:2];
  select current_published_version_id into v_version from public.management_assets where id=v_ids[1];
  v_result := app_private.update_customer_assets_metadata(v_actor,v_ids,'{"type":"raci","category":"Cultura"}'::jsonb);
  if (v_result->>'count')::int <> 2 or (select count(*) from public.management_assets where id=any(v_ids) and type='raci' and category='Cultura') <> 2 then raise exception 'Lote não foi aplicado'; end if;
  if (select current_published_version_id from public.management_assets where id=v_ids[1]) <> v_version then raise exception 'Versão alterada'; end if;
  select jsonb_agg(to_jsonb(a) order by id) into v_before from public.management_assets a where id=any(v_ids);
  begin
    perform app_private.update_customer_assets_metadata(v_actor,v_ids || gen_random_uuid(),'{"type":"sop"}'::jsonb);
    raise exception 'ID ausente deveria falhar';
  exception when sqlstate 'PT409' then null; end;
  if (select jsonb_agg(to_jsonb(a) order by id) from public.management_assets a where id=any(v_ids)) <> v_before then raise exception 'Falha deixou alteração parcial'; end if;
  begin
    perform app_private.update_customer_assets_metadata(gen_random_uuid(),v_ids,'{"type":"sop"}'::jsonb);
    raise exception 'Ator desconhecido deveria falhar';
  exception when insufficient_privilege then null; end;
  begin
    perform app_private.update_customer_assets_metadata(v_actor,v_ids,'{"category":"Pasta inexistente teste"}'::jsonb);
    raise exception 'Categoria desconhecida deveria falhar';
  exception when invalid_parameter_value then null; end;
end $$;
rollback;
select 'Lote, atomicidade, autorização e categoria verificados; rollback concluído' as result;
