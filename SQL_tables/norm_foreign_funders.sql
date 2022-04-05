-- foreign_funder_translations_tr
SELECT
  *
FROM (
  SELECT
    *,
    ROW_NUMBER() OVER(PARTITION BY fundorg_tr) rn
  FROM (
    SELECT
      DISTINCT fundorg_tr,
      fundorg_en
    FROM
      -- there are duplicates
      (
      SELECT
        TRIM(UPPER(TRIM(TRIM(TRIM(TRIM(stage_1_en, r'"'), r'\''), r'$'), r'#'))) AS fundorg_en,
        TRIM(UPPER(TRIM(TRIM(TRIM(TRIM(stage_1, r'"'), r'\''), r'$'), r'#'))) AS fundorg_tr,
        --         REGEXP_CONTAINS(a.fund_org, r'([^(\p{ASCII}|’)]+)') AS non_ascii
      FROM (
        SELECT
          REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(fund_org_en, "&", "and"), "Chinese", "China"), r"UK ", r"United Kingdom "), "U.S.", "United States"), r"US ", r"United States ") AS stage_1_en,
          REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(fund_org, "&", "and"), "Chinese", "China"), r"UK ", r"United Kingdom "), "U.S.", "United States"), r"US ", r"United States ") AS stage_1
        FROM
          `gcp-cset-projects.cset_intern_jms727.fundorg_translations` a)
        -- WHERE
        --   stage_1_en LIKE "F%"
        --     non_ascii = FALSE
        --     AND fund_org_en LIKE "F%"
        ) ))
WHERE
  rn = 1
--   rn = 2
ORDER BY
  fundorg_tr ASC
  -- get alphabetical value_counts for the other table as well
  -- tr
  -- Example duplicates: "NATIONAL NATURAL SCIENCE FOUNDATION OF CHINA" 585 594


-- SELECT
--   COUNT(DISTINCT fundorg_tr),
--   COUNT(DISTINCT fundorg_en),
--   COUNT(*)
-- FROM
--   `gcp-cset-projects.cset_intern_jms727.foreign_funder_translations`