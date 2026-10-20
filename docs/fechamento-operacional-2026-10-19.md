# Fechamento operacional — 19/10/2026

Implementação autorizada a partir do plano A01–A18 no CRM. Escopo desta rodada: código local mais recente e dados fictícios da auditoria na empresa de teste autorizada. Nenhum deploy e nenhuma mensagem ao Slack.

| Tarefa | Entrega | Situação |
| --- | --- | --- |
| A01 | IDs de dimensão estáveis; página real por responsável; seleção deduplicada; coleta preservada no link e na API; PDF com mesma seleção e título; recusa de rascunho | Implementada; revisão da experiência do cliente pendente |
| A02 | Base de execução conciliada; estado/histórico atômicos; autorização e concorrência | Concluída no escopo local validado |
| A08 | Rascunho privado, snapshot público e histórico; PDF com seis seções editoriais; remoção de achados/causas/cronologia fixos | Implementada; revisão da leitura e do PDF pendente |
| A09 | Impacto ilustrativo retirado; população Slack e paginação integral; base/período acessíveis e proteção contra dupla contagem | Em andamento; prova persistida de identidade entre canais pendente |
| A11 | Principal persistido com concorrência, histórico real por organização e contato da atribuição publicada | Implementação e testes em validação; revisão visual pendente |
| A13 | Sessão e respostas atômicas, reenvio idempotente, prazo e encerramento sob lock | Concluída no escopo local validado |

## Dados e publicação

`delivery_revision_snapshots` e `action_point_atomic_update` foram aplicadas ao OMDx. O conector falhava em instruções de substituição de trigger; a migração nova de execução usa criação idempotente e atualização explícita de timestamp, sem remover triggers existentes. A migração de execução anterior continua no repositório para compatibilidade com bases novas.

Rascunhos ficam em `app_private.admin_delivery_drafts`, versões em `app_private.admin_delivery_versions`. Apenas a operação via service role acessa essas estruturas; o conteúdo do cliente permanece em `admin_deliveries` até nova publicação. As funções são security invoker, com search_path vazio e grants restritos.

`save_action_point_update` valida dono, empresa e ação publicada sob lock do diagnóstico, compara updated_at e grava eventos junto ao estado. Conflito retorna 409. Progresso de implantação não é aderência recorrente. Sem responsável não é classificado como Em risco.

## Evidências

- Suíte unitária: 52 arquivos e 340 testes aprovados após as regressões desta rodada.
- TypeScript e lint aprovados. Build aprovado com acesso às fontes Google; o sandbox sem rede havia impedido apenas esse download.
- `supabase/tests/delivery-revisions.sql`: V1 pública, V2 privada, republicação, duas versões históricas, autorização e grants; sucesso com ROLLBACK.
- `supabase/tests/action-point-atomic-update.sql`: evento inválido reverte estado, versão antiga recusada, isolamento de empresa/papel/publicação e dois eventos sem duplicação; sucesso com ROLLBACK.
- Integração local com duas sessões temporárias do mesmo dono: atribuição de pessoa real do diretório Slack em ação fictícia, leitura em outra sessão, alteração de progresso/histórico, recusa 404 de ação não publicada e remoção da atribuição temporária, todas com resultados esperados.
- Página autorizada contém a coleta e a ação do catálogo e não contém pessoas demonstrativas. PDF de ações e relatório responderam 200. Extração do PDF confirmou as seis seções editoriais publicadas.
- Estado vazio inspecionado em claro/escuro. Estado publicado inspecionado em leitura; a cobertura interativa completa e a revisão visual final do cliente permanecem pendentes.

## Revisão do usuário

1. A01: conferir a visão por responsável com ações publicadas, estado Sem responsável, ausência de percentual sem medição e o vínculo ao download da mesma coleta.
2. A08: revisar o texto de leitura da base uniforme e comparar o conteúdo editorial aprovado na leitura e no PDF. Confirmar a apresentação antes de homologar a experiência do cliente.

