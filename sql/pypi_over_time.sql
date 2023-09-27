-- get repo's pypi summary and downloads by country over time
WITH yearly_country_counts AS (
  SELECT
    full_metadata.id,
    max(summary) AS summary,
    year,
    country_code,
    -- multiple projects may have the same repo (e.g. if a project name changes).
    -- When this happens, take the sum of their downloads, since these downloads
    -- all correspond to the same overall project
    sum(num_downloads) AS num_downloads
  FROM
    {{ staging_dataset }}.pypi_repo_metadata
  LEFT JOIN
    {{ staging_dataset }}.pypi_file_downloads
    USING (project)
  INNER JOIN
    {{ staging_dataset }}.repos_with_full_meta_raw
    ON
      repo = concat(full_metadata.owner.login, "/", full_metadata.name)
  GROUP BY full_metadata.id, year, country_code
)

SELECT
  id,
  max(summary) AS summary,
  array_agg(STRUCT(year, country_code, num_downloads)) AS downloads
FROM
  yearly_country_counts
GROUP BY
  id
