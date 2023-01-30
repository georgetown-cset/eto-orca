-- clean up repo_owners metadata
SELECT
  login,
  name,
  id,
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
