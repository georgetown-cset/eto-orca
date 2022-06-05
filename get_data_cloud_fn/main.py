import os
import pickle

import functions_framework

with open(os.path.join("data", "field_to_repo.pkl"), mode="rb") as f:
    FIELD_TO_REPOS = pickle.load(f)
with open(os.path.join("data", "id_to_repo.pkl"), mode="rb") as f:
    ID_TO_REPO = pickle.load(f)


@functions_framework.http
def get_data(request):
    # Set CORS headers for the preflight request following
    # https://cloud.google.com/functions/docs/samples/functions-http-cors
    if request.method == "OPTIONS":
        # Allows GET requests from any origin with the Content-Type
        # header and caches preflight response for an 3600s
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "3600",
        }
        return "", 204, headers
    request_json = request.args
    if request_json and ("field" in request_json) and ("order_by" in request_json):
        all_repo_ids = FIELD_TO_REPOS[request_json["field"]]
        all_repos = [ID_TO_REPO[int(repo_id)] for repo_id in all_repo_ids]
        sorted_repos = sorted(
            all_repos, key=lambda r: r[request_json["order_by"]], reverse=True
        )
        result = {"matches": sorted_repos[:20]}
    else:
        result = {"fields": sorted(list(FIELD_TO_REPOS.keys()))}
    headers = {"Access-Control-Allow-Origin": "*"}
    return result, 200, headers
