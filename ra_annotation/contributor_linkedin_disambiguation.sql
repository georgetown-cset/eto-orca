with aggregated_li as (
  select
    trim(contributor_name) as contributor,
    array_agg(
      distinct concat("https://github.com", "/", push_event_commits.owner_name, "/", push_event_commits.repo_name)
    ) as contributed_repos,
    array_agg(distinct user_li_url) as linkedin_urls,
    array_agg(distinct repo_id) as repo_ids,
    -- I dithered about the impact metric - for now I am going with the largest stargazers
    -- count among their contibuted repos. This is going to weight
    -- people who go about making typo contributions to a million repos weirdly but at least
    -- hopefully we'll have a complete accounting of the contributors
    -- to some of the highest-impact repos in the dataset
    max(stargazers_count) as impact_ranking
  from github_metrics.push_event_commits
  left join gcp_cset_revelio.user
    on lower(contributor_name) = lower(concat(firstname, " ", lastname))
  left join github_metrics.repos_with_full_meta
    on repo_id = id
  where user_li_url is not null
  group by contributor
)

select
  contributor,
  contributed_repos,
  linkedin_urls
from aggregated_li
where array_length(linkedin_urls) > 1 order by impact_ranking desc
