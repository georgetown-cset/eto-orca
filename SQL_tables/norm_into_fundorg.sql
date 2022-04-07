SELECT
  a.*,
  b.cleaned, 
  IFNULL(b.cleaned, a.fund_org) AS final_fund_org
FROM
  `gcp-cset-projects.staging_merged_article_metadata.paper_fundorg_merged` a
LEFT JOIN
--   `gcp-cset-projects.staging_merged_article_metadata.normalize_funders` b -- stage
  `cset_intern_jms727.final_matcher_20220406` b -- dev

ON
  a.fund_org = b.funder
  
-- ORDER BY RAND() -- understand structure differently
-- 8,536,241 null values out of 88,050,931 
-- Of those null values 4,918,702 are distinct on fund_org
-- 3,769,297 distinct values in cleaned row
-- 8,687,988 distinct values in final_fund_org 
-- 9,677,244 distinct values in original fund_org
-- So the final outcome is reduced by 9,677,244 - 8,687,988 = 989,256
