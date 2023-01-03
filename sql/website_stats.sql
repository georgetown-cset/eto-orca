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

repo_pushes AS (
  SELECT
    repo_id,
    ARRAY_AGG(STRUCT(
        committer_id AS contributor,
        push_created_at AS contrib_date
    )) AS events
  FROM
    github_metrics.push_event_commits
  GROUP BY
    repo_id),

issues AS (
  SELECT
    repo_id,
    ARRAY_AGG(STRUCT(
        user_id AS contributor,
        event_date,
        action AS event_type
    )) AS events
  FROM
    github_metrics.issue_events
  WHERE
    action IN ("opened", "closed")
  GROUP BY
    repo_id),

first_pr AS (
  SELECT
    repo_id,
    opener_id AS contributor,
    MIN(pr_created_at) AS first_contrib_date
  FROM
    github_metrics.pull_requests_opened
  GROUP BY repo_id, opener_id
),

prs AS (
  SELECT
    pull_requests_opened.repo_id,
    ARRAY_AGG(STRUCT(
        opener_id AS contributor,
        pr_created_at AS contrib_date,
        pr_created_at = first_contrib_date AS is_first_time_contributor
    )) AS events
  FROM
    github_metrics.pull_requests_opened
  LEFT JOIN
    first_pr
    ON
      (first_pr.contributor = pull_requests_opened.opener_id) AND (first_pr.repo_id = pull_requests_opened.repo_id)
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
  created_at,
  updated_at,
  pushed_at,
  description,
  ultimate_fork_of,
  sources,
  paper_meta,
  num_contributors,
  used_by,
  star_dates,
  repo_pushes.events AS push_events,
  issues.events AS issue_events,
  prs AS pr_events
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
  repo_pushes
  ON
    id = repo_pushes.repo_id
LEFT JOIN
  issues
  ON
    id = issues.repo_id
LEFT JOIN
  prs
  ON
    id = prs.repo_id
WHERE
  (stargazers_count >= 10) AND ARRAY_LENGTH(paper_meta) > 1
