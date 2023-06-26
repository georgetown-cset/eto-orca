-- get repo mentions in arXiv fulltext, semantic scholar fulltext, Papers with Code, and paper titles/abstracts
WITH
valid_v2_ids AS ( -- noqa: L045
  SELECT DISTINCT merged_id_v2 AS merged_id
  FROM
    gcp_cset_links_v3.merged_id_crosswalk
  WHERE
    merged_id_v3 IS NOT NULL
),

arxiv_ft AS ( -- noqa: L045
  SELECT
    id,
    REGEXP_REPLACE(joined_text, r"-\s*\n", "-") AS full_text
  FROM
    gcp_cset_arxiv_full_text.fulltext),

s2_ft AS ( -- noqa: L045
  SELECT
    CAST(corpusid AS STRING) AS id,
    content.text AS full_text
  FROM
    semantic_scholar.fulltext),

pwc AS ( -- noqa: L045
  SELECT
    paper_url AS id,
    repo_url AS full_text
  FROM
    papers_with_code.links_between_papers_and_code),

pwc_arxiv_s2 AS ( -- noqa: L045
  SELECT
    merged_id_v2 AS merged_id,
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
    gcp_cset_links_v3.merged_id_crosswalk
    ON
      ft.id = merged_id_crosswalk.orig_id
  INNER JOIN
    valid_v2_ids
    ON merged_id = merged_id_v2),

agg_merged_corpus_repos AS ( -- noqa: L045
  SELECT
    merged_id,
    dataset,
    github_metrics.get_all_repo_slugs(full_text) AS repos --noqa: L030
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
      gcp_cset_links_v2.corpus_merged
    INNER JOIN
      valid_v2_ids
      USING (merged_id))),

paper_sw_ids AS (
  SELECT
    id,
    doi,
    CAST(pmid AS INT64) AS pmid,
    pmcid
  FROM
    czi_software_mentions.comm_raw
  UNION DISTINCT
  SELECT
    id,
    doi,
    CAST(pmid AS INT64) AS pmid,
    pmcid
  FROM
    czi_software_mentions.non_comm_raw
  UNION DISTINCT
  SELECT
    id,
    doi,
    NULL AS pmid,
    NULL AS pmcid
  FROM
    czi_software_mentions.publishers_collections_raw
),

raw_paper_repos AS (
  SELECT
    github_metrics.get_first_repo_slug(github_repo) AS repo, -- noqa: L030
    doi,
    pmid,
    pmcid
  FROM
    paper_sw_ids
  INNER JOIN
    czi_software_mentions.metadata
    USING (id)
),

doi_merged_ids AS (
  SELECT DISTINCT
    merged_id,
    repo
  FROM
    gcp_cset_links_v2.all_metadata_with_cld2_lid
  INNER JOIN
    raw_paper_repos
    ON LOWER(doi) = clean_doi
  INNER JOIN
    gcp_cset_links_v2.article_links
    ON
      id = orig_id
),

s2_merged_ids AS (
  SELECT
    merged_id_v2 AS merged_id,
    article_links_with_dataset.orig_id
  FROM gcp_cset_links_v3.merged_id_crosswalk
  INNER JOIN
    gcp_cset_links_v3.article_links_with_dataset
    ON merged_id_v3 = merged_id
  WHERE (article_links_with_dataset.dataset = "s2") AND (merged_id_v2 IS NOT NULL)
),

pmc_merged_ids AS (
  SELECT DISTINCT
    merged_id,
    repo
  FROM
    semantic_scholar.papers
  INNER JOIN
    raw_paper_repos
    ON papers.externalids.PubMedCentral = raw_paper_repos.pmcid
  INNER JOIN
    s2_merged_ids
    ON
      CAST(corpusid AS STRING) = orig_id
  UNION DISTINCT
  SELECT DISTINCT
    merged_id_v2 AS merged_id,
    repo
  FROM
    openalex.works
  INNER JOIN
    raw_paper_repos
    ON
      REPLACE(works.ids.pmcid, "https://www.ncbi.nlm.nih.gov/pmc/articles/", "") = CAST(raw_paper_repos.pmcid AS STRING)
  INNER JOIN
    gcp_cset_links_v3.merged_id_crosswalk
    ON
      id = orig_id
),

pm_merged_ids AS (
  SELECT DISTINCT
    merged_id,
    repo
  FROM
    semantic_scholar.papers
  INNER JOIN
    raw_paper_repos
    ON papers.externalids.PubMed = raw_paper_repos.pmid
  INNER JOIN
    s2_merged_ids
    ON
      CAST(corpusid AS STRING) = orig_id
  UNION DISTINCT
  SELECT DISTINCT
    merged_id_v2 AS merged_id,
    repo
  FROM
    openalex.works
  INNER JOIN
    raw_paper_repos
    ON REPLACE(works.ids.pmid, "https://pubmed.ncbi.nlm.nih.gov/", "") = CAST(raw_paper_repos.pmid AS STRING)
  INNER JOIN
    gcp_cset_links_v3.merged_id_crosswalk
    ON
      id = orig_id
),

all_repo_papers AS (
  SELECT
    merged_id,
    "czi" AS dataset,
    repo
  FROM
    doi_merged_ids
  UNION DISTINCT
  SELECT
    merged_id,
    "czi" AS dataset,
    repo
  FROM
    pm_merged_ids
  UNION DISTINCT
  SELECT
    merged_id,
    "czi" AS dataset,
    repo
  FROM
    pmc_merged_ids
  UNION DISTINCT
  (SELECT
    merged_id,
    dataset,
    repo
    FROM
      agg_merged_corpus_repos
    CROSS JOIN
      UNNEST(repos) AS repo)
)

SELECT
  repo,
  ARRAY_AGG(DISTINCT(dataset)) AS datasets,
  ARRAY_AGG(DISTINCT(merged_id)) AS merged_ids
FROM
  all_repo_papers
WHERE
  merged_id IS NOT NULL
GROUP BY
  repo
