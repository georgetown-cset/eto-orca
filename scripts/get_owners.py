import argparse
import json
import time

import requests
from geolocation.geolocation_base import get_country_from_location

from scripts.github_config import RATE_LIMIT_INTERVAL, mk_auth

AUTH = mk_auth()


def get_owner(owner: str) -> dict:
    """
    Retrieves metadata for repo owner, who may be a user or an organization
    :param owner: Name of repo owner
    :return: dict of owner metadata
    """
    time.sleep(RATE_LIMIT_INTERVAL)
    org_resp = requests.get(
        f"https://api.github.com/orgs/{owner}",
        auth=AUTH,
    )
    if org_resp.status_code == 200:
        return org_resp.json()
    time.sleep(RATE_LIMIT_INTERVAL)
    user_resp = requests.get(
        f"https://api.github.com/users/{owner}",
        auth=AUTH,
    )
    if user_resp.status_code == 200:
        return user_resp.json()
    print(f"{owner} not found as org or user")
    print(org_resp)
    print(user_resp)
    return None


def write_owners(
    repo_list: str, owner_output: str, prev_owners: bool, infer_country: bool
) -> None:
    out = open(owner_output, mode="w")
    seen_owners = set()
    if prev_owners:
        with open(prev_owners) as f:
            for line in f:
                js = json.loads(line)
                seen_owners.add(js["login"])
    with open(repo_list) as f:
        for line in f:
            js = json.loads(line)
            owner = js["owner_name"]
            if owner in seen_owners:
                continue
            seen_owners.add(owner)
            owner_meta = get_owner(owner)
            if owner_meta:
                if infer_country:
                    owner_meta["inferred_country"] = get_country_from_location(
                        owner_meta["location"]
                    )
                out.write(json.dumps(owner_meta) + "\n")
    out.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("repo_list")
    parser.add_argument("owner_output")
    parser.add_argument("--prev_owners", action="store_true")
    parser.add_argument("--infer_country", action="store_true")
    args = parser.parse_args()

    write_owners(
        args.repo_list, args.owner_output, args.prev_owners, args.infer_country
    )
