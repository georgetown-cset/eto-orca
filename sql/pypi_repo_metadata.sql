with candidate_metadata as (
  select
    name as project,
    summary,
    license,
    download_url,
    github_metrics.get_first_repo_slug(home_page) as repo,
    row_number() over(partition by name order by metadata_version desc, version desc) as meta_rank
  from `bigquery-public-data.pypi.distribution_metadata` --noqa: L057
)

select * except(meta_rank) from candidate_metadata
where
  (
    repo is not null
  )
  -- this appears to be due to project squatting by projects which, if nothing else, are no longer hosted on pypi.
  -- I'm not sure what a more automated method of removing these would be
  and (repo != "torvalds/linux") and (
    repo in (
      select concat(owner_name, "/", full_metadata.name) from staging_github_metrics.repos_with_full_meta_raw_for_app
    )
  )
  and meta_rank = 1
