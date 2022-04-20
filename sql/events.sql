-- todo, update so we don't have to edit this query every time the month changes.
-- This queries over 13 TB of data as of 2022-04-20, so run it judiciously
WITH
relevant_repos AS (
  SELECT DISTINCT repo_name
  FROM (
    SELECT CONCAT(owner_name, "/", matched_name) AS repo_name
    FROM
      github_metrics.repos_with_full_meta
    UNION ALL
    SELECT CONCAT(owner_name, "/", current_name) AS repo_name
    FROM
      github_metrics.repos_with_full_meta
    WHERE
      current_name IS NOT NULL) ),

curr_data AS (
  SELECT
    type,
    public,
    payload,
    repo,
    actor,
    org,
    created_at,
    id,
    other
  FROM
    `githubarchive.year.2011`
  UNION ALL
  SELECT
    type,
    public,
    payload,
    repo,
    actor,
    org,
    created_at,
    id,
    other
  FROM
    `githubarchive.year.2012`
  UNION ALL
  SELECT
    type,
    public,
    payload,
    repo,
    actor,
    org,
    created_at,
    id,
    other
  FROM
    `githubarchive.year.2013`
  UNION ALL
  SELECT
    type,
    public,
    payload,
    repo,
    actor,
    org,
    created_at,
    id,
    other
  FROM
    `githubarchive.year.2014`
  UNION ALL
  SELECT
    type,
    public,
    payload,
    repo,
    actor,
    org,
    created_at,
    id,
    other
  FROM
    `githubarchive.year.2015`
  UNION ALL
  SELECT
    type,
    public,
    payload,
    repo,
    actor,
    org,
    created_at,
    id,
    other
  FROM
    `githubarchive.year.2016`
  UNION ALL
  SELECT
    type,
    public,
    payload,
    repo,
    actor,
    org,
    created_at,
    id,
    other
  FROM
    `githubarchive.year.2017`
  UNION ALL
  SELECT
    type,
    public,
    payload,
    repo,
    actor,
    org,
    created_at,
    id,
    other
  FROM
    `githubarchive.year.2018`
  UNION ALL
  SELECT
    type,
    public,
    payload,
    repo,
    actor,
    org,
    created_at,
    id,
    other
  FROM
    `githubarchive.year.2019`
  UNION ALL
  SELECT
    type,
    public,
    payload,
    repo,
    actor,
    org,
    created_at,
    id,
    other
  FROM
    `githubarchive.year.2020`
  UNION ALL
  SELECT
    type,
    public,
    payload,
    repo,
    actor,
    org,
    created_at,
    id,
    other
  FROM
    `githubarchive.year.2021`
  UNION ALL
  SELECT
    type,
    public,
    payload,
    repo,
    actor,
    org,
    created_at,
    id,
    other
  FROM
    `githubarchive.month.202201`
  UNION ALL
  SELECT
    type,
    public,
    payload,
    repo,
    actor,
    org,
    created_at,
    id,
    other
  FROM
    `githubarchive.month.202202`
  UNION ALL
  SELECT
    type,
    public,
    payload,
    repo,
    actor,
    org,
    created_at,
    id,
    other
  FROM
    `githubarchive.month.202203`
  UNION ALL
  SELECT
    type,
    public,
    payload,
    repo,
    actor,
    org,
    created_at,
    id,
    other
  FROM
    `githubarchive.month.202204` )

SELECT
  *
FROM
  curr_data
WHERE
  repo.name IN (
    SELECT repo_name
    FROM
      relevant_repos)
