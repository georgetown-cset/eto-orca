SELECT DISTINCT
  org.id AS org_id,
  actor.id AS user_id,
  actor.login AS user_login,
  repo.id AS repo_id,
  id AS event_id,
  created_at AS event_date,
  SPLIT(repo.name, "/")[
    OFFSET
    (0)] AS owner_name,
  SPLIT(repo.name, "/")[
    OFFSET
    (1)] AS repo_name,
  TRIM(JSON_EXTRACT(payload,
    "$.action"), '"') AS action
FROM
  staging_github_metrics.events
WHERE
  type = "IssuesEvent"
