alter table public.response_sessions
  alter column respondent_id drop not null;

comment on column public.response_sessions.respondent_id is
  'Optional legacy respondent reference. Public OMDx responses are anonymous and may leave this null.';
