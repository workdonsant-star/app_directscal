# Matriz de homologação integral — 20/10/2026

Estado: **não homologado para operação integral**. Código local, banco conectado, requisição HTTP autenticada, navegador, Slack e produção são fronteiras distintas. Não houve deploy nem piloto de mensagens/e-mail reais nesta entrega.

## Critério de saída

Completar coleta → análise → publicação → PDF → ação → ativo → agente → aderência → resultado com cliente/admin e operação DirectScal, duas empresas isoladas, falha/reentrada, desktop claro/escuro e respondente público em 375px. Estimativa depende da metodologia e política A10/A16, ainda pendentes; build não substitui esse aceite.

## Evidência por tarefa

| Tarefa | Implementação/evidência disponível | Fronteira que permanece |
| --- | --- | --- |
| A01 Fonte única | Seleção publicada e dimensões estáveis em UI/PDF; regressões locais | Aceite visual e publicação implantada |
| A02 Execução atômica | Estado/histórico/ator/empresa na transação; falha e concorrência SQL | Concluída no escopo técnico registrado; produção não inferida |
| A03 Aderência | Acordos, oportunidades e fatos; denominador explícito e ausência nula; SQL | Concluída no escopo de modelo; piloto operacional depende de A04–A07 |
| A04 Operação | Criar/revisar/pausar/transferir, isolamento e rollback; leitura cliente em dois temas | Segunda pessoa Slack e aceite administrativo/implantação |
| A05 Proatividade | Política desligada, agenda, limites, ocorrências, revalidação e cursor | Aprovar público/janela/cota, consumidor e piloto real |
| A06 Conversa | Proposta/confirmação, relato/bloqueio/leitura/exceção distintos; SQL e testes | Aceite visual e DM real, sem presumir entrega |
| A07 Supervisão | Evidência/exceção/orientação/prazo; lembrete único e fila de silêncio | Revisor operacional, implantação e piloto de lembrete/escalonamento |
| A08 Publicação | Rascunho privado, snapshot e histórico; PDF da publicação | Ciclo completo no navegador com perfis/empresa e conferência final do PDF |
| A09 Uso/identidade | Prova app/Slack privada e revogável; população sem dupla contagem | Prova de posse real em dois canais e aceite dos indicadores |
| A10 Resultado | Baseline imutável por pergunta/camada/ação/ativo/versão; SQL e HTTP | Rubrica/política; implementar percepção, estimativa/revisão/publicação e calibração após decisões |
| A11 Empresa | Atribuição versionada, histórico e contato cadastrados; SQL | Aceite administrativo e produção |
| A12 Ativos | Quatro tipos, versões, RACI, revisão de validade e conflitos corrigidos | Aceite editorial completo no navegador e deploy |
| A13 Coleta anônima | Respostas/sessão/recibo atômicos, tentativa aleatória; SQL | Concluída no escopo transacional; política de grupos pequenos é A16 |
| A14 Acesso | Recuperação durável, senha atual, sessão/versão e cadastro público isolado; SQL/HTTP | Deploy prioritário da correção de aquisição, e-mail real, OAuth e ativação controlada do enforcement RLS |
| A15 Entrega Slack | Outbox, reserva, resposta antes do envio, retry e Incerto protegido; SQL | Consumidor periódico/monitoramento, recepção real e procedimento de recuperação |
| A16 Privacidade | Proposta documentada, sem política/expurgo aprovados | Decidir públicos/base/retencão; enforcement ainda precisa ser implementado |
| A17 Suporte/qualidade | Lacunas com responsável/evidência/histórico; saúde real e histórico próprio; SQL/HTTP | Rodada real 43/50 (86%), replay da regra 44/50 (88%); erros/cobertura, revisor da operação, aceite visual e monitoramento |
| A18 Homologação | Matriz, seletores E2E atualizados e cenários de leitura/público preparados | Execução E2E/visual e jornada integral com produção, após remover bloqueios |

## Papéis e isolamento

