WITH
  cnki_ft AS ((
    SELECT
      a.cnki_document_id AS id,
      b.full_text
    FROM
      gcp_cset_cnki.cnki_journals_ft b
    INNER JOIN
      gcp_cset_cnki.cset_cnki_journals_id_mappings a
      -- For uniqueness, match on both document_name and cnki_doi. Unlike cnki_doi, document_name is never null.
      -- Fall back to matching document name alone if cnki_doi is null
    ON
      (a.document_name = b.document_name)
      AND ((a.cnki_doi = b.doi)
        OR (a.cnki_doi IS NULL)
        OR (TRIM(a.cnki_doi) = "")))
  UNION ALL (
    SELECT
      a.cnki_document_id AS id,
      b.full_text
    FROM
      gcp_cset_cnki.cnki_dissertations_ft b
    INNER JOIN
      gcp_cset_cnki.cset_cnki_dissertations_id_mappings a
      -- For uniqueness, match on both document_name and cnki_doi. Unlike cnki_doi, document_name is never null.
      -- Fall back to matching document name alone if cnki_doi is null
    ON
      (a.document_name = b.document_name)
      AND ((a.cnki_doi = b.doi)
        OR (a.cnki_doi IS NULL)
        OR (TRIM(a.cnki_doi) = "")))
  UNION ALL (
    SELECT
      a.cnki_document_id AS id,
      b.full_text
    FROM
      gcp_cset_cnki.cnki_conferences_ft b
    INNER JOIN
      gcp_cset_cnki.cset_cnki_conferences_id_mappings a
      -- For uniqueness, match on both document_name and doi. Unlike doi, document_name is never null.
      -- Fall back to matching document name alone if doi is null
    ON
      (a.document_name = b.document_name)
      AND ((a.cnki_doi = b.doi)
        OR (a.cnki_doi IS NULL)
        OR (TRIM(a.cnki_doi) = "")))),
  arxiv_ft AS (
  SELECT
    id,
    joined_text AS full_text
  FROM
    gcp_cset_arxiv_full_text.fulltext),
  pwc AS (
  SELECT
    paper_url AS id,
    repo_url AS full_text
  FROM
    papers_with_code.links_between_papers_and_code),
  agg_repos AS (
  SELECT
    merged_id,
    REGEXP_EXTRACT_ALL(full_text, r"(?i)(github.com/[A-Za-z0-9-_.]+/[A-Za-z0-9-_]+)") AS repos,
    dataset
  FROM (
    SELECT
      id,
      full_text,
      "cnki" AS dataset
    FROM
      cnki_ft
    UNION ALL
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
    ft.id = article_links.orig_id )
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