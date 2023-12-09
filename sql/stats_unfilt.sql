-- aggregate data for the webapp
WITH
distinct_curated AS ( -- noqa: L045
  SELECT DISTINCT id
  FROM
    {{ staging_dataset }}.curated_repos
  LEFT JOIN
    {{ staging_dataset }}.repos_with_full_meta
    ON
      LOWER(CONCAT(matched_owner, "/", matched_name)) = LOWER(repo)
),

distinct_repo_papers AS ( -- noqa: L045
  SELECT DISTINCT
    id,
    merged_id
  FROM
    {{ staging_dataset }}.repos_in_papers
  CROSS JOIN
    UNNEST(merged_ids) AS merged_id
  LEFT JOIN
    {{ staging_dataset }}.repos_with_full_meta
    ON
      (
        LOWER(CONCAT(matched_owner, "/", matched_name)) = LOWER(repo)
      ) OR (LOWER(CONCAT(current_owner, "/", current_name)) = LOWER(repo))
),

repo_paper_meta AS (
  (SELECT
    id,
    ARRAY_AGG(STRUCT(merged_id,
        top_lvl1_fields AS fields)) AS paper_meta
    FROM
      distinct_repo_papers
    LEFT JOIN
      {{ staging_dataset }}.top_level1_fields
      USING
        (merged_id)
    GROUP BY
      id)
  UNION ALL
  -- hackily add in the curated repos along with fake fields
  (SELECT
    id,
    [] AS paper_meta
    FROM
      distinct_curated
    LEFT JOIN
      distinct_repo_papers
      USING (id)
    WHERE merged_id IS NULL)),

repo_star_dates AS (
  SELECT
    repo_id,
    ARRAY_AGG(star_date) AS star_dates
  FROM
    {{ staging_dataset }}.star_events
  GROUP BY
    repo_id),

first_commit AS (
  SELECT
    repo_id,
    contributor_name AS contributor,
    MIN(push_created_at) AS first_contrib_date
  FROM
    {{ staging_dataset }}.push_event_commits
  GROUP BY repo_id, contributor_name
),

repo_pushes AS (
  SELECT
    push_event_commits.repo_id,
    ARRAY_AGG(STRUCT(
        contributor_name AS contributor,
        push_created_at AS contrib_date,
        push_created_at = first_contrib_date AS is_first_time_contribution
    )) AS events
  FROM
    {{ staging_dataset }}.push_event_commits
  LEFT JOIN
    first_commit
    ON
      (
        first_commit.contributor = push_event_commits.contributor_name
      ) AND (first_commit.repo_id = push_event_commits.repo_id)
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
    {{ staging_dataset }}.issue_events
  WHERE
    action IN ("opened", "closed")
  GROUP BY
    repo_id),

canonical_pypi AS (
  SELECT
    id,
    downloads,
    summary,
    ROW_NUMBER() OVER (PARTITION BY id) AS ranking
  FROM
    {{ staging_dataset }}.repos_with_full_meta
  INNER JOIN
    {{ staging_dataset }}.pypi_over_time
    USING (id)
),

canonical_meta AS (
  SELECT
    id,
    MAX(current_owner) AS owner_name,
    MAX(current_name) AS current_name,
    MAX(open_issues) AS open_issues,
    MAX(primary_programming_language) AS primary_programming_language,
    MAX(ARRAY_TO_STRING(topics, ",")) AS topics,
    MAX(stargazers_count) AS stargazers_count,
    MAX(subscribers_count) AS subscribers_count,
    MAX(num_releases) AS num_releases,
    MAX(created_at) AS created_at,
    MAX(updated_at) AS updated_at,
    MAX(pushed_at) AS pushed_at,
    MAX(num_contributors) AS num_contributors,
    MAX(used_by) AS used_by,
    MAX(license.name) AS license,
    MAX(description) AS description,
    CONCAT(
      MAX(current_owner), "/", MAX(current_name)
    ) IN (SELECT name FROM `bigquery-public-data.deps_dev_v1.Projects`) AS has_deps_dev -- noqa: L057
  FROM
    {{ staging_dataset }}.repos_with_full_meta
  GROUP BY
    id
)

SELECT
  id,
  owner_name,
  current_name,
  open_issues,
  primary_programming_language,
  default_score AS criticality_score,
  SPLIT(topics, ",") AS topics,
  stargazers_count,
  subscribers_count,
  num_releases,
  created_at,
  updated_at,
  pushed_at,
  paper_meta,
  num_contributors,
  used_by,
  license,
  star_dates,
  repo_pushes.events AS push_events,
  issues.events AS issue_events,
  downloads,
  COALESCE(description, canonical_pypi.summary) AS description,
  CONCAT(
    owner_name, "/", current_name
  ) IN (SELECT name FROM `bigquery-public-data.deps_dev_v1.Projects`) AS has_deps_dev -- noqa: L057
FROM
  repo_paper_meta
LEFT JOIN
  canonical_meta
  USING (id)
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
  `openssf.criticality_score_cron.criticality-score-v0-latest` AS openssf --noqa: L057, L031
  ON
    {{ staging_dataset }}.get_first_repo_slug( --noqa: L030
      openssf.repo.url
    ) = CONCAT(owner_name, "/", current_name)
LEFT JOIN
  canonical_pypi
  USING (id)
WHERE
  (CONCAT(
      owner_name, "/", current_name
    ) IN (
      SELECT repo FROM {{ staging_dataset }}.curated_repos
    )
    OR (
      (
        ARRAY_LENGTH(paper_meta) > 1
      ))) AND ((ranking = 1) OR (ranking IS NULL))
