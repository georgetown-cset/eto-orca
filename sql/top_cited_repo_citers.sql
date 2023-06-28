-- get top articles in the field

with citation_counts as (
  select
    ref_id as merged_id,
    count(distinct(merged_id)) as num_citations
  from gcp_cset_links_v2.paper_references_merged group by ref_id
),

paper_relevance as (
  select
    corpus_merged.merged_id,
    id,
    corpus_merged.year,
    num_citations as citations,
    coalesce(corpus_merged.title_english, corpus_merged.title_foreign) as title,
    concat("https://doi.org/", doi) as link
  from gcp_cset_links_v2.corpus_merged
  inner join
    (select
      id,
      meta.merged_id as merged_id
      from staging_github_metrics.website_stats cross join unnest(paper_meta) as meta)
    using (merged_id)
  inner join citation_counts
    using (merged_id)
  left join (
      select
        merged_id,
        title,
        min(clean_doi) as doi
      from gcp_cset_links_v2.all_metadata_with_cld2_lid
      inner join gcp_cset_links_v2.article_links
        on all_metadata_with_cld2_lid.id = article_links.orig_id
      group by merged_id, title
    ) as dois_data
    on
      (
        (
          (dois_data.title = corpus_merged.title_english) or (dois_data.title = corpus_merged.title_foreign)
        ) and dois_data.merged_id = corpus_merged.merged_id
      )
),

arxiv_links as (
  select

    merged_id,
    concat("https://arxiv.org/abs/", orig_id) as arxiv_link

  from paper_relevance inner join gcp_cset_links_v2.article_links_with_dataset using (merged_id) where dataset = "arxiv"
),

-- hacky deduplication that will work until linkage updates
deduplicated_articles as (
  select
    title,
    id,
    max(coalesce(link, arxiv_link)) as link,
    min(year) as year,
    max(citations) as citations,
    max(source_name) as source
  from
    paper_relevance
  left join
    arxiv_links
    using (merged_id)
  left join
    gcp_cset_links_v2.paper_sources_merged
    using (merged_id)
  group by title, id
)

select
  id,
  struct(
    array_agg(struct(title, link, year, citations, source) order by citations desc limit 10) as articles
  ) as articles
from
  deduplicated_articles
where year >= 2010
group by id
