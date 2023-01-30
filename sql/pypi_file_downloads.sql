-- get yearly pypi download counts by country
with yearly_events as (
  select
    country_code,
    project,
    extract(year from timestamp) as year
  from `bigquery-public-data.pypi.file_downloads` where date(timestamp) >= "2017-01-01"  --noqa: L057
)

select
  project,
  country_code,
  year,
  count(*) as num_downloads
from yearly_events
group by project, country_code, year
