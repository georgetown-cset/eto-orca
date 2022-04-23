-- Extracts github repos from LN text. Use caution as this queries 12.1 TB of data as of 2022-04-23
WITH
ln_with_search_text AS (
  SELECT
    *,
    REGEXP_REPLACE(CONCAT(COALESCE(title,
          ""), " ", COALESCE(content,
          ""), " ", COALESCE(contentWithMarkup,
          "")), r"-\s*\n", "-") AS search_text
  FROM
    gcp_cset_lexisnexis.raw_news),

repo_extracts AS (
  SELECT
    * EXCEPT(search_text),
    REGEXP_EXTRACT_ALL(search_text, r"(?i)github.com/([A-Za-z0-9-_.]+/[A-Za-z0-9-_.]*[A-Za-z0-9-_])") AS repos
  FROM
    ln_with_search_text)

SELECT
  *
FROM
  repo_extracts
WHERE
  ARRAY_LENGTH(repos) > 0
