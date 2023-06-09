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
    dataset,
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
    gcp_cset_links_v3_flatstart.article_links
    ON
      ft.id = article_links.orig_id ),

agg_repos AS (
  SELECT
    merged_id,
    dataset,
    github_metrics.GET_ALL_REPO_SLUGS(full_text) AS repos
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
      gcp_cset_links_v2.corpus_merged))

SELECT
  repo,
  ARRAY_AGG(DISTINCT(dataset)) AS datasets,
  ARRAY_AGG(DISTINCT(merged_id)) AS merged_ids
FROM
  agg_repos
CROSS JOIN
  UNNEST(repos) AS repo
WHERE
  merged_id IS NOT NULL
GROUP BY
  repo
