WITH
repo_paper_meta AS (
  SELECT
    repo,
    ARRAY_AGG(STRUCT(merged_id,
        fields)) AS paper_meta
  FROM
    github_metrics.repos_in_papers
  CROSS JOIN
    UNNEST(merged_ids) AS merged_id
  LEFT JOIN
    staging_github_metrics.top_level1_fields
    USING
      (merged_id)
  GROUP BY
    repo),

repo_star_dates AS (
  SELECT
    repo_id,
    ARRAY_AGG(star_date) AS star_dates
  FROM
    github_metrics.star_events
  GROUP BY
    repo_id),

push_events AS (
  SELECT DISTINCT
    repo_id,
    event_id,
    push_created_at
  FROM
    github_metrics.push_event_commits),

repo_push_dates AS (
  SELECT
    repo_id,
    ARRAY_AGG(push_created_at) AS push_dates
  FROM
    push_events
  GROUP BY
    repo_id)

SELECT
  id,
  owner_name,
  matched_name,
  current_name,
  open_issues,
  primary_programming_language,
  topics,
  stargazers_count,
  subscribers_count,
  num_releases,
  num_contributors,
  created_at,
  updated_at,
  pushed_at,
  description,
  ultimate_fork_of,
  sources,
  paper_meta,
  star_dates,
  push_dates
FROM
  github_metrics.repos_with_full_meta
INNER JOIN
  repo_paper_meta
  ON
    LOWER(CONCAT(owner_name, "/", matched_name)) = LOWER(repo)
LEFT JOIN
  repo_star_dates
  ON
    id = repo_star_dates.repo_id
LEFT JOIN
  repo_push_dates
  ON
    id = repo_push_dates.repo_id
WHERE
  (stargazers_count >= 10)
