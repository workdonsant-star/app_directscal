# Verificação transacional do banco

Scripts SQL usam fixtures fictícias em uma transação seguida de ROLLBACK. Não chamam Slack, não enviam convites e não mudam contas reais. Uma exceção interrompe o teste; sucesso exige chegar ao SELECT final. Rodar somente após aplicar a migração correspondente. Asserções cobrem autorização, atomicidade, isolamento por empresa e compatibilidade dos diagnósticos.


customer-management-asset-update.sql cria apenas ativo fictício em transação com ROLLBACK, usando membership de dono existente como contexto. Verifica v1 preservada/v2 publicada, editor, índice, isolamento, conflito de versão, rascunho aberto e rollback de publicação inválida. Executado no OMDx em 17/10/2026 sem persistir fixtures.

customer-asset-bulk-metadata.sql é uma exceção explícita ao uso de fixtures: seleciona dois ativos publicados existentes de uma organização com dono, altera metadados apenas dentro da transação e executa ROLLBACK. Confere atualização de ambos, preservação da versão, falha atômica por ID ausente, ator sem membership e categoria desconhecida. Não persiste alterações; executar somente com suporte a transação integral e após a migration. Executado no OMDx em 17/10/2026.

- management-asset-categories.sql verifica pasta vazia, movimentação para categoria persistida, renomeação dos ativos, conservação de ícone, duplicatas e autorização. Usa contexto existente com alterações inteiramente revertidas por ROLLBACK; sem efeitos duráveis. Executado no OMDx em 17/10/2026.

- delete-management-asset-category.sql cobre vazio, destino obrigatório, mesma pasta, criação/transferência atômicas, arquivados, preservação da versão, supressão de padrão e dono. Contexto de empresa existente, tudo revertido por ROLLBACK. Executado no OMDx em 17/10/2026.


delivery-revisions.sql cria fixtures e testa V1 publicada, V2 privada, republicação, histórico, autorização e grants. action-point-atomic-update.sql testa rollback quando evento falha, concorrência, etapa, empresa, papel e seleção publicada. Ambos foram executados no OMDx em 19/10/2026 com ROLLBACK.


`atomic-anonymous-responses.sql` injeta falha de resposta por trigger temporário restrito à fixture e verifica rollback de sessão/recibo. Confere retomada, ordem das respostas, chave conflitante, conjunto incompleto, prazo/link vencidos, encerramento e grants. Tudo, inclusive trigger e fixtures, termina em ROLLBACK; executado com sucesso no OMDx em 19/10/2026.


organization-specialist-assignment.sql verifica persistência/troca/remoção, versão desatualizada, papel, empresa distinta, especialista arquivado, histórico real, sugestão inicial e preservação de rascunho explicitamente sem responsável. Executado com ROLLBACK no OMDx em 19/10/2026.

A12: `atomic-admin-asset-save.sql` verifica revisão esperada, transição de estado e rollback de metadados/conteúdo com falha injetada no rascunho; executado com sucesso e ROLLBACK em 20/10/2026. Reexecutados também customer-management-asset-update, customer-asset-bulk-metadata, management-asset-categories, delete-management-asset-category e action-point-atomic-update após PT409, todos com sucesso e ROLLBACK.

A03: asset-adherence-model.sql usa somente fixtures fictícias e ROLLBACK. Cobre empresa/ator, origem publicada, pessoa atribuída, fuso, oportunidade duplicada entre revisões, conflito, reentrada, evidência obrigatória, revisão do relato vigente e privilégios reais de service_role. Executado após aplicar a migração em 20/10/2026.

A04: asset-adherence-model.sql inclui recusa do dono na operação DirectScal, pausa/retomada com service_role, reentrada, sessão antiga, bloqueio/liberação de novos ciclos e preservação de evidências anteriores. Teste aprovado com ROLLBACK após a migração de ciclo de vida.

A04: admin-adherence-operations.sql verifica criação/adaptação, origem imutável, reentrada, conflito, rollback da primeira atribuição por versão inválida, transferência de duas rotinas, falha injetada na última revisão com rollback integral, leitura autorizada do cliente e trigger diferido sob service_role. Executado após migração com ROLLBACK. Nenhuma mensagem externa.

A15: slack-durable-delivery.sql usa contexto da instalação existente somente para referências, cria eventos fictícios privados em transação e termina em ROLLBACK. Não chama Slack. Cobre idempotência, conflito, lease exclusivo/forjado/expirado, limite final, preparação/envio/confirmação, Retry-After, Incerto não reenviável, retry com versão e papéis, grants e execução com service_role. Executado com sucesso após migração.

A09: verified-slack-identity.sql cria somente usuários/empresas/instalações fictícios com token não utilizável, dentro de transação com ROLLBACK. Cobre sessão/papel/empresa, rate limit, lease errado, consumo/reentrada, reuso por outra pessoa/evento, mesma pessoa em duas contas, expiração, revogação da instalação, remoção do membership, desvinculação e grants. A15 também passou a usar fixtures integralmente fictícias; não modifica nem depende de uma instalação real. Ambos reexecutados com sucesso.

