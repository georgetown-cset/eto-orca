import argparse
import json
import os
import re
from itertools import chain
from typing import Generator

import requests
from google.cloud import bigquery

"""
Retrieves repos from:

- awesome-machine-learning
- awesome-production-machine-learning
- papers with code
- arxiv fulltext
- cnki fulltext
- manually collected list of repos
- manually collected list of topics

Todo:
- add repos from title/abstract search
- implement repo retrieval from topic
- pull all repos in line
"""


def get_repo_record(text: str) -> dict:
    """
    Parses a github url out of some text, and returns a dict of its components
    :param text: Text that may contain a github url
    :return: A dict of the github url's components, or None if no repo was found
    """
    url_match = re.search(r"(?i)github.com/([A-Za-z0-9-_.]+)/([A-Za-z0-9-_]+)", text)
    if url_match:
        owner_name = url_match.group(1)
        repo_name = url_match.group(2)
        return {
            "url": f"github.com/{owner_name}/{repo_name}",
            "repo_name": repo_name,
            "owner_name": owner_name,
        }
    else:
        return None


def read_awesome_repos(url: str, toc_delim: str, source_name: str) -> Generator:
    """
    Retrieve repos mentioned in an "awesome-" aggregator repo readme
    :param url: URL of the readme
    :param toc_delim: Delimiter that indicates the end of the table of contents
    :param source_name: name of the aggregator repo
    :return: a generator containing dicts of information from get_repo_record, plus the source name, for each repo
    """
    read_toc = False
    readme_content = requests.get(url)
    for line in readme_content.text.splitlines():
        line = line.strip()
        read_toc |= line == toc_delim
        if not read_toc:
            continue
        repo_record = get_repo_record(line)
        if repo_record:
            if line.startswith("*") or re.search(r"^[a-zA-Z0-9[]", line):
                if not line.startswith("*"):
                    print(f"Unusual line format, but collecting anyway: {line}")
                repo_record["sources"] = [source_name]
                yield repo_record
            else:
                print(f"Repo occurred in unexpected place: {line}")


def read_bq_repos() -> Generator:
    """
    Retrieves repos pulled from our scholarly literature - see sql/repos_in_papers.sql for table definition
    :return: a generator of information from get_repo_record, plus the dataset name, for each repo
    """
    client = bigquery.Client()
    query_job = client.query(
        "SELECT repo, datasets, merged_ids from github_metrics.repos_in_papers"
    )
    results = query_job.result()
    for row in results:
        for dataset in row["datasets"]:
            repo_record = get_repo_record(row["repo"])
            repo_record["sources"] = [dataset]
            yield repo_record


def read_manually_collected_repos(links_path: str) -> Generator:
    """
    Retrieves repos that were manually collected into a file at `links_path`
    :param links_path: Location of manually collected repos
    :return: a generator of information from get_repo_record, plus the source name, for each repo
    """
    with open(links_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            repo_record = get_repo_record(line)
            repo_record["sources"] = ["manual-collection"]
            yield repo_record


def read_topic_repos(topics_path: str) -> Generator:
    yield


def get_repos(
    query_bq: bool,
    output_fi: str,
    access_token: str = None,
) -> None:
    """
    Aggregates repos from multiple sources, and deduplicates
    :param query_bq: If true, will retrieve repos from BQ (takes longer)
    :param output_fi: Location where repos should be written
    :param access_token: Github access token
    :return:
    """
    manually_collected_path = os.path.join("input_data", "manually_collected_links.txt")
    topics_path = os.path.join("input_data", "topics.txt")
    awesome_ml = read_awesome_repos(
        "https://raw.githubusercontent.com/josephmisiti/"
        "awesome-machine-learning/master/README.md",
        "<!-- /MarkdownTOC -->",
        "awesome-machine-learning",
    )
    awesome_prod_ml = read_awesome_repos(
        "https://raw.githubusercontent.com/EthicalML/"
        "awesome-production-machine-learning/master/README.md",
        "# Main Content",
        "awesome-production-machine-learning",
    )
    bq_repos = [] if not query_bq else read_bq_repos()
    manually_collected = read_manually_collected_repos(manually_collected_path)
    topic = read_topic_repos(topics_path)
    with open(output_fi, mode="w") as f:
        repos = [
            r
            for r in chain(
                bq_repos, manually_collected, topic, awesome_ml, awesome_prod_ml
            )
            if r and r["url"]
        ]
        repo_to_meta = {}
        for repo in repos:
            url = repo["url"]
            prev_meta = repo_to_meta.get(url)
            if prev_meta and repo["sources"][0] not in prev_meta["sources"]:
                prev_meta["sources"].extend(repo["sources"])
            else:
                repo_to_meta[url] = repo
        for repo in repo_to_meta:
            f.write(json.dumps(repo_to_meta[repo]) + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--query_bq", default=False, action="store_true")
    parser.add_argument("--output_fi", default="curr_repos.jsonl")
    args = parser.parse_args()

    get_repos(args.query_bq, args.output_fi)
