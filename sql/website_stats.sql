with citing_articles as (
  select
    id,
    array_agg(struct(title, link, year, citations, source) order by citations desc limit 10) as articles
  from
    {{ staging_dataset }}.top_cited_repo_citers
  where year >= 2010
  group by id
)

select
  *,
  articles as top_articles
from
  {{ staging_dataset }}.stats_unfilt
left join
  citing_articles
  using (id)
where
  (concat(
      owner_name, "/", current_name
    ) in (
      select repo from {{ staging_dataset }}.curated_repos
    )
    or (
      (
        stargazers_count >= 10
      ) and (
        array_length(paper_meta) > 1
      )))
