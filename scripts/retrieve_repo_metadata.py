import argparse
import json
import os
import re
import requests
import tempfile

from airflow.contrib.hooks.gcs_hook import GoogleCloudStorageHook
from airflow.hooks.base_hook import BaseHook
from bs4 import BeautifulSoup
from datetime import datetime
from google.cloud import bigquery
from itertools import chain
from ratelimit import limits, sleep_and_retry
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
            record = parse_awesome_ml_line(curr_repo, curr_language, curr_category)
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


def parse_awesome_ml_line(line: str, language: str, category: str) -> dict:
    match = re.search(r"^\* \[([^\]]+)\]\(([^\)]+)\) ?-? ?(.*)", line)
    if not match:
        print("Could not parse: "+line)
        return
    name = match.group(1)
    url = match.group(2)
    description = match.group(3)
    org_name, repo_name = get_owner_and_repo(url)
    return {
        "url": url,
        "project_name": name,
        "repo_name": repo_name,
        "owner_name": org_name,
        "category": [category],
        "description": description,
        "language": language,
        "source": "awesome-machine-learning"
    }


def get_owner_and_repo(github_url: str):
    if "github.com" in github_url:
        url_match = re.search(r"^https?:\/\/github.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)", github_url)
        if url_match:
            return url_match.group(1), url_match.group(2)
    print(f"Not a github url: {github_url}")
    return None, None


def read_awesome_prod_ml_repos() -> Generator:
    passed_intro = False
    category = None
    readme_content = requests.get("https://raw.githubusercontent.com/EthicalML/"
                                  "awesome-production-machine-learning/master/README.md")
    for line in readme_content.text.splitlines():
        passed_intro |= line.strip() == "# Main Content"
        if not passed_intro:
            continue
        if line.startswith("## "):
            category = line.replace("## ", "").strip()
        elif line.startswith("* "):
            match = re.search(r"^\* \[([^\]]+)\]\(([^\)]+)\) ?(!\[\]\(([^\)]+)\))? ?-? ?(.*)", line)
            if not match:
                print("Could not parse: "+line)
            name = match.group(1)
            url = match.group(2)
            star_url = match.group(4)
            if star_url and "github.com" not in url:
                # e.g., (https://img.shields.io/github/stars/apache/airflow.svg?style=social
                url_parts = star_url.replace(".svg?style=social", "").split("/")
                url = f"https://github.com/{url_parts[5]}/{url_parts[6]}"
            description = match.group(5)
            org_name, repo_name = get_owner_and_repo(url)
            yield {
                "url": url,
                "project_name": name,
                "repo_name": repo_name,
                "owner_name": org_name,
                "category": [category],
                "description": description,
                "source": "awesome-production-machine-learning"
            }


def read_pwc_repos() -> Generator:
    client = bigquery.Client()
    query_job = client.query(f"SELECT distinct repo_url from papers_with_code.links_between_papers_and_code")
    results = query_job.result()
    for row in results:
        org_name, repo_name = get_owner_and_repo(row["repo_url"])
        yield {
            "url": row["repo_url"],
            "repo_name": repo_name,
            "owner_name": org_name,
            "source": "papers-with-code"
        }


def read_manually_collected_repos(links_path: str) -> Generator:
    with open(links_path) as f:
        for line in f:
            js = json.loads(line)
            org_name, repo_name = get_owner_and_repo(js["github_url"])
            yield {
                "url": js["github_url"],
                "repo_name": repo_name,
                "owner_name": org_name,
                "project_name": js["project_name"],
                "source": "manual-collection"
            }


