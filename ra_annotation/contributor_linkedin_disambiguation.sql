with aggregated_li as (
  select
    trim(contributor_name) as contributor,
    array_agg(
      distinct concat("https://github.com", "/", push_event_commits.owner_name, "/", push_event_commits.repo_name)
    ) as contributed_repos,
    array_agg(distinct user_li_url) as linkedin_urls,
    array_agg(distinct repo_id) as repo_ids
  from github_metrics.push_event_commits
  left join gcp_cset_revelio.user
    on lower(contributor_name) = lower(concat(firstname, " ", lastname))
  where user_li_url is not null
  group by contributor
),

users_with_ranking as (
  select
    contributor,
    sum(stargazers_count) as impact_ranking
  from aggregated_li cross join unnest(repo_ids) as repo_id
  left join github_metrics.repos_with_full_meta
    on repo_id = id
  group by contributor
)

select
  contributor,
  contributed_repos,
  linkedin_urls,
  impact_ranking
from aggregated_li
left join users_with_ranking
  using (contributor)
where array_length(linkedin_urls) > 1 order by impact_ranking desc
