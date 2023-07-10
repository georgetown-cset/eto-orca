-- get star dates
SELECT DISTINCT
  actor.id AS starring_user_id,
  repo.id AS repo_id,
  created_at AS star_date
FROM
  staging_github_metrics.events
WHERE
  type = "WatchEvent"
