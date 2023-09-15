-- get pull request open events
with prs as (select distinct
  actor.id as opener_id,
  created_at as pr_created_at,
  repo.id as repo_id,
  id as event_id,
  TRIM(JSON_EXTRACT(payload,
    "$.action"), '"') as action
  from
    {{ staging_dataset }}.events
  where
    (type = "PullRequestEvent"))

select * from prs where action = "opened"