Não homologados nesta rodada: novo login Google, publicação do código em produção, coleta sob carga, agente proativo, aderência recorrente, reconciliação das identidades e piloto acompanhado. A13 foi concluída em continuação deste lote; demais tarefas não concluídas mantêm o acompanhamento no CRM.


## Continuação — coleta e base dos indicadores

A13 usa recibos privados de tentativa anônima, sem IP/conta/e-mail/fingerprint. Teste SQL injetou falha intermediária e confirmou rollback integral. No formulário local, 30 respostas produziram confirmação; duas requisições concorrentes 201/201 criaram uma sessão adicional com 30 respostas, não duas. Payload conflitante e cookie repetido retornaram 409; limite 429 permaneceu ativo. Todas as sessões fictícias foram removidas junto ao diagnóstico descartável. Migração atomic_anonymous_responses aplicada.

Após A09/A13: 55 arquivos/353 testes, TypeScript, lint e build aprovados. A09 inclui liderança ativa exclusivamente Slack, deduplica referências por workspace/pessoa e cadastros internos por ID/e-mail, lê todas as páginas e explicita período/base. Sem prova entre canais, adoção fica sem base; cobertura/utilidade continuam calculadas de perguntas reais. Conciliação verificada e dependências A03/A06 continuam pendentes.

## Continuação — operação da empresa

A11 adiciona organization_specialist_assignments privada e RPCs invoker que revalidam superadmin, empresa, especialista ativo e versão. Nenhum escopo foi concedido a clientes. Principal só sugere atribuição nova; entrega/revisão existente preserva sua escolha. A lista da empresa e a fila usam coletas encerradas reais, incluindo estado sem base para análise. Contato da leitura é o e-mail cadastrado do especialista publicado, sem telefone, experiência ou identidade fixa. Migração aplicada e teste SQL aprovado com ROLLBACK.

A revisão automática rejeitou um proxy autenticado local: ele exporia acesso administrativo a outros processos locais. O proxy não foi criado nem executado; validação prossegue por chamadas diretas às APIs. Revisão visual autenticada em claro/escuro continua pendente de sessão no navegador.

## Continuação — A12 em 20/10/2026

RACI habilitada no contrato e no modelo editorial. Salvamento administrativo atômico com revisão esperada; teste SQL injetou falha de rascunho e confirmou rollback do conteúdo e dos metadados. Nenhuma publicação foi sobrescrita.

O timeout de versão antiga foi reproduzido. Causa: erro permanente SQLSTATE 40001 acionava repetição da transação no PostgREST 14. As duas migrações de 20/10 usam PT409 e preservam autorização/grants. Referência oficial: https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b.

Testes integrados locais com banco conectado passaram para SOP, Playbook, Governança e RACI: criação, rascunho oculto, recusa de publicação antecipada, revisão/aprovação/publicação, v2 privada, republicação, arquivo (leitura 404), restauração (200), edição do dono e versão antiga 409. Conflitos em 582, 730, 735 e 669 ms, respectivamente. Uma rodada RACI teve timeout transitório; repetição instrumentada isolada passou em todas as 20 chamadas. Não foi tratado como falha funcional sem reprodução.

Busca real sobre fixture RACI retornou somente a versão concorrente vigente, com conteúdo novo e sem conteúdo anterior; índice continha um trecho vigente e zero antigos. No navegador Chrome autenticado de cliente, duas edições concorrentes produziram aviso 409 mantendo título e texto locais, em claro/escuro. Capturas a12-conflito-claro.png e a12-conflito-escuro.png guardadas na pasta de evidências da tarefa. Tema original restaurado, aba de teste fechada e zero ativos QA A12 residuais confirmados.

