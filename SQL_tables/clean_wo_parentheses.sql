SELECT
  *
FROM (
  SELECT
    DISTINCT funder AS original,
    --   country,
    REGEXP_REPLACE(final_cleaned, r'[^a-zA-Z0-9\s\-]', '') AS funder,
    count,
    ROW_NUMBER() OVER(PARTITION BY funder ORDER BY count DESC) rn
  FROM (
    SELECT
      funder,
      UPPER(REGEXP_EXTRACT(stage_2, r'\((.*?)\)')) AS between_parentheses,
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
          `gcp-cset-projects.cset_intern_jms727.dc5_funder_distinct` c ) )
    ORDER BY
      stage_2 ASC )
  WHERE
    between_parentheses IS NULL
    AND non_ascii = FALSE
    AND count > 1
  ORDER BY
    funder ASC,
    count DESC -- most common one among acronyms
    )
WHERE
  rn = 1
  