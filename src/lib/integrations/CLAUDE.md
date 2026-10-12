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
