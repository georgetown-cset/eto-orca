# github-metrics

This repository contains code that aggregates metadata related to GitHub repositories of interest. It is under
active development and subject to change.

Eventually this will all be wrapped up into a pipeline, but at the moment the sequence of scripts is as follows:

* Run `sql/repos_in_papers.sql` to aggregate github references that appear in papers
* `export GITHUB_ACCESS_TOKEN=your access token`
* `export GITHUB_USER=your username`
* Run `PYTHONPATH='.' python3 scripts/retrieve_repos.py --query_bq --query_topics`

At this point, we will have full metadata for repos we retrieved using the github API (i.e. repos retrieved
by topic, at the moment), but not for repos that only appear in papers or other sources. The next script
grabs the default metadata retrieved from the github API for repos that don't already have it

* Run `PYTHONPATH='.' python3 scripts/backfill_top_level_repo_metadata.py`

Now, we are going to scrape some additional metadata from GitHub itself, including text of README.md files
which we can use to do further analysis.

* Run `PYTHONPATH='.' python3 scripts/retrieve_repo_metadata.py curr_repos_filled.jsonl curr_repos_final.jsonl`

In parallel, we will retrieve metadata about the repo "owner"s - github urls are in the form
`github.com/<owner name>/<repo name>` . An owner may be an organization or a user account.

* Run `PYTHONPATH='.' python3 scripts/get_owners.py curr_repos_filled.jsonl repo_owners.jsonl`

Now, it's time to load everything into BigQuery and clean up the table structure:

* `bq load --replace --source_format NEWLINE_DELIMITED_JSON staging_github_metrics.repos_with_full_meta_raw curr_repos_final.jsonl schemas/repos_with_full_meta_raw.json`
* `bq load --replace --source_format NEWLINE_DELIMITED_JSON staging_github_metrics.repo_owners_raw repo_owners.jsonl schemas/repo_owners_raw.json`
* Run the remaining queries in the `sql` directory in the order they appear in `downstream_order.txt`, writing the output to `staging_github_metrics.<query_name>`

Optionally, also run `sql/lexisnexis_repos.sql` to get Lexis-Nexis repository references.

Finally, copy any queries into `github_metrics` and `github_metrics_backups` that already appear there
(or are new and useful to analysts) and use `dataloader/populate_documentation.py` to update table and column descriptions.

### Data provenance

* Total stars - This comes from the GitHub API (see `staging_github_metrics.repos_with_full_meta_raw.full_metadata.stargazers_count`)
* Total watchers - This comes from the GitHub API (see `staging_github_metrics.repos_with_full_meta_raw.full_metadata.subscribers_count`)
* Total contributors - This is scraped by `retrieve_repo_metadata.py` (TODO: maybe retrieve from gh archive)
* Total references - This comes from our scholarly literature (see `paper_meta` in `website_stats.sql`)
* Total open issues - This comes from the GitHub API (see `staging_github_metrics.repos_with_full_meta_raw.full_metadata.open_issues`)
* Created date - This comes from the GitHub API (see `staging_github_metrics.repos_with_full_meta_raw.full_metadata.created_at`)
* Last push date - This comes from the GitHub API (see `staging_github_metrics.repos_with_full_meta_raw.full_metadata.pushed_at`)
* License - This comes from the GitHub API (see `staging_github_metrics.repos_with_full_meta_raw.full_metadata.license.name`)
* Top programming language - This comes from the GitHub API (see `staging_github_metrics.repos_with_full_meta_raw.full_metadata.language`)
* Stars over time - This counts the number of `WatchEvent`s for the project in the githubarchive BQ public dataset. The sum of these counts
may not equal the total stars because users may unstar (or even unstar and re-star!) a repo
* Commits over time - This counts the number of distinct commits based on the unnested commits for `PushEvent`s
in the githubarchive BQ public dataset. See also `push_event_commits.sql`
* Issues over time - This counts the number of opened and closed issues based on `IssuesEvent`s
in the githubarchive BQ public dataset. See also `issue_events.sql`. We determine whether the issue was opened or closed based on the `action`
field
* New versus returning contributors over time - this metric is based on PR events. If a contributor makes their first PR during a given time interval,
we mark them as a new contributor. Otherwise, they are a returning contributor. See combination of `pr_events` in `website_stats.sql`
and `get_new_vs_returning_contributor_counts` in `preprocess_for_website.py`.
* Contributor percentage counts - this metric is based on PR events. For each contributor, we count their number of opened PRs,
then calculate the percentage of PRs submitted by each contributor. See combination of `pr_events` in `website_stats.sql` and
`get_cumulative_contributor_counts` in `preprocess_for_website.py`.
* Code contributions by top 5 countries - This is based on our ability to link contributor names to a single Revelio/LinkedIn profile,
and then pulling the user's country as of the time they made a given contribution. See also `contributor_affiliations.sql`. As
of 2023-01-25, we have just under 19% of contributors in the overall dataset linked to LinkedIn profiles
* Code contributions by top 5 organizations - This is based on our ability to link contributor names to a single Revelio/LinkedIn profile,
and then pulling the user's organization as of the time they made a given contribution. See also `contributor_affiliations.sql`. As
of 2023-01-25, we have just under 19% of contributors in the overall dataset linked to LinkedIn profiles
* Cumulative total of contributions by number of contributors - See the `get_cumulative_contributor_counts` method in `preprocess_for_website.py`. This relies on
* The deps.dev links are added if the repo is present in `bigquery-public-data.deps_dev_v1`
* The pypi downloads over time come from `bigquery-public-data.pypi`