Fila administrativa de validade usa publicação vigente + periodicidade reconhecida, prazo inclusivo em São Paulo e fim de mês ajustado. Sem regra não há prazo; sob demanda/arquivado não viram vencimento inventado. Revisão vencida sinaliza manutenção e não invalida a versão automaticamente. Interface e regra de manutenção aguardam revisão visual do painel administrativo: A12 Bloqueada no CRM, sem alegar deploy ou homologação integral de produção.

Validação antes da entrega: 59 arquivos e 367 testes unitários, TypeScript e lint aprovados. Build final de A12 aprovado (79 páginas estáticas, rotas dinâmicas compiladas).

## Continuação — A03 e início de A04 em 20/10/2026

A03: base privada aplicada de acordos versionados, oportunidades únicas por rotina e fatos imutáveis. Acordo exige origem publicada, versão vigente, pergunta do questionário, setor e responsável atribuído. Sem oportunidades elegíveis não há percentual. Leitura, relato, evidência e resultado são separados. Exceção só sai do denominador depois de aprovada; revisão antiga não aprova relato novo.

Teste integrado usou as funções reais da data-source e banco conectado: acordo persistido; duas oportunidades; duas chamadas simultâneas retornaram a mesma sequência e um único fato; relato sem evidência recusado 409 em 220 ms. Leitura real retornou 1 validada/2 elegíveis (50%) por pessoa, ativo e setor. Solicitar exceção conservou a base; aprovar mudou para 1/1 com uma exclusão explícita. Fixtures removidas por IDs/nomes exatos. O conector falhou ao executar a limpeza em lote; remoções individuais confirmaram os registros removidos. Não foram alterados dados operacionais do cliente.

A04: pausa e retomada persistem somente pela operação DirectScal, com motivo, versão esperada, histórico e reentrada. Pausa bloqueia novos ciclos, sem apagar os anteriores ou excluir denominadores retroativamente. SQL passou também com service_role, incluindo tentativa concorrente desatualizada. A04 segue Em andamento: tela operacional, recomendações adaptadas, transferência e integração do fluxo ainda pendentes.

O modelo e os limites estão em `docs/modelo-de-aderencia.md`. Nenhuma nova API pública, mensagem ao Slack ou publicação do código em produção. Advisors mantêm avisos preexistentes; tabelas privadas sem policies são intencionais, sem grants a anon/authenticated. Não houve declaração de banco inteiramente sem avisos.

Validação final deste lote: 61 arquivos/380 testes, TypeScript, lint, diff sem problemas de whitespace e build de produção aprovados. Leitura final confirmou zero fixtures de A03/A12. CRM: A03 Concluída (base do modelo); A04 Em andamento; A12 Bloqueada para revisão visual administrativa. Build não representa deploy ou homologação de produção.

## Continuação — operação A04

Workspace administrativo de rotinas por empresa: criar/adaptar acordo com origem, pergunta, ativo/versão, setor, pessoa Slack revalidada, expectativa e indicador; pausar/retomar com motivo, histórico e concorrência; transferir todas as rotinas da ação atomicamente. Leitura do cliente adicional à lista existente, após autorização RLS e RPC com membership. Trigger diferido impede divergência de responsável pela API anterior. Migração admin_adherence_operations aplicada; teste SQL com falha intermediária confirmou rollback integral de atribuição, revisões e recibo.

Integração: dois acordos persistidos e relidos; edições concorrentes 200/409; pausa, retomada, reentrada e recusa de evento desatualizado; páginas cliente/admin HTTP 200. Cliente verificado em claro/escuro no Chrome normal; screenshots a04-acordos-claro.png e a04-acordos-escuro.png na pasta de evidências. Painel administrativo tem prova de API/SSR, não revisão visual normal. Diretório real possui uma pessoa elegível; transferência real de duas pessoas permanece pendente, apesar do teste SQL de duas rotinas aprovado. Nenhuma mensagem ou deploy. Limpeza confirmou zero fixtures.

392 testes em 64 arquivos, TypeScript, lint e build aprovados. Advisors não indicaram novo FK sem índice nas tabelas adicionadas. RLS privado sem policy de cliente é intencional; avisos preexistentes continuam separados da entrega. A04 Bloqueada no CRM com checklist específico de revisão e transferência.

