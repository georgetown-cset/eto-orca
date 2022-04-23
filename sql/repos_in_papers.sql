WITH
cnki_ft AS ((
    SELECT
      cset_cnki_journals_id_mappings.cnki_document_id AS id,
      regexp_replace(cnki_journals_ft.full_text, r"-\s*\n", "-") AS full_text
    FROM
      gcp_cset_cnki.cnki_journals_ft
    INNER JOIN
      gcp_cset_cnki.cset_cnki_journals_id_mappings
      -- For uniqueness, match on both document_name and cnki_doi. Unlike cnki_doi, document_name is never null.
      -- Fall back to matching document name alone if cnki_doi is null
      ON
        (cset_cnki_journals_id_mappings.document_name = cnki_journals_ft.document_name)
        AND ((cset_cnki_journals_id_mappings.cnki_doi = cnki_journals_ft.doi)
          OR (cset_cnki_journals_id_mappings.cnki_doi IS NULL)
          OR (trim(cset_cnki_journals_id_mappings.cnki_doi) = "")))
  UNION ALL (
    SELECT
      cset_cnki_dissertations_id_mappings.cnki_document_id AS id,
      regexp_replace(cnki_dissertations_ft.full_text, r"-\s*\n", "-") AS full_text
    FROM
      gcp_cset_cnki.cnki_dissertations_ft
    INNER JOIN
      gcp_cset_cnki.cset_cnki_dissertations_id_mappings
      -- For uniqueness, match on both document_name and cnki_doi. Unlike cnki_doi, document_name is never null.
      -- Fall back to matching document name alone if cnki_doi is null
      ON
        ( cset_cnki_dissertations_id_mappings.document_name = cnki_dissertations_ft.document_name )
        AND ((cset_cnki_dissertations_id_mappings.cnki_doi = cnki_dissertations_ft.doi)
          OR (cset_cnki_dissertations_id_mappings.cnki_doi IS NULL)
          OR (trim(cset_cnki_dissertations_id_mappings.cnki_doi) = "")))
  UNION ALL (
    SELECT
      cset_cnki_conferences_id_mappings.cnki_document_id AS id,
      regexp_replace(cnki_conferences_ft.full_text, r"-\s*\n", "-") AS full_text
    FROM
      gcp_cset_cnki.cnki_conferences_ft
    INNER JOIN
      gcp_cset_cnki.cset_cnki_conferences_id_mappings
      -- For uniqueness, match on both document_name and doi. Unlike doi, document_name is never null.
      -- Fall back to matching document name alone if doi is null
      ON
        ( cset_cnki_conferences_id_mappings.document_name = cnki_conferences_ft.document_name )
        AND ((cset_cnki_conferences_id_mappings.cnki_doi = cnki_conferences_ft.doi)
          OR (cset_cnki_conferences_id_mappings.cnki_doi IS NULL)
          OR (trim(cset_cnki_conferences_id_mappings.cnki_doi) = "")))),

arxiv_ft AS (
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

pwc_arxiv_cnki AS (
  SELECT
    merged_id,
    dataset,
    full_text
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
      ft.id = article_links.orig_id ),

agg_repos AS (
  SELECT
    merged_id,
    dataset,
    regexp_extract_all(full_text, r"(?i)github.com/([A-Za-z0-9-_.]+/[A-Za-z0-9-_.]*[A-Za-z0-9-_])") AS repos
  FROM (
    SELECT
      merged_id,
      dataset,
      full_text
    FROM
      pwc_arxiv_cnki
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
