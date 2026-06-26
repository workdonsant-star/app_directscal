create or replace function public.omdx_question_aggregates(diagnostic_ids uuid[])
returns table (
  diagnostic_id uuid,
  dimension_id uuid,
  dimension_slug text,
  dimension_number integer,
  dimension_name text,
  dimension_short_name text,
  dimension_question text,
  dimension_description text,
  question_id uuid,
  question_order_index integer,
  question_text text,
  response_count bigint,
  founder_count bigint,
  leadership_count bigint,
  operation_count bigint,
  score numeric,
  variance numeric,
  founder_score numeric,
  leadership_score numeric,
  operation_score numeric
)
language sql
stable
as $$
  with requested_diagnostics as (
    select distinct unnest(diagnostic_ids) as diagnostic_id
  ),
  completed_sessions as (
    select
      rs.id,
      rs.diagnostic_id,
      rs.group_id
    from public.response_sessions rs
    join requested_diagnostics rd on rd.diagnostic_id = rs.diagnostic_id
    where rs.status = 'concluido'
  ),
  answers as (
    select
      cs.diagnostic_id,
      cs.group_id,
      q.dimension_id,
      q.id as question_id,
      la.value::numeric as value
    from completed_sessions cs
    join public.likert_answers la on la.response_session_id = cs.id
    join public.questions q on q.id = la.question_id
  ),
  question_aggregates as (
    select
      a.diagnostic_id,
      a.dimension_id,
      a.question_id,
      count(*) as response_count,
      count(*) filter (where a.group_id = 'fundador') as founder_count,
      count(*) filter (where a.group_id = 'lideranca') as leadership_count,
      count(*) filter (where a.group_id = 'operacao') as operation_count,
      avg(a.value) as score,
      var_pop(a.value) as variance,
      avg(a.value) filter (where a.group_id = 'fundador') as founder_score,
      avg(a.value) filter (where a.group_id = 'lideranca') as leadership_score,
      avg(a.value) filter (where a.group_id = 'operacao') as operation_score
    from answers a
    group by a.diagnostic_id, a.dimension_id, a.question_id
  )
  select
    d.id as diagnostic_id,
    dim.id as dimension_id,
    dim.slug as dimension_slug,
    dim.number as dimension_number,
    dim.name as dimension_name,
    dim.short_name as dimension_short_name,
    dim.question as dimension_question,
    dim.description as dimension_description,
    q.id as question_id,
    q.order_index as question_order_index,
    q.text as question_text,
    coalesce(qa.response_count, 0)::bigint as response_count,
    coalesce(qa.founder_count, 0)::bigint as founder_count,
    coalesce(qa.leadership_count, 0)::bigint as leadership_count,
    coalesce(qa.operation_count, 0)::bigint as operation_count,
    qa.score,
    qa.variance,
    qa.founder_score,
    qa.leadership_score,
    qa.operation_score
  from requested_diagnostics rd
  join public.diagnostics d on d.id = rd.diagnostic_id
  join public.questions q on q.template_id = d.template_id
  join public.dimensions dim on dim.id = q.dimension_id
  left join question_aggregates qa
    on qa.diagnostic_id = d.id
    and qa.dimension_id = dim.id
    and qa.question_id = q.id
  order by d.id, dim.number, q.order_index;
$$;

revoke all on function public.omdx_question_aggregates(uuid[]) from public;
revoke all on function public.omdx_question_aggregates(uuid[]) from anon;
revoke all on function public.omdx_question_aggregates(uuid[]) from authenticated;
grant execute on function public.omdx_question_aggregates(uuid[]) to service_role;