## Continuação — entrega durável A15

Recibo anterior descartava reenvio mesmo após falha posterior ao aceite. Ingresso agora persiste fila privada antes do 200; consumidor com lease exclusivo, tentativas limitadas e resposta preparada antes do envio conserva trabalho e evita geração repetida. Confirmação guarda timestamp/canal. Queda durante envio fica Incerto e exige revisão, sem retry cego. 429 respeita Retry-After; token/escopo/canal exigem correção quando definitiva. Instalação ativa revalidada sem fallback. APIs administrativas listam metadados paginados e repetem somente falha confirmada com versão; consumidor interno exige segredo dedicado e permanece fechado sem configuração.

Migração slack_durable_delivery aplicada; SQL com ROLLBACK aprovado, incluindo service_role e falha/lease/limite/reentrada. 68 arquivos/414 testes, TypeScript, lint e build aprovados. Sem mensagens reais, fixtures duráveis ou deploy. A15 Bloqueada para piloto Slack e consumidor implantado, com checklist e runbook em entrega-duravel-slack.md. A01/A04/A08/A11/A12 também têm checklist específico de revisão no CRM. A05/A06/A07/A09/A10/A14/A16/A17/A18 ainda não estão concluídas.

## Continuação — identidade A09

Prova de posse dos canais: código de 256 bits/10 minutos no próprio perfil, hash no desafio, consumo atômico por DM recebida e lease durável, revalidação da pessoa, unicidade por conta/pessoa e desvinculação explícita. Vínculo não concede acesso. Indicadores conciliam somente prova vigente da mesma empresa; sem prova mantém sem base. Migração verified_slack_identity aplicada; SQL de fixtures integrais fictícias com ROLLBACK passou. A15 também revalidada com fixtures totalmente fictícias.

70 arquivos/425 testes, TypeScript, lint e build aprovados. Estado inicial do perfil verificado no Chrome normal, claro/escuro; capturas a09-identidade-claro.png e a09-identidade-escuro.png. Sem gerar código real, confirmar identidade real, enviar mensagem ou realizar deploy. Zero links/desafios/jobs residuais. A09 Bloqueada com checklist do piloto interativo e consumidor A15. A05/A06/A07/A10/A14/A16/A17/A18 permanecem abertas.

## Continuação — proatividade A05 e revisão A16

Política por empresa desativada por padrão, com setores, dias, janela/fuso, limites, histórico e concorrência. Calendário do período corrente, eventos com prova explícita, oportunidade/contato atômicos e cursor durável de 25 rotinas. Fila revalida origem, versão, responsável, público, pausa, janela e cota antes do envio; revalida pessoa também na recuperação, abre somente DM, adia sem gastar tentativa e não repete envio Incerto. Nova política reavalia adiamentos sem antecipar Retry-After ou bloquear linhas de envio ao salvar.

SQL com fixtures fictícias e ROLLBACK passou, incluindo falha injetada depois da criação de ciclo/job. Migrações aplicadas; 444 testes em 73 arquivos, TypeScript, lint e build aprovados. HTTP local confirmou política 200, cliente 403, público inválido 400 e SSR administrativo 200. Zero políticas/contatos/ocorrências/cursores/jobs reais ou residuais. Nenhuma mensagem, deploy ou scheduler externo. A05 Bloqueada para revisão administrativa/políticas e piloto; A06/A07 ainda precisam de implementação. Limite: não recompõe automaticamente períodos inteiros nunca abertos durante uma indisponibilidade; requer revisão operacional, sem denominador retroativo presumido.

A16 recebeu proposta concreta de limiar/público/retenção e checklist de decisões no CRM. Continua Bloqueada para aprovação, com enforcement explicitamente pendente; não houve alteração automática de limiar ou expurgo. Ver politica-de-base-e-privacidade-proposta.md e agente-proativo-rotinas.md.


