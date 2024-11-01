CREATE OR REPLACE FUNCTION staging_orca.get_first_repo_slug(text STRING)
RETURNS STRING
AS (
  regexp_extract(text, r"(?i)github.com/([A-Za-z0-9-_.]+/[A-Za-z0-9-_.]*[A-Za-z0-9-_])")
);
