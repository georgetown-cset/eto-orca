-- add package names, repo slugs, and dependency depth of dependent projects to LF ML/AI repos
WITH repo_package_names AS (
  SELECT DISTINCT
    home_page,
    name AS pypi_name,
    github_metrics.get_first_repo_slug(home_page) AS repo_slug
  FROM
    `bigquery-public-data.pypi.distribution_metadata` --noqa: L057
),

lf_ml_ai_package_names AS (
  SELECT DISTINCT
    pypi_name,
    github_metrics.get_first_repo_slug(Github_repo) AS repo_slug
  FROM
    staging_github_metrics.lf_ai_ml_landscape
  INNER JOIN
    repo_package_names
    ON lf_ai_ml_landscape.Github_repo = repo_package_names.home_page
),

repo_dependents AS (
  SELECT DISTINCT
    repo_package_names.repo_slug,
    Name AS pypi_name,
    MinimumDepth AS depth, -- an integer with minimum value 0 for direct dependencies
    repo_package_names_dep.repo_slug AS dep_repo_slug
  FROM
    staging_github_metrics.deps_dev_dependencies_20230220
  LEFT JOIN
    repo_package_names AS repo_package_names_dep -- noqa: L031
    ON repo_package_names_dep.pypi_name = Name
  LEFT JOIN
    repo_package_names
    ON repo_package_names.pypi_name = Dependency.Name
  WHERE Dependency.Name IN (SELECT pypi_name FROM lf_ml_ai_package_names)
),

repo_dependents_agg AS (
  SELECT
    repo_slug,
    array_agg(STRUCT(pypi_name, depth, dep_repo_slug AS repo_slug)) AS dependents
  FROM
    repo_dependents
  GROUP BY repo_slug
),

lf_ai_ml_landscape_with_slug AS (
  SELECT
    lf_ai_ml_landscape.*,
    github_metrics.get_first_repo_slug(Github_repo) AS repo_slug
  FROM
    staging_github_metrics.lf_ai_ml_landscape
)

SELECT
  lf_ai_ml_landscape_with_slug.*,
  dependents
FROM
  lf_ai_ml_landscape_with_slug
LEFT JOIN
  repo_dependents_agg
  USING (repo_slug)
