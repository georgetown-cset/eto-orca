import os
import pickle

import functions_framework

with open(os.path.join("data", "field_to_repo.pkl"), mode="rb") as f:
    FIELD_TO_REPOS = pickle.load(f)
with open(os.path.join("data", "id_to_repo.pkl"), mode="rb") as f:
    ID_TO_REPO = pickle.load(f)


@functions_framework.http
def get_data(request):
    if not request:
        return {}
    request_json = request.get_json()
    if request_json and ("field" in request_json) and ("order_by" in request_json):
        all_repo_ids = FIELD_TO_REPOS[request_json["field"]]
        all_repos = [ID_TO_REPO[int(repo_id)] for repo_id in all_repo_ids]
        return {
            "results": sorted(all_repos, key=lambda r: r[request_json["order_by"]])[:20]
        }
    else:
        return {}