A05: routine-contact-scheduler.sql usa somente empresas/usuários/instalações/ativos fictícios e ROLLBACK. Testa política/papel/versão, job/ciclo únicos, cota e janela, adiamento sem tentativa, pausa e denominador preservado, revogação/arquivo/versão antiga, cursor/grants e ocorrência explícita idempotente. Trigger temporário condicionado à fixture falha no recibo e confirma rollback de ciclo/job; nenhum DDL/fixture persiste. Executado com sucesso após correção do UUID.

A05 também verifica que política nova reavalia adiamento e pausa sem antecipar Retry-After de falha confirmada. A15 reexecutada após essa mudança e aprovada.


A06: routine-execution-replies.sql cobre ciclo/lease/pessoa, proposta sem escrita, confirmação/reentrada, rollback do histórico, relato concorrente, exceção não aprovada automaticamente, progresso sem mudar etapa, leitura, expiração/cancelamento, retirada da publicação, instalação revogada, outro tenant e leitura própria por vínculo. Fixtures fictícias, grants reais service_role e ROLLBACK. Executado com sucesso após as duas migrações.


A07: routine-human-supervision.sql cobre autorização, revisão do fato vigente, evidência obrigatória para validar, devolução, exceção, orientação, retorno sem alterar a oportunidade, reentrada/conflito, autoria, grants e falha injetada no histórico. bounded-routine-reminders.sql cobre unicidade, conversa recente sem virar execução, mesma referência/thread, cancelamento após relato e grants. Ambos fictícios com ROLLBACK. Agenda A05 e conversa A06 reexecutadas após mudança de unicidade, aprovadas.


A14: customer-password-recovery.sql verifica emissão/expiração/consumo, identidade, rate limit, reserva/retry, conflito, revogação, grants e rollback de falha. isolated-atomic-acquisition.sql verifica isolamento por nome/domínio, conta existente, reentrada Google e rollback integral. Ambos passaram com fixtures fictícias e ROLLBACK; nenhuma senha real ou e-mail alterado.


A17: agent-operational-gap-reviews.sql passou com fixtures fictícias e ROLLBACK: autoria/papel, tenant, responsável, evidência, reentrada, conflito, reabertura e preservação da consulta original. Nenhum envio externo.


A10: routine-result-baselines.sql passou com ROLLBACK: captura automática, média/contagem, ausência sem score, imutabilidade, vínculo de versão, tenant/papel/grants e nenhuma sessão individual copiada. Regressões asset-adherence-model e admin-adherence-operations reexecutadas com sucesso.


A18: aggregate-boundaries.sql passou com ROLLBACK após fixar search_path da função de agregados. Confere média/contagem e execução restrita; authenticated permanece sem EXECUTE. Não foi criada policy permissiva ou acesso de superadmin ao app do cliente.


A10/A12: routine-result-baselines verifica também tentativa de excluir ativo já vinculado, recusa por FK e preservação de ativo/base, tudo em ROLLBACK.

`admin-company-deletion.sql` usa empresas/contas/rotinas/ativos/pesquisas fictícias e ROLLBACK. Cobre papéis, confirmação, duplicatas, lote com ID ausente, proteção de superadmin, job Slack ativo, cascatas, exclusividade de conta e rotação de sessão compartilhada. Executar no ambiente de destino somente após aprovar/aplicar a migração.

Verificado em 29/10/2026 no PostgreSQL embarcado local (PGlite), reconstruído por leitura do schema: tabelas, constraints, triggers, funções e grants. Inclui rollback após a remoção. Tipo vector substituído por text e configuração textual por português somente no harness temporário; busca não é exercitada. Após a execução manual da migração por Don no OMDx, o teste foi reexecutado no Supabase conectado em 29/10/2026 e retornou sucesso para autorização, lote atômico, cascatas, contas exclusivas/compartilhadas e sessões. Transação encerrada com ROLLBACK, sem alterações duráveis em dados reais. Grants da função também conferidos: service_role pode executar; anon e authenticated não podem.


admin-company-deletion.sql passa a excluir também a empresa do ator global. Confere remoção da organização original, vínculo global no registro interno, proteção somente desse registro, exclusão das contas de cliente e preservação de conta externa. Fixtures e ROLLBACK.


Atualização de 29/10/2026: após a aplicação manual da segunda migração, o teste atualizado foi executado diretamente no OMDx e passou com ROLLBACK. Confirma exclusão da empresa do ator global, preservação do superadmin no registro interno, contas exclusivas/compartilhadas, cascatas, sessões e proteção do registro técnico. O erro PT409 relatado antes vinha do teste antigo (array[v_org,v_global], que esperava PT403), incompatível com a nova regra. A nova regra está validada no banco; a exclusão real pela interface permanece com o operador.
