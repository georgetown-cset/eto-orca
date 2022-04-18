import argparse
import json

import requests
from bs4 import BeautifulSoup
from ratelimit import limits, sleep_and_retry


@sleep_and_retry
@limits(calls=1, period=1)
def add_scraped_meta(repo_record: dict) -> None:
    """
    Augments repo metadata retrieved from gh API with scraped metadata
    :param repo_record: dict containing metadata scraped from gh API
    :return: None (mutates `repo_record`)
    """
    owner_name = repo_record["owner_name"]
    repo_name = repo_record["repo_name"]
    try:
        print(
            f"Fetching extra metadata for https://github.com/{owner_name}/{repo_name}"
        )
        repo_homepage = requests.get(f"https://github.com/{owner_name}/{repo_name}")
        soup = BeautifulSoup(repo_homepage.text, features="html.parser")
        spans = soup.find_all("span")
        commit_spans = [s for s in spans if "Commits on" in s.get("aria-label", "")]
        repo_record["num_commits"] = 0
        if len(commit_spans) != 1:
            print(f"Unexpected number of commit spans ({len(commit_spans)})")
        else:
            repo_record["num_commits"] = commit_spans[0].parent.find("strong").text
        links = soup.find_all("a")
        link_title_key_default = [
            ("Used by", "used_by", 0),
            ("Releases", "num_releases", 0),
            ("Contributors", "num_contributors", 1),
        ]
        repo_record.update({key: default for _, key, default in link_title_key_default})
        for link in links:
            if not (link.find("span") and link.find("span").get("title")):
                continue
            for title, key, _ in link_title_key_default:
                if title in link.text:
                    repo_record[key] = link.find("span")["title"]
        default_branch = repo_record["full_metadata"]["default_branch"]
        readme_resp = requests.get(
            f"https://raw.githubusercontent.com/{owner_name}/{repo_name}/{default_branch}/README.md"
        )
        repo_record["readme_text"] = readme_resp.text
        repo_record["homepage_text"] = repo_homepage.text
    except Exception as e:
        print(e)


def add_metadata(input_fi: str, output_fi: str, refresh: bool) -> None:
    """
    Adds scraped metadata to each line of a jsonl input file of repo metadata from gh API
    :param input_fi: jsonl input file of repo metadata from gh API
    :param output_fi: file where augmented metadata outputs should be written
    :param refresh: if true, will refresh previously collected data
    :return: None
    """
    out = open(output_fi, mode="w")
    seen = set()
    with open(input_fi) as f:
        for line in f:
            js = json.loads(line)
            if js["url"] in seen:
                continue
            else:
                seen.add(js["url"])
            if (not js.get("readme_text")) or refresh:
                add_scraped_meta(js, refresh)
            out.write(json.dumps(js) + "\n")
    out.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("input_repos")
    parser.add_argument("output_fi")
    parser.add_argument("--refresh", default=False, action="store_true")
    args = parser.parse_args()

    add_metadata(args.input_repos, args.output_fi, args.refresh)
