CREATE OR REPLACE FUNCTION staging_orca.get_all_repo_slugs(text STRING)
RETURNS ARRAY<STRING>
AS (
  (
    SELECT array_agg(DISTINCT repo)
    FROM unnest(regexp_extract_all(text, r"(?i)github.com/([A-Za-z0-9-_.]+/[A-Za-z0-9-_.]*[A-Za-z0-9-_])")) AS repo
  )
);
