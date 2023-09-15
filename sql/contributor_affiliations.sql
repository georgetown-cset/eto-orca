-- attempts to map contributors to their linkedin profiles, either by using their names alone if there is only
-- one linkedin profile by that name, or by using profiles manually identified by student RAs

-- map committer names to their contributed repos and linkedin urls for people with that name. Note, this approach is
-- very imperfect as OSS contributors do not have unique names
with aggregated_li as (
  select
    trim(contributor_name) as contributor,
    array_agg(
      distinct repo_id
    ) as contributed_repos,
    array_agg(distinct user_li_url) as linkedin_urls
  from {{ staging_dataset }}.push_event_commits
  left join gcp_cset_revelio.user
    on lower(contributor_name) = lower(concat(firstname, " ", lastname))
  left join {{ staging_dataset }}.repos_with_full_meta
    on repo_id = id
  where user_li_url is not null
  group by contributor
),

-- create a table of unambiguous contributor-linkedin url mappings - either because we only found one linkedin url
-- in revelio for someone with that name, or because annotators found a single linkedin url for the contributor
contributor_mapping as (
  select
    contributor,
    contributed_repos,
    linkedin_urls[offset(0)] as linkedin_url
  from aggregated_li
  where array_length(linkedin_urls) = 1
  union all
  select
    contributor,
    aggregated_li.contributed_repos,
    linkedin_url
  from
    aggregated_li
  left join
    {{ production_dataset }}.li_annotation_data_20230104
    using (contributor)
  where contributor not in
    (select contributor from aggregated_li where array_length(linkedin_urls) = 1)
    and linkedin_url is not null
)

select
  user_id,
  contributor,
  contributed_repos,
  linkedin_url,
  position.country,
  coalesce(company, company_raw) as company,
  extract(year from startdate) as startyear,
  extract(year from enddate) as endyear
from contributor_mapping
inner join
  gcp_cset_revelio.user
  on linkedin_url = user_li_url
inner join
  gcp_cset_revelio.position
  using (user_id)
