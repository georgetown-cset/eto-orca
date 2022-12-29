SELECT
  timestamp,
  country_code,
  project

FROM `bigquery-public-data.pypi.file_downloads` WHERE DATE(timestamp) >= "2017-01-01"  --noqa: L057
