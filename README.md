# github-metrics

This repository contains code that aggregates metadata related to GitHub repositories of interest. It is under
active development and subject to change.

Eventually this will all be wrapped up into a pipeline, but at the moment the sequence of scripts is as follows:

* Run `sql/repos_in_papers.sql` to aggregate github references that appear in papers
* `export GITHUB_ACCESS_TOKEN=your access token`
* `export GITHUB_USER=your username`
* Run `PYTHONPATH='.' python3 scripts/retrieve_repos.py --query_bq --query_topics`
*
