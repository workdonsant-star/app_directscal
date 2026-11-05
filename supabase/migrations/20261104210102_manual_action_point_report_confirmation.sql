alter table app_private.manual_action_point_reports
  add column confirmed_at timestamptz,
  add column confirmation_job_id uuid unique references app_private.slack_delivery_jobs(id);
