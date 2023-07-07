-- get repo's pypi summary and downloads by country over time
WITH valid_ids AS (
  SELECT DISTINCT id
  FROM
    staging_github_metrics.events
  WHERE
    events.repo.name IN (SELECT repo FROM staging_github_metrics.pypi_repo_metadata)
),

valid_names AS (
  SELECT DISTINCT
    id,
    repo.name AS repo
  FROM
    staging_github_metrics.events
  WHERE
    id IN (SELECT id FROM valid_ids)
),

yearly_country_counts AS (
  SELECT
    id,
    max(summary) AS summary,
    year,
    country_code,
    -- multiple projects may have the same repo (e.g. if a project name changes).
    -- When this happens, take the sum of their downloads, since these downloads
    -- all correspond to the same overall project
    sum(num_downloads) AS num_downloads
  FROM
    staging_github_metrics.pypi_repo_metadata
  LEFT JOIN
    staging_github_metrics.pypi_file_downloads
    USING (project)
  INNER JOIN
    valid_names
    USING (repo)
  GROUP BY id, year, country_code
)

SELECT
  id,
  max(summary) AS summary,
  array_agg(STRUCT(year, country_code, num_downloads)) AS downloads
FROM
  yearly_country_counts
GROUP BY
  id
