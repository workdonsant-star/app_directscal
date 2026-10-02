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
