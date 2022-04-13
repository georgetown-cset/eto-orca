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
        UPPER(TRIM(REGEXP_REPLACE(REPLACE(fund_org_en, "&", "and"), r'[+\-\[\]{}<>?*^%#@$"\':.,/-]', ''))) AS fund_org_en,
        -- cleaning
        UPPER(TRIM(REGEXP_REPLACE(REPLACE(fund_org, "&", "and"), r'[+\-\[\]{}<>?*^%#@$"\':.,/-]', ''))) AS fund_org,
      FROM
        `gcp-cset-projects.cset_intern_jms727.fundorg_translations` a ) )
  WHERE
    rn = 1 -- distinct on fund_org
    )