## Continuação A06 — 20/10/2026

Implementada conversa de execução com proposta/confirmacão de trinta minutos, identidade derivada do ingresso Slack, contexto de ciclo próprio, escrita atômica e reentrada. App lê evidência integral, conversa registrada e revisão, com soma de oportunidades explícitas e separação entre implantação/relato/validação. Duas migrações aplicadas e teste SQL transacional aprovado. Sem mensagem real, deploy ou prova visual nova: navegador falhou antes da abertura da fixture, já removida e conferida. Ver conversa-de-execucao-rotinas.md e checklist da A06 no CRM.


## Continuação A07 — 20/10/2026

Implementadas fila por empresa, revisão humana de evidência/exceção, orientação e prazo de retorno, com transação, autoria e reentrada. Lembrete único por ciclo após 24h, na mesma janela/cota, e escalonamento interno em 48h. Duas migrações aplicadas; testes SQL novos e regressões A05/A06 passaram com ROLLBACK. 79 arquivos/472 testes, TypeScript e lint aprovados. Build local aprovado. HTTP local confirmou leitura 200, cliente 403, SSR administrativo 200 e payload forjado 400, sem escrita; a primeira tentativa perdeu conexão e a repetição após recuperação do servidor passou. Nenhuma política real ativada, mensagem enviada ou cron/deploy criado; revisão visual permanece pendente por indisponibilidade do navegador.


## Continuação A14 — 20/10/2026

Recuperação real durável, troca autenticada e revogação; aquisição pública isolada atomicamente. SQL fictício/ROLLBACK, 488 testes, TypeScript/lint/build e HTTP local aprovados. Enforcement RLS false até deploy compatível. Sem e-mail real/alteração de conta/deploy/aceite visual. Ver acesso-e-recuperacao-de-conta.md e checklist da A14 no CRM.

## Continuação A17 — 20/10/2026

Fila de lacunas com responsável, prazo, resolução/evidência e histórico imutável; saúde por empresa e histórico próprio de consultas do app. Banco transacional aprovado, avaliação do agente em execução em fixtures novas. Sem monitoramento externo, deploy ou aceite visual; ver operacao-e-qualidade-do-agente.md.


## Fechamento do lote A10/A14/A17/A18 — 20/10/2026

Base de resultado imutável implementada, sem nota estimada; rubrica/percepção/calibração dependem de decisões A10/A16 e de desenvolvimento posterior explícito. Recuperação e isolamento de aquisição A14 estão no código local; enforcement RLS permanece false até deploy compatível. A17 tem fila de lacunas com autoria/evidência, saúde real e histórico próprio; avaliação externa ainda em fechamento. A18 reúne matriz e 13 cenários de navegador preparados, sem alegar execução E2E. Conjunto unitário: 86 arquivos/500 testes aprovados; TypeScript/lint/build finais aprovados. SQLs A10/A17/agregados e regressões A03/A04 aprovados com ROLLBACK. Requisições HTTP de A10/A17 aprovadas sem mutação. Nenhuma política de contato ativa, e-mail real, senha alterada ou deploy. Checklists individuais preservados no CRM.


## Verificação final — 20/10/2026

88 arquivos/508 testes unitários, TypeScript/lint/build aprovados. Avaliação real v3: 43/50 (86%); reprocessamento determinístico da regra final de recusa: 44/50 (88%), mudando só amb-04 e sem nova chamada de IA/DB. Brutos v2/v3 e manifestos preservados. Quatro erros técnicos e duas recusas de cobertura continuam para revisão operacional. Fixtures removidas e ausência confirmada. A17 permanece bloqueada para revisão/infra/piloto; A10/A16 têm decisões e desenvolvimento dependente pendentes. Checklists individuais e matriz final ficam no CRM. Sem deploy, mensagem/e-mail real, ativação de contato ou enforcement RLS.
