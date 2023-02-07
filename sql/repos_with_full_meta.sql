-- grab fields from repos_with_full_meta_raw, which comes from the scraper scripts, most likely to be relevant
with contributor_counts as (
  select
    repo_id,
    count(distinct(contributor_name)) as num_contributors
  from
    staging_github_metrics.push_event_commits
  group by repo_id
)

select
  owner_name,
  repo_name as matched_name,
  full_metadata.name as current_name,
  used_by,
  num_commits,
  readme_text,
  full_metadata.network_count as network_count,
  full_metadata.forks_count as forks_count,
  full_metadata.allow_forking as allow_forking,
  full_metadata.open_issues_count as open_issues_count,
  full_metadata.disabled as disabled,
  full_metadata.has_wiki as has_wiki,
  full_metadata.has_projects as has_projects,
  full_metadata.language as primary_programming_language,
  full_metadata.topics as topics,
  full_metadata.stargazers_count as stargazers_count,
  full_metadata.subscribers_count as subscribers_count,
  full_metadata.updated_at as updated_at,
  full_metadata.id as id,
  full_metadata.has_pages as has_pages,
  full_metadata.license as license,
  full_metadata.size as size,
  full_metadata.created_at as created_at,
  full_metadata.archived as archived,
  full_metadata.open_issues as open_issues,
  full_metadata.default_branch as default_branch,
  full_metadata.fork as fork,
  full_metadata.is_template as is_template,
  full_metadata.description as description,
  full_metadata.pushed_at as pushed_at,
  full_metadata.node_id as node_id,
  full_metadata.has_issues as has_issues,
  sources,
  num_releases,
  contributor_counts.num_contributors,
  if(full_metadata.homepage = "", null, full_metadata.homepage) as homepage,
  struct(full_metadata.parent.owner.login as owner_name,
    full_metadata.parent.name as repo_name) as fork_of,
  struct(full_metadata.source.owner.login as owner_name,
    full_metadata.source.name as repo_name) as ultimate_fork_of
from
  staging_github_metrics.repos_with_full_meta_raw
left join
  contributor_counts
  on
    full_metadata.id = contributor_counts.repo_id
where
  (full_metadata.stargazers_count is not null) and (full_metadata.size > 0)
