-- with tb as
SELECT
  *
FROM (
  SELECT
    *,
    REGEXP_CONTAINS(a.fund_org, r'([^(\p{ASCII}|’)]+)') AS non_ascii
  FROM
    `gcp-cset-projects.cset_intern_jms727.fundorg_translations` a)
WHERE
  non_ascii = TRUE
  AND fund_org_en LIKE "F%"
  -- and fund_org_en LIKE "E%"
ORDER BY
  fund_org_en ASC
  -- get alphabetical value_counts for the other table as well
