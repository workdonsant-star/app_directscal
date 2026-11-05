-- Programação de acompanhamentos manuais. Registros antigos permanecem sem agenda.
alter table app_private.admin_company_action_points
  add column weekdays integer[],
  add column send_time time without time zone,
  add column schedule_starts_on date;

alter table app_private.admin_company_action_points
  add constraint admin_company_action_points_schedule_check check (
    (weekdays is null and send_time is null and schedule_starts_on is null)
    or (frequency is not null and weekdays is not null and cardinality(weekdays) between 1 and 7
      and send_time is not null and schedule_starts_on is not null
      and weekdays <@ array[0,1,2,3,4,5,6])
  );

alter table app_private.manual_action_point_followups
  add column scheduled_slot text;
create unique index manual_action_point_followups_scheduled_slot_idx
  on app_private.manual_action_point_followups (action_point_id, scheduled_slot)
  where scheduled_slot is not null;
