-- get commits. The same commit may appear in multiple pushes, so try to deduplicate
with all_events as (
  select distinct
    org.id as org_id,
    actor.id as committer_id,
    actor.login as committer_login,
    created_at as push_created_at,
    repo.id as repo_id,
    id as event_id,
    SPLIT(repo.name, "/")[
      offset
      (0)] as owner_name,
    SPLIT(repo.name, "/")[
      offset
      (1)] as repo_name,
    JSON_EXTRACT(payload,
      '$.push_id') as push_id,
    JSON_VALUE(JSON_EXTRACT(
      commit_elt, '$.author.email'),
      '$') as contributor_email,
    JSON_VALUE(JSON_EXTRACT(
      commit_elt,
      '$.author.name'),
      '$') as contributor_name,
    JSON_VALUE(JSON_EXTRACT(
      commit_elt,
      '$.message'),
      '$') as commit_message,
    JSON_VALUE(JSON_EXTRACT(
      commit_elt,
      '$.sha'),
      '$') as commit_sha
  from
    staging_github_metrics.events
  cross join
    UNNEST(JSON_EXTRACT_ARRAY(payload,
        '$.commits')) as
    commit_elt
  where
    type = "PushEvent"
),

evt_ranks as (
  select
    *,
    ROW_NUMBER() over(partition by commit_sha order by push_created_at desc) as evt_ranking
  from all_events
)

select * except(evt_ranking) from evt_ranks where evt_ranking = 1
