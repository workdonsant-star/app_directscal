-- Permite novos testes após a entrega confirmada, sem abrir dois envios em preparação.
-- Cada pergunta continua com seu próprio ciclo e thread no Slack.
drop index if exists app_private.manual_action_point_followups_open_idx;
create unique index manual_action_point_followups_open_idx
  on app_private.manual_action_point_followups(action_point_id)
  where status in ('preparado', 'enviando');
