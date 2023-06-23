-- aggregate data for the webapp
WITH
distinct_curated AS (
  SELECT DISTINCT id
  FROM
    staging_github_metrics.curated_repos
  LEFT JOIN
    staging_github_metrics.repos_with_full_meta
    ON
      LOWER(CONCAT(owner_name, "/", matched_name)) = LOWER(repo)
),

distinct_repo_papers AS (
  SELECT DISTINCT
    id,
    merged_id
  FROM
    staging_github_metrics.repos_in_papers
  CROSS JOIN
    UNNEST(merged_ids) AS merged_id
  LEFT JOIN
    staging_github_metrics.repos_with_full_meta
    ON
      LOWER(CONCAT(owner_name, "/", matched_name)) = LOWER(repo)
),

repo_paper_meta AS (
  SELECT
    id,
    ARRAY_AGG(STRUCT(merged_id,
        top_lvl1_fields AS fields)) AS paper_meta
  FROM
    distinct_repo_papers
  LEFT JOIN
    staging_github_metrics.top_level1_fields
    USING
      (merged_id)
  GROUP BY
    id
  UNION ALL
  -- hackily add in the curated repos along with fake fields
  SELECT
    id,
    [
      STRUCT("p1" AS merged_id, [STRUCT("" AS name, 0.1 AS score)] AS fields), -- noqa: L029
      STRUCT("p1" AS merged_id, [STRUCT("" AS name, 0.1 AS score)] AS fields)  -- noqa: L029
    ] AS paper_meta
  FROM
    distinct_curated
  WHERE id NOT IN (SELECT id FROM distinct_repo_papers)),

repo_star_dates AS (
  SELECT
    repo_id,
    ARRAY_AGG(star_date) AS star_dates
  FROM
    staging_github_metrics.star_events
  GROUP BY
    repo_id),

first_commit AS (
  SELECT
    repo_id,
    contributor_name AS contributor,
    MIN(push_created_at) AS first_contrib_date
  FROM
    staging_github_metrics.push_event_commits
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
    staging_github_metrics.push_event_commits
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
    staging_github_metrics.issue_events
  WHERE
    action IN ("opened", "closed")
  GROUP BY
    repo_id),

country_year_disagg AS (
  SELECT
    push_event_commits.repo_id AS repo_id,
    COALESCE(country, "Unknown") AS country,
    EXTRACT(YEAR FROM push_created_at) AS year,
    COUNT(DISTINCT(commit_sha)) AS num_commits
  FROM
    staging_github_metrics.push_event_commits
  LEFT JOIN
    (SELECT * FROM staging_github_metrics.contributor_affiliations
      CROSS JOIN UNNEST(contributed_repos) AS repo_id) AS contributor_affiliations
    ON push_event_commits.contributor_name = contributor_affiliations.contributor
      AND push_event_commits.repo_id = contributor_affiliations.repo_id
  WHERE
    -- associate contributions with the country affiliation the person had at the time
    (
      contributor_affiliations.endyear IS NULL OR EXTRACT(YEAR FROM push_created_at) <= contributor_affiliations.endyear
    )
    AND --noqa: L007
    (
      contributor_affiliations.startyear IS NULL OR EXTRACT(
        YEAR FROM push_created_at
      ) >= contributor_affiliations.startyear
    )
  GROUP BY
    repo_id,
    year,
    country
),

country_year AS (
  SELECT
    repo_id,
    ARRAY_AGG(STRUCT(year, country, num_commits)) AS country_year_contributions
  FROM
    country_year_disagg
  GROUP BY repo_id
),

org_year_disagg AS (
  SELECT
    push_event_commits.repo_id AS repo_id,
    COALESCE(company, "Unknown") AS org,
    EXTRACT(YEAR FROM push_created_at) AS year,
    COUNT(DISTINCT(commit_sha)) AS num_commits
  FROM
    staging_github_metrics.push_event_commits
  LEFT JOIN
    (SELECT * FROM staging_github_metrics.contributor_affiliations
      CROSS JOIN UNNEST(contributed_repos) AS repo_id) AS contributor_affiliations
    ON push_event_commits.contributor_name = contributor_affiliations.contributor
      AND push_event_commits.repo_id = contributor_affiliations.repo_id
  WHERE
    -- associate contributions with the company affiliation the person had at the time
    (
      contributor_affiliations.endyear IS NULL OR EXTRACT(YEAR FROM push_created_at) <= contributor_affiliations.endyear
    )
    AND --noqa: L007
    (
      contributor_affiliations.startyear IS NULL OR EXTRACT(
        YEAR FROM push_created_at
      ) >= contributor_affiliations.startyear
    )
  GROUP BY
    repo_id,
    year,
    company
),

org_year AS (
  SELECT
    repo_id,
    ARRAY_AGG(STRUCT(year, org, num_commits)) AS org_year_contributions
  FROM
    org_year_disagg
  GROUP BY repo_id
),

canonical_meta AS (
  SELECT
    id,
    MAX(owner_name) AS owner_name,
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
      MAX(owner_name), "/", MAX(current_name)
    ) IN (SELECT name FROM `bigquery-public-data.deps_dev_v1.Projects`) AS has_deps_dev -- noqa: L057
  FROM
    staging_github_metrics.repos_with_full_meta
  GROUP BY
    id
)

SELECT
  id,
  owner_name,
  current_name,
  open_issues,
  primary_programming_language,
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
  country_year_contributions,
  org_year_contributions,
  downloads,
  COALESCE(pypi_over_time.summary, description) AS description,
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
  country_year
  ON
    id = country_year.repo_id
LEFT JOIN
  org_year
  ON
    id = org_year.repo_id
LEFT JOIN
  staging_github_metrics.pypi_over_time
  ON
    CONCAT(
      owner_name, "/", current_name
    ) = pypi_over_time.repo
WHERE
  (
    stargazers_count >= 10
  ) AND (
    (
      ARRAY_LENGTH(paper_meta) > 1
    ) OR CONCAT(owner_name, "/", current_name) IN (SELECT repo FROM staging_github_metrics.curated_repos)
  )
