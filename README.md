# ORCA: Open-source Software Research and Community Activity

This repository contains code related to the ORCA project.

## Running the ORCA web application locally

Navigate to the `github-metrics` subdirectory. If you have not installed
[Gatsby](https://www.gatsbyjs.com/docs/tutorial/getting-started/part-0/), do so, and then run

```
npm install
gatsby clean
gatsby develop
```

## Running data retrieval scripts

To manually run data retrieval scripts, you can:

* Run `sql/repos_in_papers.sql` to aggregate GitHub references that appear in papers. If you do not want to update
the software extrated from scholarly literature, skip this step.

* Prepare your development environment:

```bash
virtualenv venv
. venv/bin/activate
pip install -r requirements.txt
export GITHUB_ACCESS_TOKEN=your access token
export GITHUB_USER=your username
```

* Run `PYTHONPATH='.' python3 scripts/retrieve_repos.py` to retrieve a clean list of software to pull metadata from. You
can run with the `--query_bq` flag to retrieve software that appears in the scholarly literature (if you are a CSET
employee with BigQuery access) or `--query_topics` to retrieve software that matches the GitHub topics that appear in
`input_data/topics.txt`.

* At this point, we will have full metadata for repos we retrieved using the github API (i.e. repos retrieved
by topic, at the moment), but not for repos that only appear in papers or other sources. The next script
grabs the default metadata retrieved from the github API for repos that don't already have it:
`PYTHONPATH='.' python3 scripts/backfill_top_level_repo_data.py`

* Now, we can scrape some additional metadata from GitHub itself, including text of README.md files
which we can use to do further analysis.
Run `PYTHONPATH='.' python3 scripts/retrieve_repo_metadata.py curr_repos_filled.jsonl curr_repos_final.jsonl`

* To prepare data for the web application, load `curr_repos_final.jsonl` in the previous step into BigQuery and run
the sequence of queries in `sequences/downstream_order.txt`. Assuming your dataset in BigQuery is called `orca`, download
the data from
`orca.website_stats` in BigQuery as JSONL,
then run `PYTHONPATH='.' python3 scripts/preprocess_for_website.py`.

These steps are automated and run on a monthly basis on the scholarly literature data using the `orca_data_pipeline.py`
Airflow pipeline.

### Data provenance

* **Total stars** - This comes from the GitHub API (see `staging_github_metrics.repos_with_full_meta_raw.full_metadata.stargazers_count`)
* **Total watchers** - This comes from the GitHub API (see `staging_github_metrics.repos_with_full_meta_raw.full_metadata.subscribers_count`)
* **Total contributors** - This is scraped by `retrieve_repo_metadata.py` (TODO: maybe retrieve from gh archive)
* **Total references** - This comes from our scholarly literature (see `paper_meta` in `website_stats.sql`)
* **Total open issues** - This comes from the GitHub API (see `staging_github_metrics.repos_with_full_meta_raw.full_metadata.open_issues`)
* **Created date** - This comes from the GitHub API (see `staging_github_metrics.repos_with_full_meta_raw.full_metadata.created_at`)
* **Last push date** - This comes from the GitHub API (see `staging_github_metrics.repos_with_full_meta_raw.full_metadata.pushed_at`)
* **License** - This comes from the GitHub API (see `staging_github_metrics.repos_with_full_meta_raw.full_metadata.license.name`)
* **Top programming language** - This comes from the GitHub API (see `staging_github_metrics.repos_with_full_meta_raw.full_metadata.language`)
* **Stars over time** - This counts the number of `WatchEvent`s for the project in the githubarchive BQ public dataset. The sum of these counts
may not equal the total stars because users may unstar (or even unstar and re-star!) a repo
* **Commits over time** - This counts the number of distinct commits based on the unnested commits for `PushEvent`s
in the githubarchive BQ public dataset. See also `push_event_commits.sql`
* **Issues over time** - This counts the number of opened and closed issues based on `IssuesEvent`s
in the githubarchive BQ public dataset. See also `issue_events.sql`. We determine whether the issue was opened or closed based on the `action`
field
* **New versus returning contributors over time** - this metric is based on commits. If a contributor makes their first commit during a given time interval,
we mark them as a new contributor. Otherwise, they are a returning contributor. See combination of `repo_pushes` in `website_stats.sql`
and `get_new_vs_returning_contributor_counts` in `preprocess_for_website.py`.
* **Contribution percentages** - this metric is based on commits. For each contributor, we count their number of commits,
then calculate the percentage of commits written by each contributor. See combination of `repo_pushes` in `website_stats.sql` and
`get_cumulative_contributor_counts` in `preprocess_for_website.py`.
* **Cumulative percentage of contributions by number of contributors** - This metric is based on commits. See description of
Contribution percentages above, and `github-metrics/src/components/summary_panel.js:getContribTrace`
* The deps.dev links are added if the repo is present in `bigquery-public-data.deps_dev_v1`
* The pypi downloads over time come from `bigquery-public-data.pypi`
