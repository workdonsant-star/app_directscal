begin;
do $$
declare
  v_actor uuid := gen_random_uuid(); v_owner uuid := gen_random_uuid();
  v_org uuid := gen_random_uuid(); v_diagnostic uuid := gen_random_uuid(); v_template uuid;
  v_input jsonb; v_first timestamptz; v_count integer;
begin
  insert into next_auth.users(id,email,name) values
    (v_actor,v_actor::text||'@fixture.invalid','Fixture operação'),
    (v_owner,v_owner::text||'@fixture.invalid','Fixture cliente');
  insert into public.organizations(id,name) values(v_org,'Fixture revisão de relatório');
  insert into public.organization_members(organization_id,user_id,role) values(v_org,v_actor,'superadmin'),(v_org,v_owner,'cliente');
  select id into v_template from public.diagnostic_templates limit 1;
  insert into public.diagnostics(id,organization_id,template_id,name,created_by_user_id,status)
    values(v_diagnostic,v_org,v_template,'Fixture revisão',v_owner,'encerrado');
  v_input := jsonb_build_object('intent','publish','specialistId','fixture',
    'selectedActionPointIds',jsonb_build_array('action_processos_ritual'),'dimensionReadings','{}'::jsonb,
    'report',jsonb_build_object('executiveSummary','Versão aprovada original V1',
      'generalReading','Leitura aprovada original V1','vulnerabilities','Vulnerabilidade original V1',
      'structuralCauses','Causas aprovadas original V1','recommendations','Recomendações original V1',
      'conclusion','Conclusão aprovada original V1'));
  perform app_private.save_admin_delivery_revision(v_diagnostic,v_actor,v_input);
  select published_at into v_first from public.admin_deliveries where diagnostic_id=v_diagnostic;
  v_input := jsonb_set(jsonb_set(v_input,'{intent}','"save"'),'{report,executiveSummary}','"Rascunho privado alterado V2"');
  perform app_private.save_admin_delivery_revision(v_diagnostic,v_actor,v_input);
  if (select report_content->>'executiveSummary' from public.admin_deliveries where diagnostic_id=v_diagnostic) <> 'Versão aprovada original V1' then
    raise exception 'Rascunho alterou publicação'; end if;
  if app_private.get_admin_delivery_draft(v_diagnostic)->'report'->>'executiveSummary' <> 'Rascunho privado alterado V2' then
    raise exception 'Rascunho não persistiu'; end if;
  if (select published_at from public.admin_deliveries where diagnostic_id=v_diagnostic) is distinct from v_first then
    raise exception 'Salvar alterou data de publicação'; end if;
  begin
    perform app_private.save_admin_delivery_revision(v_diagnostic,v_owner,v_input);
    raise exception 'Cliente conseguiu alterar entrega';
  exception when insufficient_privilege then null; end;
  v_input := jsonb_set(v_input,'{intent}','"publish"');
  perform app_private.save_admin_delivery_revision(v_diagnostic,v_actor,v_input);
  if (select report_content->>'executiveSummary' from public.admin_deliveries where diagnostic_id=v_diagnostic) <> 'Rascunho privado alterado V2' then
    raise exception 'Republicação não promoveu revisão'; end if;
  if app_private.get_admin_delivery_draft(v_diagnostic) is not null then raise exception 'Rascunho não removido'; end if;
  select count(*) into v_count from app_private.admin_delivery_versions where diagnostic_id=v_diagnostic;
  if v_count <> 2 then raise exception 'Histórico não preservou duas versões'; end if;
  if has_table_privilege('authenticated','app_private.admin_delivery_drafts','SELECT') or
    has_function_privilege('anon','app_private.save_admin_delivery_revision(uuid,uuid,jsonb)','EXECUTE') then
    raise exception 'Rascunho exposto'; end if;
end;
$$;
select 'delivery revisions: ok' as result;
rollback;
