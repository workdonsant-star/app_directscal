# `supabase` — Migrations e configuração

## Propósito

Contém configuração local e migrations SQL para a base Supabase de produção do Maturidade.

## Convenções

- Migrations devem ser versionadas, revisáveis e idempotentes quando possível.
- Toda tabela no schema `public` deve ter RLS habilitado.
- `next_auth` segue o schema esperado pelo Auth.js Supabase Adapter.
- `next_auth.users.email` é a fonte de unicidade de conta; migrations novas devem preservar a unicidade normalizada por `lower(trim(email))` sem apagar dados históricos.
- Funções `security definer` ficam em schema privado, nunca em schema exposto.
- `app_private.is_org_member()` e `app_private.can_access_diagnostic()` devem negar identidades que possuam papel `superadmin`; esse papel usa apenas policies e handlers administrativos explícitos.
- Seeds do Maturidade v1 são imutáveis; mudanças futuras criam nova versão de template.
- Campos adicionais do onboarding de aquisição ficam em `acquisition_campaign_fields` e suas respostas em `acquisition_leads.field_values`; não criar coluna dedicada para cada campo configurável.
- Ativos de gestão: `management_asset_versions.review_status` guarda o estado editorial da versão; `management_assets.status` comunica o que o cliente enxerga. Um trigger impede alterar versões publicadas, e um índice único parcial garante um único rascunho por ativo.
- A busca dos ativos usa a configuração `public.pt_unaccent` (português sem acentos) e vetores `extensions.vector(768)` com o modelo gravado em `embedding_model`. `search_management_asset_chunks_for_organization` só é executável pela service role e filtra a organização antes do ranking.
- `app_private.slack_installations` guarda o token do bot por workspace e nunca recebe grant para `anon` ou `authenticated`.

- account_profiles preserva escolhas pessoais sem alteração pelo login Google, com FK para next_auth.users. Um trigger invoker sincroniza nome/foto com organization_people na mesma transação. specialists conserva IDs legados e usa exclusão lógica para preservar autorias. Ambas têm RLS e grants somente para service_role.

- `action_point_assignments` e `action_point_events` guardam a execução dos action points publicados (responsável do Slack, etapa, janela, cadência, progresso de 0 a 100 e histórico com frase de ação e detalhe; o tipo `resposta` é reservado para as respostas do líder ao agente). A seleção continua em `admin_deliveries.selected_action_point_ids`; o catálogo, no código. RLS habilitado e grants somente para service_role; a leitura e a escrita passam por handlers server-side que filtram pela empresa. A base foi conciliada pela migração idempotente action_point_atomic_update, aplicada ao OMDx em 19/10/2026; a migração antiga permanece compatível para bases novas.

- `20261012144255_client_onboarding_completions.sql` adiciona registro privado idempotente de conclusão inicial por empresa. Não reutiliza campos do onboarding operacional e não marca contas existentes como concluídas automaticamente. RLS e acesso SELECT/INSERT exclusivo de service_role. Migração aplicada no projeto OMDx em 12/10/2026; RLS e grants conferidos por consulta. Nenhuma empresa foi marcada como concluída.

- `20261012165000_slack_sector_leaders.sql` cria referências privadas setor/workspace/pessoa Slack e atribuições externas de pesquisa. Cargo só persiste quando sobrescrito. RPC de criação atômica exige dono e workspace conectado; `sync_diagnostic_leaders` envolve o caminho legado e inclui referências Slack, sem criar contas nem conceder acesso ao painel. RLS ativo e grants somente para service_role. Migração aplicada ao OMDx em 12/10/2026; testes transacionais em `supabase/tests/slack-sector-leaders.sql` usam fixtures fictícias e ROLLBACK.

- `last_edited_by_user_id` registra o ator autenticado ao criar/salvar rascunho de ativo. A leitura mostra `lastEditedBy` da versão publicada, resolvido pelo perfil da conta, em Editado por na barra de metadados. Histórico sem registro fica Não registrado; criador, especialista e publicador não são usados para inferir a última edição.

- `organization_asset_navigation` persiste ordem e ícones por empresa com RLS e grants somente service_role. `asset-navigation` define payload estrito e catálogo fechado; layout lê pela empresa da sessão, PUT /api/settings/asset-navigation exige dono cliente e ignora qualquer tentativa de escolher organização no payload. Sem localStorage nem modificação de documentos/categorias.


- 20261017130100_customer_management_asset_update.sql adiciona RPC privada security invoker, exclusiva service_role, que exige membership cliente e bloqueia superadmin. Atualização versionada e índice textual são atômicos, com lock do ativo e controle otimista por versão. Aplicada ao OMDx em 17/10/2026.

