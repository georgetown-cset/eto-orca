SELECT DISTINCT
  org.id AS org_id,
  actor.id AS starring_user_id,
  actor.login AS starring_user_login,
  id AS event_id,
  created_at AS star_date,
  SPLIT(repo.name, "/")[
    OFFSET
    (0)] AS owner_name,
  SPLIT(repo.name, "/")[
    OFFSET
    (1)] AS repo_name
FROM
  staging_github_metrics.events
WHERE
  type = "WatchEvent"
