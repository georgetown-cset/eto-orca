import argparse
import json
import os
import re
import requests

from google.cloud import bigquery
from itertools import chain
from typing import Generator


def read_awesome_ml_repos() -> Generator:
    read_toc = False
    curr_language, curr_category, curr_repo = None, None, None
    readme_content = requests.get("https://raw.githubusercontent.com/josephmisiti/"
                                  "awesome-machine-learning/master/README.md")
    for line in readme_content.text.splitlines():
        read_toc |= line.strip() == "<!-- /MarkdownTOC -->"
        if not read_toc:
            continue
        if curr_repo and (line.startswith("##") or line.startswith("*") or (len(line.strip()) == 0)):
            is_deprecated = "**[Deprecated]**" in curr_repo
            record = parse_awesome_ml_line(curr_repo)
            if record:
                record["is_deprecated"] = is_deprecated
                yield record
            curr_repo = None
        if line.startswith("## "):
            curr_language = re.search(r"^##\s+(.*)\s*", line).group(1).strip()
        elif line.startswith("#### "):
            curr_category = re.search(r"^####\s+(.*)\s*", line).group(1).strip()
        elif line.startswith("* "):
            curr_repo = line.strip()
        elif curr_repo and (len(line.strip()) > 0) and not ("<a" in line):
            curr_repo += " "+line.strip()


def parse_awesome_ml_line(line: str) -> dict:
    match = re.search(r"^\* \[([^\]]+)\]\(([^\)]+)\) ?-? ?(.*)", line)
    if not match:
        print("Could not parse: "+line)
        return
    url = match.group(2)
    org_name, repo_name, clean_url = get_owner_and_repo(url)
    return {
        "url": clean_url,
        "repo_name": repo_name,
        "owner_name": org_name,
        "source": "awesome-machine-learning"
    }


def get_owner_and_repo(github_url: str):
    url_match = re.search(r"(?i)github.com/([A-Za-z0-9-_.]+)/([A-Za-z0-9-_]+)", github_url)
    if url_match:
        owner_name = url_match.group(1)
        repo_name = url_match.group(2)
        return owner_name, repo_name, f"github.com/{owner_name}/{repo_name}"
    else:
        print(f"Not a github url: {github_url}")
        return None, None, None


def read_awesome_prod_ml_repos() -> Generator:
    passed_intro = False
    readme_content = requests.get("https://raw.githubusercontent.com/EthicalML/"
                                  "awesome-production-machine-learning/master/README.md")
    for line in readme_content.text.splitlines():
        passed_intro |= line.strip() == "# Main Content"
        if not passed_intro:
            continue
        if line.startswith("* "):
            match = re.search(r"^\* \[([^\]]+)\]\(([^\)]+)\) ?(!\[\]\(([^\)]+)\))? ?-? ?(.*)", line)
            if not match:
                print("Could not parse: "+line)
            url = match.group(2)
            star_url = match.group(4)
            if star_url and "github.com" not in url:
                # e.g., (https://img.shields.io/github/stars/apache/airflow.svg?style=social
                url_parts = star_url.replace(".svg?style=social", "").split("/")
                url = f"https://github.com/{url_parts[5]}/{url_parts[6]}"
            org_name, repo_name, clean_url = get_owner_and_repo(url)
            yield {
                "url": clean_url,
                "repo_name": repo_name,
                "owner_name": org_name,
                "source": "awesome-production-machine-learning"
            }


def read_bq_repos() -> Generator:
    client = bigquery.Client()
    query_job = client.query(f"SELECT repo, datasets, merged_ids from github_metrics.repos_in_papers")
    results = query_job.result()
    for row in results:
        for dataset in row["datasets"]:
            org_name, repo_name, clean_url = get_owner_and_repo(row["repo"])
            yield {
                "url": clean_url,
                "repo_name": repo_name,
                "owner_name": org_name,
                "source": dataset
            }


def read_manually_collected_repos(links_path: str) -> Generator:
    with open(links_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            org_name, repo_name, clean_url = get_owner_and_repo(line)
            yield {
                "url": clean_url,
                "repo_name": repo_name,
                "owner_name": org_name,
                "source": "manual-collection"
            }


def read_topic_repos(topics_path: str) -> Generator:
   yield


def get_repos(query_bq: bool, output_fi: str, access_token: str = None,
              manually_collected_path: str = os.path.join("input_data", "manually_collected_links.txt"),
              topics_path: str = os.path.join("input_data", "topics.txt")) -> None:
    awesome_ml = read_awesome_ml_repos()
    awesome_prod_ml = read_awesome_prod_ml_repos()
    bq_repos = [] if not query_bq else read_bq_repos()
    manually_collected = read_manually_collected_repos(manually_collected_path)
    topic = read_topic_repos(topics_path)
    with open(output_fi, mode="w") as f:
        for repo in chain(bq_repos, manually_collected, topic, awesome_ml, awesome_prod_ml):
            if repo:
                f.write(json.dumps(repo)+"\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--query_bq", default=False, action="store_true")
    parser.add_argument("--output_fi", default="curr_repos.jsonl")
    args = parser.parse_args()

    get_repos(args.query_bq, args.output_fi)