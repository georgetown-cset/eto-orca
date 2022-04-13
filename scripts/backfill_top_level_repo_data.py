import argparse
import json

import requests
from github_auth import mk_auth


def get_meta(owner: str, repo: str) -> dict:
    auth = mk_auth()
    repo_resp = requests.get(
        f"https://api.github.com/repos/{owner}/{repo}",
        auth=auth,
    )
    return repo_resp


def backfill_meta(input_data: str, output_data: str) -> None:
    out = open(output_data, mode="w")
    with open(input_data) as f:
        for line in f:
            js = json.loads(line)
            if not js.get("full_metadata"):
                js["full_metadata"] = get_meta(js["owner_name"], js["repo_name"])
            out.write(json.dumps(js) + "\n")
    out.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_data", default="curr_repos.jsonl")
    parser.add_argument("--output_data", default="curr_repos_filled.jsonl")
    args = parser.parse_args()

    backfill_meta(args.input_data, args.output_data)
