-- get repo mentions in arXiv fulltext, Papers with Code, and paper titles/abstracts
WITH arxiv_ft AS (
  SELECT
    id,
    regexp_replace(joined_text, r"-\s*\n", "-") AS full_text
  FROM
    gcp_cset_arxiv_full_text.fulltext),

pwc AS (
  SELECT
    paper_url AS id,
    repo_url AS full_text
  FROM
    papers_with_code.links_between_papers_and_code),

pwc_arxiv AS (
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
      "pwc" AS dataset
    FROM
      pwc) AS ft
  LEFT JOIN
    gcp_cset_links_v2.article_links
    ON
      ft.id = article_links.orig_id ),

agg_repos AS (
  SELECT
    merged_id,
    dataset,
    github_metrics.get_all_repo_slugs(full_text) AS repos
  FROM (
    SELECT
      merged_id,
      dataset,
      full_text
    FROM
      pwc_arxiv
    UNION ALL
    SELECT
      merged_id,
      "title+abstract" AS dataset,
      regexp_replace(concat(coalesce(title_english,
          ""), " ", coalesce(title_foreign,
          ""), " ", coalesce(abstract_english,
          ""), " ", coalesce(abstract_foreign,
          "")), r"-\s*\n", "-") AS full_text
    FROM
      gcp_cset_links_v2.corpus_merged))

SELECT
  repo,
  array_agg(distinct(dataset)) AS datasets,
  array_agg(distinct(merged_id)) AS merged_ids
FROM
  agg_repos
CROSS JOIN
  unnest(repos) AS repo
WHERE
  merged_id IS NOT NULL
GROUP BY
  repo
