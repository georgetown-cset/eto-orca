-- todo, update so we don't have to edit this query every time the month changes.
-- This queries over 13 TB of data as of 2022-04-20, so run it judiciously
WITH
relevant_repos AS (
  SELECT DISTINCT repo_name
  FROM (
    SELECT CONCAT(matched_owner, "/", matched_name) AS repo_name
    FROM
      {{ staging_dataset }}.repos_with_full_meta_for_app
    UNION DISTINCT
    SELECT CONCAT(current_owner, "/", current_name) AS repo_name
    FROM
      {{ staging_dataset }}.repos_with_full_meta_for_app
    WHERE
      current_name IS NOT NULL
    UNION DISTINCT
    SELECT repo AS repo_name
    FROM
      {{ staging_dataset }}.repos_in_papers) ),

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
    `githubarchive.year.2022`
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
    `githubarchive.month.202301`
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
    `githubarchive.month.202302`
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
    `githubarchive.month.202303`
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
    `githubarchive.month.202304`
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
    `githubarchive.month.202305`
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
    `githubarchive.month.202306` ),

-- needed to allow match to data for old repo names
relevant_ids AS (
  SELECT repo.id AS id
  FROM
    curr_data
  WHERE
    repo.name IN (
      SELECT repo_name
      FROM
        relevant_repos)
)

SELECT
  *
FROM
  curr_data
WHERE
  repo.id IN (
    SELECT id
    FROM
      relevant_ids)
