import os


def mk_auth() -> tuple:
    """
    Checks the environment for GITHUB_ACCESS_TOKEN and GITHUB_USER env variables and returns these as a
    tuple if set, otherwise complains
    :return: Tuple of values of (GITHUB_ACCESS_TOKEN, GITHUB_USER)
    """
    gh_tok = os.environ.get("GITHUB_ACCESS_TOKEN")
    assert gh_tok, "Please set the GITHUB_ACCESS_TOKEN environment variable"
    username = os.environ.get("GITHUB_USER")
    assert username, "Please set the GITHUB_USER environment variable"
    return username, gh_tok
