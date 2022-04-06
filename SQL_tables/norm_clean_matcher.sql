WITH
  foreign_table AS
  -- Cleaned foreign funder matcher
  -- 2,056,387 distinct on `fund_org` out of 2,109,833
  (
  SELECT
    fund_org,
    fund_org_en
  FROM (
    SELECT
      DISTINCT fund_org_en,
      fund_org,
      ROW_NUMBER() OVER(PARTITION BY fund_org) rn
    FROM (
      SELECT
        UPPER(TRIM(REGEXP_REPLACE(REPLACE(fund_org_en, "&", "and"), r'[+\-\[\]{}<>?*^%#@$"\':.,\\/]', ''))) AS fund_org_en,
        -- next version: add spaces for some of these
        -- cleaning
        UPPER(TRIM(REGEXP_REPLACE(REPLACE(fund_org, "&", "and"), r'[+\-\[\]{}<>?*^%#@$"\':.,\\/]', ''))) AS fund_org,
      FROM
        `gcp-cset-projects.cset_intern_jms727.fundorg_translations` a ) )
  WHERE
    rn = 1 -- distinct on fund_org
    ),
  merged AS (
  SELECT
    DISTINCT funder,
    UPPER(TRIM(REGEXP_REPLACE(REPLACE(funder, "&", "and"), r'[+\-\[\]{}<>?*^%#@$"\':.,\\/]', ''))) AS stage_1,
    country,
    count
  FROM
    `gcp-cset-projects.cset_intern_jms727.dc5_funder_distinct` c ),
  intermediate AS (
  SELECT
    *
  FROM
    merged
  LEFT JOIN
    foreign_table
  ON
    merged.stage_1 = foreign_table.fund_org ),
  confirm_translation AS (
  SELECT
    a.funder,
    a.stage_1,
    CASE
      WHEN REGEXP_REPLACE(a.stage_1, r'\(.*$', '') = '' THEN NULL
    ELSE
    REGEXP_REPLACE(a.stage_1, r'\(.*$', '')
  END
    AS stage_2,
    CASE
      WHEN REGEXP_REPLACE(a.stage_1, r'[^a-zA-Z0-9\s\-]', '') = '' THEN NULL
    ELSE
    REGEXP_REPLACE(a.stage_1, r'[^a-zA-Z0-9\s\-]', '')
  END
    AS stage_3,
    a.country,
    a.count,
    --   a.fund_org,
    a.fund_org_en,
    CASE
      WHEN b.stage_1 IS NULL THEN 0
    ELSE
    1
  END
    AS present
  FROM
    intermediate a
  LEFT JOIN
    merged b
  ON
    a.fund_org_en = b.stage_1 ),
  final_matcher AS (
  SELECT
    funder,
    IFNULL(IFNULL(IFNULL(fund_org_en,
          stage_2),
        stage_3),
      stage_1) AS final_match,
    count
    --         *
  FROM (
    SELECT
      *,
      ROW_NUMBER() OVER(PARTITION BY funder ORDER BY count DESC) rn2
    FROM
      confirm_translation)
  WHERE
    rn2 = 1
  ORDER BY
    count DESC ),
  topmatch AS (
  SELECT
    funder,
    final_match
  FROM (
    SELECT
      *,
      ROW_NUMBER() OVER(PARTITION BY final_match ORDER BY count DESC) rn
    FROM
      final_matcher)
  WHERE
    rn = 1 )
SELECT
  a.funder,
  a.final_match,
  topmatch.funder AS cleaned
FROM
  final_matcher a
LEFT JOIN
  topmatch
USING
  (final_match)
ORDER BY
  count DESC
  -- dedupe process is necessary as there are still multiple possible matches
  -- for example, MINISTRY OF HIGHER EDUCATION not aggregated by country.
  -- achieves the main point of normalizing the string only section