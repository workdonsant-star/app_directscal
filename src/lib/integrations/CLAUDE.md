# `src/lib/integrations` — Adaptadores externos

## Propósito

Esta pasta contém integrações server-only que traduzem eventos externos para contratos internos do DirectScal. O adaptador não decide permissões de documentos: ele deve encaminhar a organização explicitamente para a camada de consulta.

## Regras

- Nunca exponha tokens, signing secrets ou a service role key ao client.
- Valide a assinatura do provedor antes de interpretar o payload.
- Mantenha o provedor como canal de entrada e saída; a fonte de verdade continua sendo o DirectScal/Supabase.
- Respostas devem citar ativo, seção e versão ou recusar quando não houver evidência.

## Slack

- `slack-format.ts` é puro e testado: assinatura `v0`, `state` assinado do OAuth (HMAC com `AUTH_SECRET`, validade de 10 minutos), limpeza de menções e mensagem em Block Kit com fontes e botões de avaliação.
- `slack.ts` concentra chamadas à API do Slack e a persistência em `app_private.slack_installations` (um workspace ativo por empresa) e `app_private.slack_event_receipts` (descarte de reenvios por `event_id`).
- A organização vem da instalação do workspace (`team_id`). `SLACK_BOT_TOKEN` + `SLACK_ORGANIZATION_ID` continuam como fallback para um workspace único de teste.
- Escopos do bot: `app_mentions:read`, `chat:write`, `im:history`, `channels:history` e `groups:history` (os dois últimos leem a thread para continuar a conversa). Pessoas do Slack não precisam de conta no app; a auditoria registra `team_id:user_id` em `external_user_id`.
- O token do bot fica em schema privado e só é lido pela service role. Desconectar revoga o token no Slack e marca `revoked_at`.

## Slack — pessoas e conversa privada

- Escopos novos do bot: `users:read` (listar e consultar pessoas do workspace, usado para escolher o responsável de um action point) e `im:write` (abrir conversa privada, reservado para o acompanhamento ativo). Instalações anteriores continuam funcionando para perguntas, mas precisam ser reautorizadas; `hasSlackScopes()` compara o `scope` gravado e a interface mostra `Reconectar`.
- `listSlackWorkspaceUsers()` pagina `users.list` (200 por página) e `getSlackWorkspaceUser()` usa `users.info`. `mapSlackMember()` (puro e testado) descarta bots, desativados, convidados e o Slackbot, prefere o nome de exibição e só aceita foto em HTTPS.
- `getSlackBotTokenForOrganization()` devolve o token da instalação ativa da empresa, somente para handlers server-side. O fallback por variável de ambiente (`SLACK_BOT_TOKEN`) não cobre essa consulta.
- A identidade de quem executa é `team_id:user_id` do Slack, a mesma usada na auditoria do agente. Não copiamos o diretório do workspace.

O DTO transitório de pessoas inclui `position` do campo `profile.title`. `listSlackWorkspaceUsers` e `getSlackWorkspaceUser` aceitam `includeGuests=true` para lideranças; o filtro anterior permanece como padrão nos action points. Não exigimos `users:read.email` nem lemos e-mails do diretório.

A15: slack-question separa seleção validada de menção/DM/thread; slack-question-service prepara resposta e conserva regras de contexto. slack-delivery-store persiste ingresso/reserva/transição via RPCs privadas; slack-delivery processa somente reserva exclusiva, guarda resposta antes de enviar e timestamp depois. postSlackMessage devolve canal/ts e classifica erro seguro: 429 recuperável; token/escopo/canal corrigíveis manualmente; transporte/500 sem confirmação tornam o envio Incerto, nunca retry cego. Worker revalida instalação OAuth ativa, sem fallback de ambiente. after() é tentativa imediata, não garantia durável. Ver docs/entrega-duravel-slack.md.

A09: comando vincular em DM é interceptado antes do agente. Pessoa é revalidada por users.info; complete_slack_identity deriva identidade do job/lease autorizado e consome código de dez minutos. Não envia o código ao modelo nem cria auditoria de consulta para esse comando. Mensagem de confirmação passa pela mesma fila durável e resposta preparada. Canais/threads não confirmam identidade.

A05: routine-contacts consulta política/origem/cota antes do preparo e do despacho, revalida pessoa ativa e abre somente a DM correspondente. Fora da janela/cota adia sem consumir tentativa; pausa/despublicação/troca de responsável ou versão cancela contato. Worker nunca usa destino produzido pelo texto/modelo; resposta preparada e confirmação seguem A15. openSlackDirectConversation devolve somente DM válida, classifica falha segura e não envia mensagem por si só.


A06: routine-replies intercepta relatos explícitos em DM antes do modelo, revalida pessoa e exige contexto da própria conversa. Proposta de trinta minutos não grava execução; confirmação deriva identidade/empresa do job reservado. routine-reply-interaction transforma botão assinado em comando durável idempotente; sem confiar em nome, empresa ou response_url. Consultas seguem para busca. Ver docs/conversa-de-execucao-rotinas.md.


A07: contato preparado distingue o lembrete único do contato inicial. Mesmas guardas, horário e cotas de A05. Antes de enviar, relato/intervenção/proposta cancela cobrança; conversa recente adia por 24h. A DM de lembrete preserva a referência do mesmo ciclo e não cria oportunidade. Nenhum aviso automático é enviado ao gestor: o escalonamento ocorre na fila interna da empresa.
