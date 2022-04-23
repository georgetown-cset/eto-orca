import argparse
import json
import time

import requests

from scripts.github_config import RATE_LIMIT_INTERVAL, mk_auth


def get_meta(owner: str, repo: str) -> dict:
    auth = mk_auth()
    repo_resp = requests.get(
        f"https://api.github.com/repos/{owner}/{repo}",
        auth=auth,
    )
    if repo_resp.status_code != 200:
        print(f"{owner}/{repo}: {repo_resp.json()}")
        return {}
    return repo_resp.json()


def backfill_meta(input_data: str, output_data: str) -> None:
    out = open(output_data, mode="w")
    seen_repos = set()
    with open(input_data) as f:
        for line in f:
            js = json.loads(line)
            repo_fullname = js["owner_name"] + "/" + js["repo_name"]
            if repo_fullname in seen_repos:
                continue
            seen_repos.add(repo_fullname)
            if not js.get("full_metadata"):
                js["full_metadata"] = get_meta(js["owner_name"], js["repo_name"])
                time.sleep(RATE_LIMIT_INTERVAL)
            out.write(json.dumps(js) + "\n")
    out.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_data", default="curr_repos.jsonl")
    parser.add_argument("--output_data", default="curr_repos_filled.jsonl")
    args = parser.parse_args()

    backfill_meta(args.input_data, args.output_data)