- 20261017131400_customer_asset_bulk_metadata.sql adiciona RPC privada security invoker para tipo/categoria em lote. Somente service_role, exige dono e nega superadmin, bloqueia em ordem estável, valida todos os IDs antes de qualquer alteração e mantém versões/conteúdo/índice. Aplicada ao OMDx em 17/10/2026; teste transacional com ROLLBACK passou.

- 20261017135944_management_asset_categories.sql adiciona criação/renomeação atômicas de categorias em preferences.categories, com chave estável, autorização de dono e unicidade normalizada de nome. Atualiza RPC de lote para aceitar pastas vazias e adiciona merge de navegação que preserva registro. Security invoker, grants só service_role. Aplicada no OMDx em 17/10/2026.

- 20261017141222_delete_management_asset_category.sql adiciona contagem de todos os documentos e exclusão atômica com transferência obrigatória. Pode criar destino na mesma transação. Registros de supressão impedem reaparecimento de categorias padrão vazias; ordem/ícone são removidos. RPCs privadas invoker, só service_role. Atualiza criação/renomeação e lote para considerar padrões excluídos. Aplicada ao OMDx em 17/10/2026.


delivery_revision_snapshots (19/10/2026) separa rascunhos privados, snapshot público e histórico append-only. save_admin_delivery_revision serializa pelo diagnóstico, revalida superadmin e só promove conteúdo em publish; save conserva a versão pública. Teste delivery-revisions.sql passou com ROLLBACK. action_point_atomic_update adiciona base faltante e RPC que une estado/histórico, autorização e concorrência. Teste action-point-atomic-update.sql passou com ROLLBACK.


`20261019154336_atomic_anonymous_responses.sql`, aplicada ao OMDx em 19/10/2026, adiciona recibos privados e RPC invoker exclusiva service_role para sessão/respostas atômicas. Lock do diagnóstico serializa envio com encerramento; valida template completo, prazo inclusivo São Paulo e link vigente. Hash aleatório por tentativa/link permite reconhecer reenvios sem identificar pessoas. Conteúdo divergente para a mesma chave é conflito. Não amplia escopos Slack nem altera a política anônima.


20261019155929_organization_specialist_assignment.sql foi aplicada ao OMDx em 19/10/2026. Tabela privada preserva especialista principal e versão mesmo na remoção; RPCs invoker exclusivas service_role revalidam papel, empresa, especialista ativo e conflito. Histórico real inclui coletas encerradas e usa revisão privada antes do snapshot, conservando especialista explicitamente removido. Sugestão principal só vale sem atribuição editorial anterior.

A12: `20261019161110_atomic_admin_asset_save.sql` salva ativo e rascunho em uma transação, revalidando ator/revisão/estado antes da escrita. `20261020105016_customer_asset_conflict_http_status.sql` troca conflito permanente por PT409 no editor do cliente e limita espera de locks. `20261020105103_permanent_conflict_codes.sql` corrige o mesmo código em cinco funções de categorias/lote/Action Points, preservando assinaturas e grants. Aplicadas ao OMDx; nenhuma função privada continua lançando 40001 customizado. Não reutilizar esse SQLSTATE para regras de negócio.

A03: `20261020110237_asset_adherence_model.sql` aplicada ao OMDx após ensaio integral com ROLLBACK. Cria regras/ciclos/fatos privados imutáveis, índices de FKs/empresa/período, validação de origem publicada e responsável, unicidade de oportunidade entre revisões e gravação idempotente de fatos. Nenhum ciclo/contato externo é gerado automaticamente.

A04: 20261020111612_asset_adherence_routine_lifecycle.sql aplicada ao OMDx após ensaio com ROLLBACK. Pausa/retomada em eventos privados imutáveis com ator/motivo, concorrência e reentrada; trigger impede oportunidade nova durante pausa. Não altera ciclos ou fatos existentes.

A04: 20261020112821_admin_adherence_operations.sql aplicada ao OMDx. Adaptação cria revisão imutável; criação une primeira atribuição e histórico; transferência grava todas as revisões e atribuição atomicamente, preservando ciclos antigos. Trigger diferido impede trocar/remover responsável pela API anterior deixando acordos divergentes. RPC de leitura do cliente exige membership, acesso ao diagnóstico e seleção publicada. Tabela privada de recibos tem RLS, índices e grants SELECT/INSERT somente service_role.

A15: 20261020130040_slack_durable_delivery.sql aplicada ao OMDx. Fila privada por event_id único, payload consistente e instalação ativa; índices de empresa/workspace/pendentes. Reserva exclusiva com expiração, até cinco tentativas; resposta preparada precede envio. Processo morto durante envio fica Incerto; antes do envio pode ser recuperado. Retry administrativo revalida superadmin, empresa e updated_at e recusa Incerto. Sem grants públicos ou security definer novo.

