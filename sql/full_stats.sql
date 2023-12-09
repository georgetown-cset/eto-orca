with citing_articles as (
  select
    id,
    array_agg(
      struct(
        cset_id,
        arxiv_ids,
        papers_with_code_ids,
        openalex_ids,
        semantic_scholar_ids,
        title,
        link,
        year,
        citations,
        source
      ) order by citations desc
    ) as articles
  from
    {{ staging_dataset }}.top_cited_repo_citers
  where
    array_length(
      arxiv_ids
    ) > 0 or array_length(
      papers_with_code_ids
    ) > 0 or array_length(openalex_ids) > 0 or array_length(semantic_scholar_ids) > 0
  group by id
)


select
  stats_unfilt.*,
  articles
from
  {{ staging_dataset }}.stats_unfilt
left join
  citing_articles
  using (id)
