SELECT DISTINCT
  org.id AS owner_id,
  actor.id AS pusher_id,
  actor.login AS pusher_login,
  created_at AS push_created_at,
  id AS event_id,
  SPLIT(repo.name, "/")[
    OFFSET
    (0)] AS owner_name,
  SPLIT(repo.name, "/")[
    OFFSET
    (1)] AS repo_name,
  JSON_EXTRACT(payload,
    '$.push_id') AS push_id,
  JSON_VALUE(JSON_EXTRACT(
    commit_elt, '$.author.email'),
    '$') AS author_email,
  JSON_VALUE(JSON_EXTRACT(
    commit_elt,
    '$.author.name'),
    '$') AS author_name,
  JSON_VALUE(JSON_EXTRACT(
    commit_elt,
    '$.message'),
    '$') AS commit_message,
  JSON_VALUE(JSON_EXTRACT(
    commit_elt,
    '$.sha'),
    '$') AS commit_sha
FROM
  staging_github_metrics.events
CROSS JOIN
  UNNEST(JSON_EXTRACT_ARRAY(payload,
      '$.commits')) AS
  commit_elt
WHERE
  type = "PushEvent"