A09: 20261020131441_verified_slack_identity.sql aplicada ao OMDx. Desafios SHA-256 de dez minutos, intervalo mínimo de trinta segundos, revogação de anteriores, consumo idempotente somente pelo mesmo evento reservado e duas unicidades impedem tomada de vínculo entre contas. Desvincular conserva prova histórica e revoga desafios. Identidade não concede acesso nem cria pessoas; ausência de instalação/membership retira a conciliação. Todas as tabelas privadas com RLS, índices e funções invoker exclusivas service_role.

A05: migrações routine_contact_scheduler, routine_scheduler_fairness, routine_contact_source_guards, routine_event_contacts e routine_event_contact_cycle_id aplicadas ao OMDx. Políticas imutáveis desativadas por padrão; público/horário/cotas com revalidação transacional, cursor por rotina, ocorrência atestada e fila durável. Segunda migração evita monopolização do lote; terceira bloqueia nova oportunidade/contato com versão anterior; última corrige referência ao UUID do ciclo detectada no teste de ocorrência. Sem políticas reais ativadas ou scheduler externo criado.

A05: routine_policy_recheck faz a reserva reavaliar contato recebido/adiado quando há política mais recente, sem antecipar falhas/Retry-After. Evita atualizar linhas de envio dentro do lock de salvamento da política. Regressão A15 e agenda passaram com ROLLBACK.


A06: routine_execution_replies e customer_routine_execution_records aplicadas em 20/10/2026. Proposta sem escrita, confirmação atômica idempotente, conflito por fato/progresso mais recente, expiração e cancelamento. Fatos Slack preservam evento/pessoa/workspace com ator de conta nulo; manuais continuam exigindo conta. Leitura privada paginada revalida acesso e identidade. Teste transacional passou com ROLLBACK; fixtures visuais foram removidas. Nenhum envio externo ou deploy do app.


A07: routine_human_supervision e bounded_routine_reminders aplicadas em 20/10/2026. Revisões humanas preservam fato/origem/ator, transação e reentrada; orientação e prazo de retorno não alteram o prazo da oportunidade. No máximo um lembrete após 24h sem retorno e dentro da mesma política/cota, com cursores justos por ciclo. Toda política real permanece desativada e não foi criado cron. Testes transacionais e regressões A05/A06 aprovados com ROLLBACK.

## Exclusão administrativa integral

20261029150529_admin_company_deletion.sql cria RPC invoker privada, search_path vazio, limite de 100 organizações, autorização superadmin revalidada, locks ordenados e validação integral antes da exclusão. Remove dependências históricas explicitamente, sem desabilitar triggers/FKs; protege organizações administrativas e jobs Slack em processamento. Exclui contas exclusivas, perfis, credenciais e sessões via FK; contas com referência de domínio externa são mantidas. Remoção de membership gira a versão de sessão. Grants DELETE de históricos são exceção exclusiva de service_role para esta finalidade. Investigação é tratada quando suas tabelas existem no schema, inclusive bases antigas sem esse módulo. Don executou a migração manualmente no OMDx em 29/10/2026 após falhas da ferramenta. Consulta posterior confirmou a função invoker com EXECUTE para service_role e sem acesso anon/authenticated. O teste conectado admin-company-deletion.sql passou com fixtures e ROLLBACK. Nenhuma empresa real foi apagada durante a verificação; a exclusão real permanece uma ação separada confirmada pelo operador. A chamada REST de verificação não foi concluída por timeout da revisão automática; não confundir o teste SQL com validação ponta a ponta da interface.


20261029164548_preserve_global_admin_company_deletion.sql substitui a proteção de empresas com superadmin: antes da exclusão, conserva os vínculos globais existentes na organização interna de domínio reservado global-admin.directscal.invalid. Não promove clientes/admins. O registro técnico fica fora da aquisição e não pode ser apagado pela RPC. A empresa original é removida integralmente; sessões giram normalmente e podem exigir novo login. Migração e validação conectadas pendentes até aplicação.

A nova migração passou no teste transacional PGlite com fixtures, incluindo exclusão da empresa do ator, preservação do acesso global e rollback. A aplicação remota não foi executada: revisão automática retornou Selected model is at capacity. Aplicar 20261029164548_preserve_global_admin_company_deletion.sql e executar novamente supabase/tests/admin-company-deletion.sql no OMDx antes de validar pela interface.


Atualização de 29/10/2026: após a aplicação manual da segunda migração, o teste atualizado foi executado diretamente no OMDx e passou com ROLLBACK. Confirma exclusão da empresa do ator global, preservação do superadmin no registro interno, contas exclusivas/compartilhadas, cascatas, sessões e proteção do registro técnico. O erro PT409 relatado antes vinha do teste antigo (array[v_org,v_global], que esperava PT403), incompatível com a nova regra. A nova regra está validada no banco; a exclusão real pela interface permanece com o operador.
