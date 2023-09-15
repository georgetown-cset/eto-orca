-- get open and close issue events
SELECT DISTINCT
  actor.id AS user_id,
  repo.id AS repo_id,
  id AS event_id,
  created_at AS event_date,
  TRIM(JSON_EXTRACT(payload,
    "$.action"), '"') AS action
FROM
  {{ staging_dataset }}.events
WHERE
  type = "IssuesEvent"