def get_repos(query_pwc: bool, output_dir: str, access_token: str = None,
              manually_collected_path: str = os.path.join("data", "manually_collected_links.jsonl")) -> None:
    gh_repo_meta = open(os.path.join(output_dir, "full_gh_repo_metadata.jsonl"), mode="w")
    filt_gh_repo_meta = open(os.path.join(output_dir, "repository-metric-snapshots.jsonl"), mode="w")
    listing_meta = open(os.path.join(output_dir, "repository.jsonl"), mode="w")
    awesome_ml = read_awesome_ml_repos()
    awesome_prod_ml = read_awesome_prod_ml_repos()
    bq_repos = [] if not query_pwc else read_pwc_repos()
    manually_collected = read_manually_collected_repos(manually_collected_path)
    for project in chain(bq_repos, manually_collected, awesome_ml, awesome_prod_ml):
        if project["repo_name"]:
            meta = get_repo_metadata(project["owner_name"], project["repo_name"], access_token)
            if meta:
                project["repo_id"] = meta["id"]
                scraped_meta = get_scraped_meta(project["repo_id"], project["owner_name"], project["repo_name"])
                meta.update({k: v for k, v in scraped_meta.items() if k != "topics"})
                project["topics"] = scraped_meta["topics"]
                gh_repo_meta.write(json.dumps(meta)+"\n")
                filt_meta = get_filtered_repo_metadata(meta)
                filt_gh_repo_meta.write(json.dumps(filt_meta)+"\n")
                if (not project.get("language")) or (project["language"].lower().strip() == "python"):
                    deps = get_repo_dependencies(project["owner_name"], project["repo_name"])
                    if deps:
                        project["dependencies"] = deps
        listing_meta.write(json.dumps(project)+"\n")
    gh_repo_meta.close()
    listing_meta.close()


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
        topics = [elt.text.strip() for elt in soup.find_all("a", {"class": "topic-tag"})]
        links = soup.find_all("a")
        used_by, num_releases, num_contributors = 0, 0, 1
        for link in links:
            if ("Used by" in link.text) and link.find("span") and link.find("span").get("title"):
                used_by = clean_num(link.find("span")["title"])
            elif ("Releases" in link.text) and link.find("span") and link.find("span").get("title"):
                num_releases = clean_num(link.find("span")["title"])
            elif ("Contributors" in link.text) and link.find("span") and link.find("span").get("title"):
                num_contributors = clean_num(link.find("span")["title"])
        scraped_meta = {
            "repo_id": repo_id,
            "commits_count": num_commits,
            "topics": topics,
            "used_by_count": used_by,
            "releases_count": num_releases,
            "contributors_count": num_contributors,
            "snapshot_date": datetime.now().strftime("%Y-%m-%d")
        }
        return scraped_meta
    except Exception as e:
        print(e)
        return {
            "repo_id": repo_id,
            "snapshot_date": datetime.now().strftime("%Y-%m-%d")
        }


def clean_num(n: str) -> int:
    return int(n.strip("+").replace(",", ""))


def get_filtered_repo_metadata(meta: dict) -> dict:
    return {k:v for k,v in meta.items() if k in {
        "repo_id", "stargazers_count", "forks_count", "open_issues_count", "subscribers_count", "commits_count",
        "topics", "used_by_count", "releases_count", "contributors_count", "snapshot_date"
    }}


@sleep_and_retry
@limits(calls=5000, period=60*60)
def get_repo_metadata(repo_owner: str, repo_name: str, access_token: str) -> dict:
    access_token = access_token if access_token else os.environ.get("GITHUB_ACCESS_TOKEN")
    headers = {"Authorization": "token " + access_token}
    repo_meta = requests.get(f"https://api.github.com/repos/{repo_owner}/{repo_name}", headers=headers)
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
        repo_page = requests.get(f"https://github.com/{repo_owner}/{repo_name}/blob/{name}/requirements.txt")
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
                        dependencies.append({
                            "library": dep_match.group(1),
                            "version": dep_match.group(2)
                        })
            else:
                print(f"Could not read dependencies for https://github.com/{repo_owner}/{repo_name}")
    return dependencies


def airflow_runner(bucket, gcs_manually_collected_path, output_tmp_dir, output_backup_dir) -> None:
    with tempfile.TemporaryDirectory() as td:
        data_dir = os.path.join(td, "data")
        os.mkdir(data_dir)
        access_token = BaseHook.get_connection("fields-of-study").password
        gcs_hook = GoogleCloudStorageHook()
        manually_collected_path = os.path.join(data_dir, "manually_collected_links.jsonl")
        gcs_hook.download(bucket, gcs_manually_collected_path, manually_collected_path)
        get_repos(True, data_dir, access_token=access_token, manually_collected_path=manually_collected_path)
        curr_date = datetime.now().strftime("%Y-%m-%d")
        for basename in ["repository", "repository-metric-snapshots", "full_gh_repo_metadata"]:
            # upload to gcs backup dir
            gcs_hook.upload(bucket, f"{output_backup_dir}/{basename}_{curr_date}.jsonl",
                            os.path.join(data_dir, f"{basename}.jsonl"))
            # upload to tmp dir for import to bq
            if basename != "full_gh_repo_metadata":
                gcs_hook.upload(bucket, f"{output_tmp_dir}/{basename}.jsonl",
                                os.path.join(data_dir, f"{basename}.jsonl"))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--query_pwc", default=False, action="store_true")
    parser.add_argument("--output_dir", default="data")
    args = parser.parse_args()

    if not os.path.exists(args.output_dir):
        os.mkdir(args.output_dir)

    get_repos(args.query_pwc, args.output_dir)