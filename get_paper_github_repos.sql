WITH
  repos AS (
  SELECT
    DISTINCT link
  FROM
    `gcp-cset-projects.github_experiments.paper_github_repos` a,
    UNNEST(github_repos) link),
  vis_data AS (
  SELECT
    name,
    ali.alias
  FROM
    `gcp-cset-projects.ai_companies_visualization.visualization_data` v,
    UNNEST(aliases) ali)
  -- SELECT
  --   link,
  --   LOWER(REGEXP_EXTRACT(SUBSTR(link, 12), r"^[^/]+")) AS company,
  --   LOWER(REGEXP_EXTRACT(SUBSTR(link, 12), r"\/(.*)")) AS repo
  -- FROM
  --   repos
SELECT
  *
FROM
  vis_data