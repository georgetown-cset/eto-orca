-- get commits. The same commit may appear in multiple pushes, so try to deduplicate
with all_events as (
  select distinct
    created_at as push_created_at,
    repo.id as repo_id,
    JSON_VALUE(JSON_EXTRACT(
      commit_elt,
      '$.author.name'),
      '$') as contributor_name,
    JSON_VALUE(JSON_EXTRACT(
      commit_elt,
      '$.sha'),
      '$') as commit_sha
  from
    {{ staging_dataset }}.events
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
    ROW_NUMBER() over(partition by commit_sha, repo_id order by push_created_at desc) as evt_ranking
  from all_events
)

select * except(evt_ranking) from evt_ranks where evt_ranking = 1
