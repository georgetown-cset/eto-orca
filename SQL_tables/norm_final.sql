SELECT
  funder,
  IFNULL(foreign_match,
    IFNULL(acronym_match,
      IFNULL(parentheses_match,
        otherwise_cleaned))) AS final_match,
  --   *
FROM (
  SELECT
    *,
    ROW_NUMBER() OVER(PARTITION BY funder ORDER BY count DESC) rn
  FROM
    `gcp-cset-projects.cset_intern_jms727.preliminary_results` )
WHERE
  rn = 1
ORDER BY
  count DESC
  -- dedupe process is necessary as there are still multiple possible matches
  -- for example, MINISTRY OF HIGHER EDUCATION not aggregated by country.
  -- achieves the main point of normalizing the string only section