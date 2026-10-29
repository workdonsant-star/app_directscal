# `src/lib/supabase` — Clientes Supabase

## Propósito

Esta pasta concentra os clientes Supabase usados pelo servidor Next.js.

## Convenções

- Nunca exportar `SUPABASE_SERVICE_ROLE_KEY` nem criar admin client em Client Components.
- `createSupabaseAdminClient()` é server-only e deve ser usado apenas em Route Handlers, callbacks Auth.js e leituras administrativas controladas.
- `createSupabaseRlsClient()` recebe o JWT assinado pela sessão Auth.js e respeita RLS.
- Tipos de banco ficam em `database.types.ts` até serem substituídos por tipos gerados pelo Supabase CLI.

- account_profiles e specialists têm RLS e acesso exclusivo por service role através de handlers autenticados; não conceder acesso direto aos clientes.

`client_onboarding_completions` no schema privado registra a conclusão inicial por empresa, com horário e usuário. RLS e grants apenas SELECT/INSERT para service_role; acesso e validação ficam no servidor.

`organization_sector_slack_leaders` e `diagnostic_slack_leader_assignments` são referências privadas com RLS e acesso exclusivo de service_role. Não armazenam nome, foto ou e-mail do Slack e não criam usuários do painel. A RPC de criação confirma dono/empresa e workspace ativo; a seleção de diagnósticos aceita referências Slack e pessoas legadas sem mudar as policies de acesso.

- `last_edited_by_user_id` registra o ator autenticado ao criar/salvar rascunho de ativo. A leitura mostra `lastEditedBy` da versão publicada, resolvido pelo perfil da conta, em Editado por na barra de metadados. Histórico sem registro fica Não registrado; criador, especialista e publicador não são usados para inferir a última edição.

- `organization_asset_navigation` persiste ordem e ícones por empresa com RLS e grants somente service_role. `asset-navigation` define payload estrito e catálogo fechado; layout lê pela empresa da sessão, PUT /api/settings/asset-navigation exige dono cliente e ignora qualquer tentativa de escolher organização no payload. Sem localStorage nem modificação de documentos/categorias.


- update_customer_management_asset tipa a RPC privada de atualização pelo dono. Sem grants para anon/authenticated; role e empresa são revalidados na transação.

- update_customer_assets_metadata tipa a RPC privada de alteração em lote de tipo/categoria pelo dono, com bloqueio e validação integral na transação, acesso somente service_role.

- save_management_asset_category e save_asset_navigation_preferences são RPCs privadas security invoker, só service_role. Registro de categorias em preferences.categories mantém chave e título; RPC de navegação preserva esse registro ao alterar ordem/ícones.

- management_asset_category_document_count e delete_management_asset_category tipam consulta/exclusão privadas: dono revalidado, todas as situações documentais, destino obrigatório quando houver documentos e criação/movimentação/exclusão em uma transação.


get_admin_delivery_draft/save_admin_delivery_revision e save_action_point_update tipam RPCs privadas security invoker, exclusivas de service_role. Rascunhos e versões não recebem grants de cliente; execução revalida dono, empresa, seleção publicada e updated_at sob lock do diagnóstico.


`submit_anonymous_likert_response` tipa a gravação atômica anônima. Recibos privados guardam hashes da tentativa por link e das respostas, nunca identificação pessoal. RPC invoker com search_path vazio e execução exclusiva service_role.


organization_specialist_assignments é privada, com RLS, FK para organização/especialista e grants somente service_role. assign_organization_specialist revalida superadmin/especialista, serializa na organização e compara versão esperada. get_organization_operations revalida ator e limita histórico à organização solicitada. Não altera permissões de cliente nem atribuições editoriais existentes.

A12: `save_admin_management_asset` é privada, invoker, search_path vazio e lock_timeout de 5 s, exclusiva de service_role, com ator superadmin revalidado. `expectedRevision` conserva a precisão dos timestamps do banco. Conflitos permanentes usam PT409, evitando retries infinitos do PostgREST 14; SQLSTATE 40001 fica reservado a falhas transitórias reais de serialização.

A03: tabelas privadas asset_adherence_rules/cycles/facts têm RLS e grants SELECT/INSERT exclusivos de service_role. Regras preservam rotina/revisão e vínculos; uma oportunidade é única mesmo após revisão. RPC record_asset_adherence_fact é invoker, revalida ator/empresa e mantém reentrada idempotente com lock transacional por ciclo. Sequência imutável, sem UPDATE/DELETE para service_role.

