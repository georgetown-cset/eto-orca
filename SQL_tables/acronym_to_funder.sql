SELECT
  *
FROM (
  SELECT
    *,
    ROW_NUMBER() OVER(PARTITION BY acronym ORDER BY count DESC) rn
  FROM (
    SELECT
      --   t1.*
      t1.funder AS original,
      t1.country AS country,
      REGEXP_REPLACE(t1.between_parentheses, r'[^a-zA-Z0-9\s\-]', '') AS acronym,
--       t1.between_parentheses,
      t1.final_cleaned AS funder,
      count,
    FROM (
      SELECT
        *
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
            TRIM(TRIM(stage_1, r'"')) AS stage_2,
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
        between_parentheses IS NOT NULL
        AND between_parentheses != "" -- for this one only
        AND non_ascii = FALSE ) t1
    LEFT JOIN
      `cset_intern_jms727.countries` t2
    ON
      UPPER(t2.name) = t1.between_parentheses
      -- WHERE t2.name IS NOT NULL
    WHERE
      t2.name IS NULL
      --     and count > 1 -- if there's more than one than it's less likely to be Arachidonic Acid (AA)
      AND count > 2 -- level of discriminating
    ORDER BY
      acronym ASC,
      count DESC -- most common one among acronyms
      ) interim
  WHERE
    acronym NOT LIKE '% %' -- not two separate words
    AND LENGTH(acronym) > 1 )
WHERE
  rn = 1
--   there will be some problems, but 99% of exact matches will be the most common one
