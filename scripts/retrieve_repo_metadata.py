import argparse
import json
import os
import re
import tempfile
from datetime import datetime
from itertools import chain
from typing import Generator

import requests

# from airflow.contrib.hooks.gcs_hook import GoogleCloudStorageHook
# from airflow.hooks.base_hook import BaseHook
from bs4 import BeautifulSoup
from google.cloud import bigquery
from ratelimit import limits, sleep_and_retry


def get_repos(input_fi: str, output_fi: str) -> None:
    out = open(output_fi, mode="w")
    with open(input_fi) as f:
        for line in f:
            js = json.loads(line)
            scraped_meta = get_scraped_meta(
                js["url"], js["owner_name"], js["repo_name"]
            )
            filt_meta = get_filtered_repo_metadata(scraped_meta)
            out.write(json.dumps(filt_meta) + "\n")
    out.close()


@sleep_and_retry
@limits(calls=1, period=5)
def get_scraped_meta(repo_id, owner_name, repo_name):
    try:
        print(f"https://github.com/{owner_name}/{repo_name}")
        repo_homepage = requests.get(f"https://github.com/{owner_name}/{repo_name}")
        soup = BeautifulSoup(repo_homepage.text, features="html.parser")
        spans = soup.find_all("span")
        commit_spans = [s for s in spans if "Commits on" in s.get("aria-label", "")]
        if len(commit_spans) != 1:
            print(f"Unexpected number of commit spans ({len(commit_spans)})")
            num_commits = None
        else:
            num_commits = clean_num(commit_spans[0].parent.find("strong").text)
        topics = [
            elt.text.strip() for elt in soup.find_all("a", {"class": "topic-tag"})
        ]
        links = soup.find_all("a")
        used_by, num_releases, num_contributors = 0, 0, 1
        for link in links:
            if (
                ("Used by" in link.text)
                and link.find("span")
                and link.find("span").get("title")
            ):
                used_by = clean_num(link.find("span")["title"])
            elif (
                ("Releases" in link.text)
                and link.find("span")
                and link.find("span").get("title")
            ):
                num_releases = clean_num(link.find("span")["title"])
            elif (
                ("Contributors" in link.text)
                and link.find("span")
                and link.find("span").get("title")
            ):
                num_contributors = clean_num(link.find("span")["title"])
        scraped_meta = {
            "repo_id": repo_id,
            "commits_count": num_commits,
            "topics": topics,
            "used_by_count": used_by,
            "releases_count": num_releases,
            "contributors_count": num_contributors,
            "snapshot_date": datetime.now().strftime("%Y-%m-%d"),
        }
        return scraped_meta
    except Exception as e:
        print(e)
        return {
            "repo_id": repo_id,
            "snapshot_date": datetime.now().strftime("%Y-%m-%d"),
        }


def clean_num(n: str) -> int:
    return int(n.strip("+").replace(",", ""))


def get_filtered_repo_metadata(meta: dict) -> dict:
    return {
        k: v
        for k, v in meta.items()
        if k
        in {
            "repo_id",
            "stargazers_count",
            "forks_count",
            "open_issues_count",
            "subscribers_count",
            "commits_count",
            "topics",
            "used_by_count",
            "releases_count",
            "contributors_count",
            "snapshot_date",
        }
    }


@sleep_and_retry
@limits(calls=5000, period=60 * 60)
def get_repo_metadata(repo_owner: str, repo_name: str, access_token: str) -> dict:
    access_token = (
        access_token if access_token else os.environ.get("GITHUB_ACCESS_TOKEN")
    )
    headers = {"Authorization": "token " + access_token}
    repo_meta = requests.get(
        f"https://api.github.com/repos/{repo_owner}/{repo_name}", headers=headers
    )
    if repo_meta.status_code == 200:
        return repo_meta.json()
    print(f"No metadata available for {repo_owner}/{repo_name}")
    return None


@sleep_and_retry
@limits(calls=1, period=5)
def get_repo_dependencies(repo_owner: str, repo_name: str) -> list:
    main_branch_names = ["main", "master"]
    dependencies = []
    for name in main_branch_names:
        repo_page = requests.get(
            f"https://github.com/{repo_owner}/{repo_name}/blob/{name}/requirements.txt"
        )
        if repo_page.status_code == 200:
            soup = BeautifulSoup(repo_page.text, features="html.parser")
            req_table = soup.find("table", {"class": "js-file-line-container"})
            if req_table:
                for row in req_table.find_all("tr"):
                    dep = row.find_all("td")[-1].text
                    dep_match = re.search("^([A-Za-z_0-9-]+)(.*)", dep)
                    if not dep_match:
                        print(f"Could not parse {dep} as a dependency")
                    else:
                        dependencies.append(
                            {
                                "library": dep_match.group(1),
                                "version": dep_match.group(2),
                            }
                        )
            else:
                print(
                    f"Could not read dependencies for https://github.com/{repo_owner}/{repo_name}"
                )
    return dependencies


# def airflow_runner(
#    bucket, gcs_manually_collected_path, output_tmp_dir, output_backup_dir
# ) -> None:
#    with tempfile.TemporaryDirectory() as td:
#        data_dir = os.path.join(td, "data")
#        os.mkdir(data_dir)
#        access_token = BaseHook.get_connection("fields-of-study").password
#        gcs_hook = GoogleCloudStorageHook()
#        manually_collected_path = os.path.join(
#            data_dir, "manually_collected_links.jsonl"
#        )
#        gcs_hook.download(bucket, gcs_manually_collected_path, manually_collected_path)
#        get_repos(
#            True,
#            data_dir,
#            access_token=access_token,
#            manually_collected_path=manually_collected_path,
#        )
#        curr_date = datetime.now().strftime("%Y-%m-%d")
#        for basename in [
#            "repository",
#            "repository-metric-snapshots",
#            "full_gh_repo_metadata",
#        ]:
#            # upload to gcs backup dir
#            gcs_hook.upload(
#                bucket,
#                f"{output_backup_dir}/{basename}_{curr_date}.jsonl",
#                os.path.join(data_dir, f"{basename}.jsonl"),
#            )
#            # upload to tmp dir for import to bq
#            if basename != "full_gh_repo_metadata":
#                gcs_hook.upload(
#                    bucket,
#                    f"{output_tmp_dir}/{basename}.jsonl",
#                    os.path.join(data_dir, f"{basename}.jsonl"),
#                )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("input_repos")
    parser.add_argument("output_fi")
    args = parser.parse_args()

    get_repos(args.input_repos, args.output_fi)
