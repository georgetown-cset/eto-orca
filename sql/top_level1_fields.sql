-- get top 3 level 1 fields of study per paper
WITH
field_name_scores AS (
  SELECT
    merged_id,
    name,
    field.score AS score
  FROM
    fields_of_study_v2.field_scores
  CROSS JOIN
    UNNEST(fields) AS field
  LEFT JOIN
    fields_of_study_v2.field_meta
    ON
      field_id = field.id
  WHERE
    (level = 1)),

field_order AS (
  SELECT
    merged_id,
    name,
    score,
    ROW_NUMBER() OVER(PARTITION BY merged_id ORDER BY score DESC) AS row_num
  FROM
    field_name_scores)

SELECT
  merged_id,
  ARRAY_AGG(STRUCT(name, score)) AS top_lvl1_fields
FROM
  field_order
WHERE
  (
    row_num < 4
  ) AND (
    merged_id IN (
      SELECT merged_id
      FROM
        gcp_cset_links_v2.corpus_merged
      WHERE
        (
          title_english IS NOT NULL
        ) AND (abstract_english IS NOT NULL) AND (LENGTH(abstract_english) > 500) AND (year > 2010)
    )
  )
GROUP BY merged_id