A04: asset_adherence_routine_events é histórico privado imutável (SELECT/INSERT exclusivos de service_role). RPC transition_asset_adherence_routine revalida superadmin, rotina/empresa, evento esperado e tentativa. Usa o mesmo lock da abertura de ciclos para serializar pausa versus oportunidade nova.

A04: tipos incluem save_admin_adherence_routine, transfer_admin_action_routines, get_admin_adherence_workspace e get_customer_adherence_agreements. Todas são RPCs privadas invoker, exclusivas service_role, com autorização no banco. Recibos de transferência preservam reentrada; trigger diferido impede divergência entre atribuição e acordos.

A15: slack_delivery_jobs privada com RLS, estados/reserva/tentativas, resposta persistida e confirmação por timestamp. RPCs invoker exclusivas service_role resolvem empresa pela instalação, reservam SKIP LOCKED e cercam transições com lease UUID. Incerto não é retomado automaticamente. Tipos de banco incluem tabela/RPCs.

A09: desafios/links de identidade são privados com RLS e grants apenas service_role. Código guarda hash, expiração, revogação e prova do evento; vínculo tem unicidade por conta e pessoa Slack na empresa. RPCs invoker resolvem autorização, instalação vigente e lease; leitura de indicadores não usa links revogados/sem membership.

A05: RPCs privadas cobrem política versionada, agenda, oportunidade/contato atômicos, checagem/reserva de contato, adiamento e ocorrência explícita. Tabelas de política, contato, reserva, cursor e recibo têm RLS e acesso somente service_role. Novas oportunidades/contatos exigem versão acordada vigente; contatos cancelados conservam ciclos anteriores.


A06: routine_reply_proposals é privada com RLS e grants somente service_role. RPCs invoker de contexto/proposta/confirmação usam lease e revalidam pessoa/workspace/DM/atribuição/publicação. Escrita une fato/histórico/progresso/recibo. get_customer_routine_records exige membership/acesso ao diagnóstico; admin lê somente ciclos da identidade Slack verificada. Tipos preservam autoria manual ou Slack sem criar conta.


A07: routine_supervision_events é append-only privada, com RLS e grants SELECT/INSERT somente service_role. save_routine_supervision revalida superadmin, empresa, origem publicada, revisão/fato e une revisão/histórico/recibo. Leitura administrativa pagina cem ciclos; leitura do cliente conserva autorização da função base e inclui somente decisões desses mesmos ciclos. routine_contact_jobs tem unicidade ciclo/purpose (inicial/lembrete); routine_reminder_checks conserva avanço justo do lote.


A14: recuperação, outbox, limites de tentativa, versões e recibos de aquisição são privados com RLS/service_role. next_auth.uid usa is_session_current com search_path vazio e identidade do JWT, sem parâmetro de usuário. session_security_enforcement permanece false até implantação compatível. complete_acquisition_account é transacional: conta nova ou reentrada Google exata, organização sempre nova, nunca inferida por nome/domínio público. Senha/membership/lead/recibo gravados na mesma transação.


A17: agent_gap_reviews é privada append-only com RLS e service_role SELECT/INSERT. save_agent_gap_review revalida ator, responsável global, auditoria/empresa e revisão sob lock. get_agent_operations restringe lote a 200 auditorias da mesma empresa e retorna saúde agregada real, sem corpo do Slack.


A10: routine_result_baselines é privada imutável, service_role SELECT/INSERT, sem grants do cliente. Captura por acordo conserva texto, encerramento/data de captura e média/contagem das respostas concluídas. Trigger conserva criação legada e omite coleta ainda aberta. RPC de captura admite dono da própria empresa para compatibilidade privada A03; rota e leitura são globais. Reentrada nunca reescreve snapshot.


A18: omdx_question_aggregates mantém execução restrita e cálculo original, agora com search_path vazio (objetos já qualificados). aggregate-boundaries.sql verifica médias/ausência e negação da chamada direta por authenticated, incluindo dono/outro tenant/global; sem ampliar grants.

`delete_admin_companies` tipa a RPC privada invoker de exclusão integral. A migração admin_company_deletion introduz uma exceção administrativa explícita à retenção dos históricos: grants DELETE apenas para service_role nas tabelas necessárias; anon/authenticated seguem sem execução. A rotina comum de exclusão de ativos mantém as FKs e suas recusas. Migração remota ainda não aplicada; aguarda aprovação explícita.
