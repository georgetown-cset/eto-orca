-- get repo mentions in arXiv fulltext, semantic scholar fulltext, Papers with Code, and paper titles/abstracts
WITH
arxiv_ft AS (
  SELECT
    id,
    REGEXP_REPLACE(joined_text, r"-\s*\n", "-") AS full_text
  FROM
    gcp_cset_arxiv_full_text.fulltext),

s2_ft AS (
  SELECT
    CAST(corpusid AS STRING) AS id,
    content.text AS full_text
  FROM
    semantic_scholar.fulltext),

pwc AS (
  SELECT
    paper_url AS id,
    repo_url AS full_text
  FROM
    papers_with_code.links_between_papers_and_code),

pwc_arxiv_s2 AS (
  SELECT
    merged_id,
    ft.dataset,
    full_text
  FROM (
    SELECT
      id,
      full_text,
      "arxiv" AS dataset
    FROM
      arxiv_ft
    UNION ALL
    SELECT
      id,
      full_text,
      "s2" AS dataset
    FROM
      s2_ft
    UNION ALL
    SELECT
      id,
      full_text,
      "pwc" AS dataset
    FROM
      pwc) AS ft
  LEFT JOIN
    literature.sources
    ON
      ft.id = sources.orig_id),

agg_repos AS (
  SELECT
    merged_id,
    dataset,
    {{ staging_dataset }}.get_all_repo_slugs(full_text) AS repos --noqa: L030
  FROM (
    SELECT
      merged_id,
      dataset,
      full_text
    FROM
      pwc_arxiv_s2
    UNION ALL
    SELECT
      merged_id,
      "title+abstract" AS dataset,
      REGEXP_REPLACE(
        CONCAT(
          COALESCE(title_english, ""),
          " ",
          COALESCE(title_foreign, ""),
          " ",
          COALESCE(abstract_english, ""),
          " ",
          COALESCE(abstract_foreign, "")
        ),
        r"-\s*\n",
        "-"
      ) AS full_text
    FROM
      literature.papers)),

stack_repo_dois AS (
  SELECT
    repo_name AS repo,
    LOWER(doi) AS doi
  FROM
    thestack.readmes
  CROSS JOIN UNNEST(REGEXP_EXTRACT_ALL(content, r"(?i)\b10.\d{4,9}/[-._;()/:A-Z0-9]+\b")) AS doi
),

stack_merged_ids AS (
  SELECT DISTINCT
    merged_id,
    "stack" AS dataset,
    repo
  FROM stack_repo_dois
  INNER JOIN staging_literature.all_metadata_with_cld2_lid
    ON doi = clean_doi
  LEFT JOIN literature.sources
    ON id = orig_id
),

merged_data AS (
  SELECT
    repo,
    dataset,
    merged_id
  FROM
    stack_merged_ids
  UNION ALL
  SELECT
    repo,
    dataset,
    merged_id
  FROM
    agg_repos
  CROSS JOIN
    UNNEST(repos) AS repo
)


SELECT
  repo,
  ARRAY_AGG(DISTINCT(dataset)) AS datasets,
  ARRAY_AGG(DISTINCT(merged_id)) AS merged_ids
FROM
  merged_data
WHERE
  merged_id IS NOT NULL
GROUP BY
  repo
