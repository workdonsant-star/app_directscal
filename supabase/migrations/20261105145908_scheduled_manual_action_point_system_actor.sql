-- Execuções agendadas são iniciadas pelo sistema, sem atribuir autoria ao criador do cadastro.
alter table app_private.manual_action_point_followups
  alter column started_by drop not null;
alter table app_private.manual_action_point_followups
  add constraint manual_action_point_followups_actor_check check (
    (scheduled_slot is null and started_by is not null)
    or (scheduled_slot is not null and started_by is null)
  );
