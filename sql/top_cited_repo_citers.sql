-- get top articles in the field

with citation_counts as (
  select
    ref_id as merged_id,
    count(distinct(merged_id)) as num_citations
  from literature.references group by ref_id
),

paper_relevance as (
  select distinct
    papers.merged_id,
    id,
    papers.year,
    num_citations as citations,
    coalesce(papers.title_english, papers.title_foreign) as title,
    concat("https://doi.org/", doi) as link
  from literature.papers
  inner join
    (select
      repo,
      merged_id
      from {{ staging_dataset }}.repos_in_papers cross join unnest(merged_ids) as merged_id)
    using (merged_id)
  inner join
    (select
      concat(owner_name, "/", repo_name) as repo,
      full_metadata.id
      from
        {{ staging_dataset }}.repos_with_full_meta_raw)
    using (repo)
  inner join citation_counts
    using (merged_id)
  left join (
      select
        merged_id,
        title,
        min(clean_doi) as doi
      from staging_literature.all_metadata_with_cld2_lid
      inner join literature.sources
        on all_metadata_with_cld2_lid.id = sources.orig_id
      group by merged_id, title
    ) as dois_data
    on
      (
        (
          (dois_data.title = papers.title_english) or (dois_data.title = papers.title_foreign)
        ) and dois_data.merged_id = papers.merged_id
      )
),

arxiv_links as (
  select

    merged_id,
    concat("https://arxiv.org/abs/", orig_id) as arxiv_link

  from paper_relevance inner join literature.sources using (merged_id) where dataset = "arxiv"
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
    literature.venues
    using (merged_id)
  group by title, id
)

select
  id,
  array_agg(struct(title, link, year, citations, source) order by citations desc limit 10) as articles
from
  deduplicated_articles
where year >= 2010
group by id
