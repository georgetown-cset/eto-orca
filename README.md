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

* `bq load --replace --source_format NEWLINE_DELIMITED_JSON staging_github_metrics.repos_with_full_meta_raw curr_repos_filled_wi_meta_part8.jsonl schemas/repos_with_full_meta_raw.json`
* Run `sql/repos_with_full_meta.sql` and write the output to `github_metrics.repos_with_full_meta`
* Run `sql/events.sql` and write the output to `staging_github_metrics.events`
* Run `sql/push_event_commits.sql` and write the output to `github_metrics.push_event_commits`
* Run `sql/star_events.sql` and write the output to `github_metrics.star_events`
