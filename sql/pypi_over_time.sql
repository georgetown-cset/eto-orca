-- get repo's pypi summary and downloads by country over time
SELECT
  repo,
  summary,
  array_agg(STRUCT(year, country_code, num_downloads)) AS downloads
FROM
  github_metrics.pypi_repo_metadata
LEFT JOIN
  github_metrics.pypi_file_downloads
  USING (project)
GROUP BY repo, summary
