SELECT
  repo,
  array_agg(STRUCT(timestamp, country_code)) AS downloads
FROM
  github_metrics.pypi_repo_metadata
LEFT JOIN
  github_metrics.pypi_file_downloads
  USING (project)
GROUP BY repo
