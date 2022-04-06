import argparse
import json
import os
import re
import time
from itertools import chain
from typing import Generator

import requests
from google.cloud import bigquery
from ratelimit import limits, sleep_and_retry

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
            "url": f"{owner_name}/{repo_name}",
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
            repo_record = get_repo_record("github.com/" + row["repo"])
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


def get_size_partitions(headers: dict, topic: str, size_range: list = None) -> list:
    """
    Gets repo size partitions that will allow us to retrieve all repos for a topic
    :param headers: request headers
    :param topic: topic to retrieve repos for
    :param size_range: range of sizes (in kb) to include in the query - used to get around the 1000 search result cap
    :return: list of formatted size ranges
    """
    if not size_range:
        gt = get_size_partitions(headers, topic, [0, 1000])
        lt = get_size_partitions(headers, topic, [1001, None])
        return gt + lt
    fmt_size_range = (
        f"{size_range[0]}..{size_range[1]}" if size_range[1] else f">={size_range[0]}"
    )
    repo_resp = requests.get(
        "https://api.github.com/search/repositories?"
        f"q=topic:{topic} size:{fmt_size_range}&sort=stars&order=desc&per_page=1",
        headers=headers,
    )
    repo_resp_js = repo_resp.json()
    if repo_resp_js.get("incomplete_results"):
        print(f"Incomplete results for {topic}, {repo_resp_js['total_count']}")
        time.sleep(5)
        return get_size_partitions(headers, topic, size_range)
    if repo_resp_js.get("total_count", 10000000000) > 1000:
        gt = get_size_partitions(
            headers, topic, [size_range[0], round(size_range[1] / 2)]
        )
        lt = get_size_partitions(
            headers, topic, [round(size_range[1] / 2) + 1, size_range[1]]
        )
        return gt + lt
    return [fmt_size_range]


@sleep_and_retry
@limits(calls=5000, period=60 * 60)
def get_topic_page(headers: dict, topic: str, size_range: str, page: int = 1) -> list:
    """
    Get a page of topic repos
    :param headers: request headers
    :param topic: topic to retrieve repos for
    :param size_range: range of sizes (in kb) to include in the query - used to get around the 1000 search result cap
    :param page: page of topic results to retrieve
    :return: list of repos
    """
    repo_resp = requests.get(
        "https://api.github.com/search/repositories?"
        f"q=topic:{topic} size:{size_range}&sort=stars&order=desc&page={page}&per_page=100",
        headers=headers,
    )
    repo_resp_js = repo_resp.json()
    if repo_resp_js.get("incomplete_results"):
        print(f"Incomplete results for {topic}, {repo_resp_js['total_count']}")
        time.sleep(10)
        return get_topic_page(headers, topic, size_range, page)
    if "items" not in repo_resp_js:
        print(repo_resp_js)
    if page == 1:
        print(
            f"Retrieving {repo_resp_js['total_count']} repos for page {page} of {topic} in size range {size_range}"
        )
    return repo_resp_js["items"]


def read_topic_repos() -> Generator:
    """
    Retrieves all repos matching a github topic
    :return: generator of repo information for this topic
    """
    gh_tok = os.environ.get("GITHUB_ACCESS_TOKEN")
    assert gh_tok, "Please set the GITHUB_ACCESS_TOKEN environment variable"
    headers = {"Authorization": f"token {gh_tok}"}
    topics_path = os.path.join("input_data", "topics.txt")
    with open(topics_path) as f:
        for line in f:
            topic = line.strip()
            if not topic:
                continue
            page = 1
            size_ranges = get_size_partitions(headers, topic)
            for size_range in size_ranges:
                topic_repos = get_topic_page(headers, topic, size_range, page)
                while len(topic_repos):
                    for repo in topic_repos:
                        owner_name, repo_name = repo["full_name"].split("/")
                        yield {
                            "url": f"{owner_name}/{repo_name}",
                            "repo_name": repo_name,
                            "owner_name": owner_name,
                            "sources": [f"topic: {topic}"],
                        }
                    page += 1
                    topic_repos = get_topic_page(headers, topic, size_range, page)


def get_repos(query_bq: bool, query_topics: bool) -> Generator:
    """
    Retrieves repos from various sources and returns a generator of results (some of which are duplicates)
    :param query_bq: If true, will retrieve repos from BQ (takes longer)
    :param query_topics: If true, will retrieve all repos that match a list of topics (takes MUCH longer)
    :return: a generator of dicts of repo information
    """
    manually_collected_path = os.path.join("input_data", "manually_collected_links.txt")
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
    topic_repos = [] if not query_topics else read_topic_repos()
    manually_collected = read_manually_collected_repos(manually_collected_path)
    return chain(bq_repos, topic_repos, manually_collected, awesome_ml, awesome_prod_ml)


def write_repos(query_bq: bool, query_topics: bool, output_fi: str) -> None:
    """
    Retrieves repos, deduplicates, and writes out
    :param query_bq: If true, will retrieve repos from BQ (takes longer)
    :param query_topics: If true, will retrieve all repos that match a list of topics (takes MUCH longer)
    :param output_fi: Location where repos should be written
    :return: None
    """
    repos = get_repos(query_bq, query_topics)
    with open(output_fi, mode="w") as f:
        repos = [r for r in repos if r and r["url"]]
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
    parser.add_argument("--query_topics", default=False, action="store_true")
    parser.add_argument("--output_fi", default="curr_repos.jsonl")
    args = parser.parse_args()

    write_repos(args.query_bq, args.query_topics, args.output_fi)
