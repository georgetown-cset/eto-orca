import pandas as pd
import json
import re
from github import Github
import os
import pprint
import time

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
        username) # duplicate username



    return username, email, authorname, company, inferredcompany, website, location, bio


def process_company(company):
    """ Pings the Github API for the linked @company and return the full name """
    try:
        companydata = g.get_organization(company)
    except:
        return None, None, None, None

    if companydata.location:
        location = companydata.location
    else:
        location = None

    if companydata.blog:
        website = companydata.blog
    else:
        website = None
    
    if companydata.name:
        name = companydata.name
    else:
        name = None

    return company, website, location, companydata.description


def process_user(username):
    """ Pings the Github API for the user and extracts user data, including bio from the Github API """
    try:
        userdata = g.get_user(username)
    except:
        return None, None, None, None, None, None
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

    possibilities = []

    # Attempt to extract from the user bio. Common formats:
    # Lead engineer @ Simple.org; formerly @ GitHub, Cognitect, and others. Human centered software development.
    # The original author of the @sympy and @symengine libraries and the @lfortran compiler.

    if userdata.bio:
        # before end of line
        # add whitespace for match
        
        companies = re.findall("\@\s?(.*?)\s", userdata.bio + " ")
        for i in companies:
            # print(i)
            possibilities.append(i)

        # repeat process with "at"
        companies_at = re.findall("(?=at\s.*?(\w+))", userdata.bio)

        for i in companies_at:
            # print(i)
            possibilities.append(i)
    else:
        companies = None

    # if the @ reference is correct, embed in extract_company
    if companies:
        try:
            companyname = g.get_organization(companies[0]).name
        except:
            companyname = None
        
        if companyname:
            # print(companyname)
            possibilities.append(companyname)

    # add names public orgs
    orgs = userdata.get_orgs()
    if orgs:
        for org in list(orgs):
            companyname = org.name
            website = org.blog
            # print(companyname)
            possibilities.append(companyname)

            if website:
                # print(website)
                possibilities.append(website)


    # Attempt to extract from the email domain
    if userdata.email:
        emails = re.findall("\@(.*)", userdata.email) # probably filter out email
        for i in emails:
            # print(i)
            possibilities.append(i)
    # breakpoint()

    return possibilities

# add: from company name userdata.company -> ping API again, get full/real company name

# add public org from get_orgs()
# link github orgs to a subset of companies
# list of repositories from ArXiv, to get actual information rather than samples.

# Priority: understand geolocation/GitGeo format (and fix it too)
# Understand tasks first.
# Explore tasks for deduplication - try to get to the second task - reference prev.
# Add user github orgs to this code

# Make sure to document progress/questions in Github issues



if __name__ == "__main__":
    df = pd.read_hdf("light_archive.hdf", key="a")
    filtered = df.loc[df["type"] == "PushEvent"]
    filtered = filtered.drop_duplicates(subset=["other"])

    a = time.time()
    for i, row in filtered.iloc[0:10].iterrows():
        result = process_payload(row)
        print(result)
    b = time.time()

    print("Time elapsed: ", b-a)


    # find out rate limit for Github API
    # Initial (I think): 5,000 requests per hour
    # https://docs.github.com/en/developers/apps/building-github-apps/rate-limits-for-github-apps

    # Purpose:
    # pipeline from ArXiv, aggregator repositories, etc.

    # ArXiv full text extraction that needs improvement.
    # 
    # repository to committer 
    # list of interesting repositories -> committers for each repository
    # see if there is a `repo` in the df archive

    # connecting to company - brainstorm
    # after perceval: find something to match user-provided locations to actual countries
    # or cannibalize what GitGeo did.

    # write tests
    