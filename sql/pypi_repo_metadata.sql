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
  and meta_rank = 1
