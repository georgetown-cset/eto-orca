import argparse
import json
import os
import re
import time
from itertools import chain
from typing import Generator

import requests
from google.cloud import bigquery

from scripts.github_config import RATE_LIMIT_INTERVAL, mk_auth

"""
Retrieves repos from:

- awesome-machine-learning
- awesome-production-machine-learning
- papers with code
- arxiv fulltext
- cnki fulltext
- merged corpus titles+abstracts
- manually collected list of repos
- manually collected list of topics
"""


class RepoRetriever:
    def __init__(self, is_test=False):
        self.auth = () if is_test else mk_auth()

    def get_repo_record(self, text: str) -> list:
        """
        Parses one or more github urls out of some text, and returns a dict of their components
        :param text: Text that may contain github urls
        :return: A list of dicts of the github urls' components, or None if no repo was found
        """
        url_matches = re.findall(
            r"(?i)github.com/([A-Za-z0-9-_.]+)/([A-Za-z0-9-_]+)", text
        )
        return [
            {
                "url": f"{owner_name}/{repo_name}",
                "repo_name": repo_name,
                "owner_name": owner_name,
            }
            for owner_name, repo_name in url_matches
        ]

    def read_awesome_repos(
        self, url: str, toc_delim: str, source_name: str
    ) -> Generator:
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
            repo_records = self.get_repo_record(line)
            for repo_record in repo_records:
                if line.startswith("*") or re.search(r"^[a-zA-Z0-9[]", line):
                    if not line.startswith("*"):
                        print(f"Unusual line format, but collecting anyway: {line}")
                    repo_record["sources"] = [source_name]
                    yield repo_record
                else:
                    print(f"Repo occurred in unexpected place: {line}")

    def read_bq_repos(self) -> Generator:
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
                repo_records = self.get_repo_record("github.com/" + row["repo"])
                for repo_record in repo_records:
                    repo_record["sources"] = [dataset]
                    yield repo_record

    def read_manually_collected_repos(self, links_path: str) -> Generator:
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
                repo_records = self.get_repo_record(line)
                for repo_record in repo_records:
                    repo_record["sources"] = ["manual-collection"]
                    yield repo_record

    def get_size_partitions(self, topic: str, size_range: list = None) -> list:
        """
        Gets repo size partitions that will allow us to retrieve all repos for a topic
        :param topic: topic to retrieve repos for
        :param size_range: range of sizes (in kb) to include in the query - used to get around the 1000 search result cap
        :return: list of formatted size ranges
        """
        time.sleep(RATE_LIMIT_INTERVAL)
        eleven_gb = 11000000000
        if not size_range:
            gt = self.get_size_partitions(topic, [0, 1000])
            lt = self.get_size_partitions(topic, [1001, eleven_gb])
            return gt + lt
        fmt_size_range = (
            f"{size_range[0]}..{size_range[1]}"
            if size_range[1]
            else f">={size_range[0]}"
        )
        repo_resp = requests.get(
            "https://api.github.com/search/repositories?"
            f"q=topic:{topic} size:{fmt_size_range}&sort=stars&order=desc&per_page=1",
            auth=self.auth,
        )
        repo_resp_js = repo_resp.json()
        if repo_resp_js.get("incomplete_results"):
            print(f"Incomplete results for {topic}, {repo_resp_js['total_count']}")
            return self.get_size_partitions(topic, size_range)
        if "items" not in repo_resp_js:
            print(f"{repo_resp_js}, retrying in 3 seconds")
            time.sleep(3)
            return self.get_size_partitions(topic, size_range)
        result_count = repo_resp_js.get("total_count", eleven_gb)
        if result_count > 1000:
            midpoint = size_range[0] + round((size_range[1] - size_range[0]) / 2)
            gt = self.get_size_partitions(topic, [size_range[0], midpoint])
            lt = self.get_size_partitions(topic, [midpoint + 1, size_range[1]])
            return gt + lt
        elif result_count == 0:
            return []
        return [(fmt_size_range, result_count)]

    def get_topic_page(self, topic: str, size_range: str, page: int = 1) -> list:
        """
        Get a page of topic repos
        :param topic: topic to retrieve repos for
        :param size_range: range of sizes (in kb) to include in the query - used to get around the 1000 search result cap
        :param page: page of topic results to retrieve
        :return: list of repos
        """
        time.sleep(RATE_LIMIT_INTERVAL)
        repo_resp = requests.get(
            "https://api.github.com/search/repositories?"
            f"q=topic:{topic} size:{size_range}&sort=stars&order=desc&page={page}&per_page=100",
            auth=self.auth,
        )
        repo_resp_js = repo_resp.json()
        if repo_resp_js.get("incomplete_results"):
            print(f"Incomplete results for {topic}, {repo_resp_js['total_count']}")
            return self.get_topic_page(topic, size_range, page)
        if "items" not in repo_resp_js:
            print(f"{repo_resp_js}, retrying in 3 seconds")
            time.sleep(3)
            return self.get_topic_page(topic, size_range, page)
        print(
            f"Retrieved {len(repo_resp_js['items'])}/{repo_resp_js['total_count']} repos for page {page} of {topic} "
            f"in size range {size_range}"
        )
        return repo_resp_js["items"]

    def read_topic_repos(self) -> Generator:
        """
        Retrieves all repos matching a github topic
        :return: generator of repo information for this topic
        """
        topics_path = os.path.join("input_data", "topics.txt")
        with open(topics_path) as f:
            for line in f:
                topic = line.strip()
                if not topic:
                    continue
                size_ranges = self.get_size_partitions(topic)
                for size_range, interval_count in size_ranges:
                    page = 1
                    while page <= int(interval_count / 100) + 1:
                        topic_repos = self.get_topic_page(topic, size_range, page)
                        for repo in topic_repos:
                            owner_name, repo_name = repo["full_name"].split("/")
                            yield {
                                "url": f"{owner_name}/{repo_name}",
                                "repo_name": repo_name,
                                "owner_name": owner_name,
                                "sources": [f"topic: {topic}"],
                                "full_metadata": repo,
                            }
                        page += 1

    def get_repos(self, query_bq: bool, query_topics: bool) -> Generator:
        """
        Retrieves repos from various sources and returns a generator of results (some of which are duplicates)
        :param query_bq: If true, will retrieve repos from BQ (takes longer)
        :param query_topics: If true, will retrieve all repos that match a list of topics (takes MUCH longer)
        :return: a generator of dicts of repo information
        """
        manually_collected_path = os.path.join(
            "input_data", "manually_collected_links.txt"
        )
        awesome_ml = self.read_awesome_repos(
            "https://raw.githubusercontent.com/josephmisiti/"
            "awesome-machine-learning/master/README.md",
            "<!-- /MarkdownTOC -->",
            "awesome-machine-learning",
        )
        awesome_prod_ml = self.read_awesome_repos(
            "https://raw.githubusercontent.com/EthicalML/"
            "awesome-production-machine-learning/master/README.md",
            "# Main Content",
            "awesome-production-machine-learning",
        )
        bq_repos = [] if not query_bq else self.read_bq_repos()
        topic_repos = [] if not query_topics else self.read_topic_repos()
        manually_collected = self.read_manually_collected_repos(manually_collected_path)
        return chain(
            bq_repos, topic_repos, manually_collected, awesome_ml, awesome_prod_ml
        )

    def write_repos(self, query_bq: bool, query_topics: bool, output_fi: str) -> None:
        """
        Retrieves repos, deduplicates, and writes out
        :param query_bq: If true, will retrieve repos from BQ (takes longer)
        :param query_topics: If true, will retrieve all repos that match a list of topics (takes MUCH longer)
        :param output_fi: Location where repos should be written
        :return: None
        """
        repos = self.get_repos(query_bq, query_topics)
        with open(output_fi, mode="w") as f:
            repos = [r for r in repos if r and r["url"]]
            repo_to_meta = {}
            for repo in repos:
                url = repo["url"]
                prev_meta = repo_to_meta.get(url)
                if prev_meta and repo["sources"][0] not in prev_meta["sources"]:
                    prev_meta["sources"].extend(repo["sources"])
                    if repo.get("full_metadata"):
                        prev_meta["full_metadata"] = repo["full_metadata"]
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

    retriever = RepoRetriever()
    retriever.write_repos(args.query_bq, args.query_topics, args.output_fi)