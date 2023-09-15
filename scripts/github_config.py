import os

from google.cloud import secretmanager

RATE_LIMIT_INTERVAL = 60 * 60 / 5000 + 0.2


def mk_auth() -> tuple:
    """
    Checks the environment for GITHUB_ACCESS_TOKEN and GITHUB_USER env variables and returns these as a
    tuple if set, otherwise complains
    :return: Tuple of values of (GITHUB_ACCESS_TOKEN, GITHUB_USER)
    """
    client = secretmanager.SecretManagerServiceClient()
    gh_tok = os.environ.get("GITHUB_ACCESS_TOKEN")
    if not gh_tok:
        secret_name = "projects/gcp-cset-projects/secrets/github_api_key/versions/1"
        secret = client.access_secret_version(request={"name": secret_name})
        gh_tok = secret.payload.data.decode("UTF-8")
    assert gh_tok, "Please set the GITHUB_ACCESS_TOKEN environment variable"
    username = os.environ.get("GITHUB_USER")
    if gh_tok and not username:
        username = "jmelot"
    assert username, "Please set the GITHUB_USER environment variable"
    return username, gh_tok
