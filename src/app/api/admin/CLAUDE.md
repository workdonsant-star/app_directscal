# `src/app/api/admin` — APIs do superadmin

## Propósito

Route Handlers privados para a visão de superadmin. Servem snapshots e mutações administrativas usando Supabase no servidor.

## Convenções

- Exigir sessão `superadmin` antes de qualquer leitura ou escrita.
- Usar DTOs de `src/lib/contracts/` em camelCase na fronteira HTTP.
- Service role fica restrita a `src/lib/data/`; handlers não expõem detalhes de banco.
- Respostas de erro devem ser curtas e em pt-BR.

- /specialists persiste o cadastro interno, nome, foto e estados. Exclusão é lógica. As rotas de atribuição usam o mesmo cadastro do banco.

A12: PATCH de management-assets exige `expectedRevision`; a data-source salva conteúdo/metadados na mesma RPC. Conflitos de versão/lock respondem 409 com orientação de preservação do texto. RACI segue o mesmo contrato e fluxo editorial dos demais tipos.

A04: /companies/[id]/routines oferece GET sem cache (workspace ou directory=1) e POST estrito para salvar, transferir e pausar/retomar. Exige superadmin definitivo antes de dados/diretório; empresa/ator vêm de rota/sessão. Mensagens de erro não expõem detalhes do banco ou Slack.

A15: /companies/[id]/slack-deliveries lista metadados paginados e recupera falha confirmada com id/expectedUpdatedAt. Exige superadmin definitivo antes de consultar e revalida ator no banco. Não retorna perguntas/respostas/tokens e não repete envio incerto.

A05: companies/[id]/routine-contact-policy lê/grava política versionada; routine-events registra ocorrência com origem e prazo. Ambos exigem superadmin definitivo antes de dados e derivam empresa/ator da rota/sessão. Salvar não envia Slack nem configura scheduler externo.


A17: companies/[id]/agent-operations POST grava revisão privada de lacuna com superadmin definitivo, schema estrito, empresa/ator derivados e controle de concorrência. Não envia mensagens nem muda resposta/avaliação original.


A10: companies/[id]/result-baselines GET/POST exige superadmin definitivo; POST recebe somente ruleId. A RPC captura agregado da coleta encerrada e retorna a mesma base em reentrada. Sem score/ator/empresa fornecidos pelo navegador.
