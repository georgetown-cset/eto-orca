-- get repo's pypi summary and downloads by country over time
WITH yearly_country_counts AS (
  SELECT
    repo,
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
  GROUP BY repo, year, country_code
)

SELECT
  repo,
  max(summary) AS summary,
  array_agg(STRUCT(year, country_code, num_downloads)) AS downloads
FROM
  yearly_country_counts
GROUP BY
  repo