- Testes unitários e SQL exercitam cliente, admin, superadmin e empresas fictícias distintas. Requisições locais verificam bloqueio do cliente nas rotas administrativas e do global no histórico do cliente.
- Segredos, cookies, códigos temporários e conteúdo real de conversas não entram no CRM/documentação.
- A função interna de agregados conserva execução restrita; teste SQL confirma cálculo e negação a clientes/contas de outra empresa/global pelo canal direto. O aviso de search_path foi corrigido com migração de configuração, sem mudar os cálculos.
- Advisor de segurança após correção: somente avisos informativos de RLS sem policies em tabelas deliberadamente privadas/service_role. Não adicionar policies permissivas para apagar esses avisos. Referência: [aviso informativo RLS sem policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). Índices legados sem uso/FK seguem recomendação de performance, não prova de falha funcional.

## Navegador e E2E

A conexão Chrome ficou indisponível nesta sessão. Não houve screenshot de A06/A07/A10/A14/A17 nem execução visual integral. Evidências anteriores A04/A09 não cobrem telas e ações novas. `npm run test:e2e` não foi executado; não usar descoberta dos cenários como aprovação.

Testes atualizados: Pesquisas/Analytics/Action Points substituem expectativas antigas de Coletas/bibliotecas fixas/dados fictícios em produção. Casos demo exigem `DIRECTSCAL_E2E_DEMO=true` e ambiente isolado; sem isso ficam explicitamente não executados. Recuperação pública tem claro/escuro e 1440/375px, sem enviar e-mail/trocar senha.

`pilot-read-boundaries.spec.ts` exige estados de navegador obtidos por login normal em ambiente de teste (`DIRECTSCAL_E2E_OWNER_STATE`, `DIRECTSCAL_E2E_OPERATOR_STATE`), `DIRECTSCAL_E2E_COMPANY_ID` e diagnóstico estrangeiro conhecido (`DIRECTSCAL_E2E_FOREIGN_DIAGNOSTIC_ID`). Não cria cookies privilegiados. Esses arquivos de sessão são secretos: manter fora do Git e remover após o piloto. Os cenários verificam leitura/negação; não representam jornada de escrita completa.

## Checklist do aceite final

1. Revisar checklists individuais de todas as tarefas bloqueadas no CRM; distinguir decisão, desenvolvimento pendente, infraestrutura e aceite.
2. Implantar o código local em ambiente controlado, com plano de retorno e migrações correspondentes; conferir isolamento do cadastro público antes de liberar aquisição.
3. Após deploy compatível, ativar a checagem direta de versão RLS e validar sessão antiga/remoção/papel em dois navegadores. Antes disso, manter o gate desativado.
4. Conectar navegador e logar normalmente como cliente/admin e operação, usando duas empresas de teste conhecidas. Não colocar cookie administrativo em proxy.
5. Executar jornada de escrita completa: coleta anônima/reentrada/falha; análise; rascunho/publicação; PDF; atribuição/transferência; quatro tipos de ativo; consulta com fonte/recusa; relato/validação e exceção.
6. Validar desktop claro/escuro e fluxo público de resposta em 375px, foco/teclado e retenção de texto após conflito.
7. Escolher participantes autorizados, provar identidade e realizar um contato inicial, confirmação, ausência/único lembrete, intervenção e recuperação no Slack; conferir mensagem/horários reais.
8. Configurar/monitorar consumidores sem ativar contatos indiscriminadamente. Nomear operador e SLA para a fila interna; envio incerto não é retry automático.
9. Concluir decisões e desenvolvimento A10/A16; não aprovar resultado estimado ou anonimato antes disso.
10. Revisar avaliação do agente e falhas de conteúdo/recusa, atingir meta antes do aceite e registrar modelo/conjunto/evidência.
11. Repetir a jornada no ambiente implantado e registrar commit/deployment, datas e evidências; só encerrar A18 sem P0/P1 abertos.


## Verificação final do lote

88 arquivos / 508 testes unitários aprovados, TypeScript/lint/build aprovados. Rodada real do agente v3: 43/50 (86%); correção posterior de recusa validada em reprocessamento determinístico das mesmas respostas, 44/50 (88%), sem nova rodada de IA. Artefatos e limites em operacao-e-qualidade-do-agente.md. Fixtures removidas e ausência confirmada. Produto integral continua bloqueado pelas fronteiras e decisões listadas acima.
