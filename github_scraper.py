import pandas as pd
import json
import re
from github import Github
import os
import pprint

pp = pprint.PrettyPrinter()

# github login
g = Github(os.environ["GITHUB_ACCESS_KEY"])

# Structure:
# Input data: commit payload
# Output data: inferred data
# There is some more stuff we can do with the pushEvent, but it's rare in practice


def process_payload(pushEvent):
    """ Input: a commit (PushEvent) from BigQuery
        Output: 
        calls the process_user function
    """
    username = pushEvent["actor"]["login"]
    payload = json.loads(pushEvent["payload"])

    email = payload["commits"][0]["author"]["email"]
    authorname = payload["commits"][0]["author"]["name"]

    username, company, inferredcompany, website, location, bio = process_user(
        username)

    return username, email, authorname, username, company, inferredcompany, website, location, bio


def process_user(username):
    """ Pings the Github API for the user and extracts user data, including bio from the Github API """
    userdata = g.get_user(username)

    if userdata.location:
        location = userdata.location
    else:
        location = None

    if userdata.blog:
        website = userdata.blog
    else:
        website = None

    if userdata.company:
        company = userdata.company
    else:
        company = None

    inferredcompany = extract_company(userdata)

    return username, company, inferredcompany, website, location, userdata.bio


def extract_company(userdata):
    """ Multi-step process to extract possible company names, if possible from the Github API user data. """

    possiblities = []

    # Attempt to extract from the user bio. Common formats:
    # Lead engineer @ Simple.org; formerly @ GitHub, Cognitect, and others. Human centered software development.
    # The original author of the @sympy and @symengine libraries and the @lfortran compiler.

    if userdata.bio:
        # before end of line
        # add whitespace for match
        possiblities.extend(re.findall("\@\s?(.*?)\s", userdata.bio + " "))

        # repeat process with "at"
        possiblities.extend(re.findall("(?=at\s.*?(\w+))", userdata.bio))

    # Attempt to extract from the email domain

    if userdata.email:
        possiblities.extend(re.findall("\@(.*)", userdata.email))

    return possiblities


if __name__ == "__main__":
    df = pd.read_hdf("light_archive.hdf", key="a")
    filtered = df.loc[df["type"] == "PushEvent"]
    filtered = filtered.drop_duplicates(subset=["other"])
    for i, row in filtered.iloc[:10].iterrows():
        result = process_payload(row)
        print(result)
