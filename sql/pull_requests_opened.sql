-- get pull request open events
with prs as (select distinct
  org.id as org_id,
  actor.id as opener_id,
  actor.login as opener_login,
  created_at as pr_created_at,
  repo.id as repo_id,
  id as event_id,
  SPLIT(repo.name, "/")[
    offset
    (0)] as owner_name,
  SPLIT(repo.name, "/")[
    offset
    (1)] as repo_name,
  TRIM(JSON_EXTRACT(payload,
    "$.action"), '"') as action
  from
    staging_github_metrics.events
  where
    (type = "PullRequestEvent"))

select * from prs where action = "opened"
