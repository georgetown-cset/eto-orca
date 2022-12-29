with most_recent_metadata as (
  select
    name,
    max(version) as version, --noqa: L029
    max(metadata_version) as metadata_version
  from `bigquery-public-data.pypi.distribution_metadata` --noqa: L057
  group by name
),

candidate_metadata as (
  select
    name as project,
    max(summary) as summary,
    max(license) as license,
    max(regexp_extract(home_page, r"(?i)github.com/([A-Za-z0-9-_.]+/[A-Za-z0-9-_.]*[A-Za-z0-9-_])")) as repo,
    max(download_url) as download_url
  from `bigquery-public-data.pypi.distribution_metadata` --noqa: L057
  left join
    most_recent_metadata
    using (name)
  where
    case
      when
        most_recent_metadata.metadata_version is not null then (
          `bigquery-public-data.pypi.distribution_metadata`.metadata_version = --noqa: L057
          most_recent_metadata.metadata_version
        )
      else (`bigquery-public-data.pypi.distribution_metadata`.version = most_recent_metadata.version) --noqa: L057
    end
  -- sometimes metadata has identical metadata_versions and versions but
  -- e.g. the summary is different, so fall back to taking max in these cases
  group by name
)

select * from candidate_metadata
where
  (
    repo is not null
  ) and (repo in (select concat(owner_name, "/", current_name) from github_metrics.repos_with_full_meta))
