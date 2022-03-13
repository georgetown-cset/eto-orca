SELECT
  c.funder,
  c.country,
  c.count,
  af.funder AS acronym_match,
  pr.funder AS parentheses_match,
  final_cleaned AS otherwise_cleaned
FROM (
  SELECT
    funder,
    REGEXP_CONTAINS(stage_2, r'^\S+\s+\S+\s+\S+') AS length_3,
    REGEXP_CONTAINS(stage_2, r'([^(\p{ASCII}|’)]+)') AS non_ascii,
    UPPER(REGEXP_REPLACE(stage_2, r'\(.*$', '')) AS final_cleaned,
    country,
    count
  FROM (
    SELECT
      TRIM(TRIM(REPLACE(REPLACE(REPLACE(stage_1, r"^supported\sby\s", ""), r"^the\s", ""), r"(.*?)supported\sby\sthe\s", "")), r'"') AS stage_2,
      *
    FROM (
      SELECT
        --   LOWER(funder) AS funder,
        funder,
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(funder, "&", "and"), "Chinese", "China"), r"UK ", r"United Kingdom "), "U.S.", "United States"), r"US ", r"United States ") AS stage_1,
        country,
        count
      FROM
        `gcp-cset-projects.cset_intern_jms727.dc5_funder_distinct` ) ) ) c
LEFT JOIN
  `gcp-cset-projects.cset_intern_jms727.acronym_to_funder` af
ON
  c.funder = af.acronym
LEFT JOIN
  `gcp-cset-projects.cset_intern_jms727.clean_wo_parentheses` pr
ON
  c.funder = pr.original
ORDER BY
  count DESC
  