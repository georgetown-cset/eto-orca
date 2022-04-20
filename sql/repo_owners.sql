-- removes cruft from repo_owners_raw (like various trivially constructed urls) and coalesces
-- some fields that are similar between users and orgs
SELECT
  login,
  name,
  id AS github_id,
  location,
  type,
  public_gists AS public_gists_count,
  hireable,
  followers AS followers_count,
  `following` AS following_count,
  company,
  site_admin,
  email,
  twitter_username,
  is_verified,
  has_organization_projects,
  has_repository_projects,
  created_at,
  updated_at,
  coalesce(description,
    bio) AS description,
  if(blog = "", NULL, blog) AS blog
FROM
  staging_github_metrics.repo_owners_raw
