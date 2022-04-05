SELECT
  funder,
  IFNULL(acronym_match,
    IFNULL(parentheses_match,
      otherwise_cleaned)) AS final_match,
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
  -- MINISTRY OF HIGHER EDUCATION, for example, not aggregated by country.
  -- Unfortunately no way to fix while keeping heuristics unless done manually
  -- But still achieves the main point of normalizing the string only section
  