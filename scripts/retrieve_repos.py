import argparse
import json
import os
import re
from itertools import chain
from typing import Generator

import requests
from google.cloud import bigquery


def get_repo_record(github_url: str):
    url_match = re.search(
        r"(?i)github.com/([A-Za-z0-9-_.]+)/([A-Za-z0-9-_]+)", github_url
    )
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
    manually_collected_path: str = os.path.join(
        "input_data", "manually_collected_links.txt"
    ),
    topics_path: str = os.path.join("input_data", "topics.txt"),
) -> None:
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
