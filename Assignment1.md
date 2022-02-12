# github-metrics


## Task 1: Explore Methods of Classifying Repos


## Task 2: Explore methods for linking committers to their current employers

The ultimate goal is not to get data only from here, but also through the API.

[Documentation](https://pygithub.readthedocs.io/en/latest/introduction.html#very-short-tutorial)

__PyGithub exploration:__
Instantiate object: g = github(os.environ["GITHUB_ACCESS_KEY"])
<!-- g.search_users is not a good function because simple names will hit the rate limit. -->
js = g.get_user("Jerodsun")
jm = g.get_user("jmelot")

cset = g.get_organization("georgetown-cset")
The website is `cset.blog`, see everything in `cset.raw_data`

For a lot of private orgs: `This organization has no public members. You must be a member to see who’s a part of this organization.`

All you need to do is to find a single push event.


Within the user:
js.email does not have anything set. (Didn't know a lot of this stuff before, setting profiles, etc)

*Most* of the contributions should be inferred from these. Not that there are any other options... I'm guessing for 20-30% it's impossible to infer a company even if it's technically "there"?


jm.company
jm.get_events()

So then it becomes pretty straightforward: Iterative method if found, if not found, then try all these different ways to find it...

Is the end goal to create a corpora, or to

https://www.kite.com/python/docs/github.PaginatedList.PaginatedList

__Data:__ inside the `payload` metadata in `githubarchive_20220203`, there are anonymoized emails e.g. "d16905d5bacc3b0a3d8e20bed9e45fab8ccd8bfb@thebrocks.net"

However, the domain is visible after the @ and is therefore useful in extracting the data.

Representative Sample of the first 10k types of Github events:
```
PushEvent                        5344
CreateEvent                       883
PullRequestEvent                  792
IssueCommentEvent                 727
WatchEvent                        581
PullRequestReviewEvent            456
IssuesEvent                       342
DeleteEvent                       329
PullRequestReviewCommentEvent     302
ForkEvent                         143
ReleaseEvent                       51
GollumEvent                        23
MemberEvent                        10
CommitCommentEvent                  9
PublicEvent                         8
```

`Push Event` is the only event with commit iknformation on author email. Plus we only need one (assuming the author name doesn't change) so that cuts down on the corpora.

For the first 10k samples, can cut down significantly in the parsing...


```
kevee            1122
sdbondi           220
labeneko          164
joeyklee          148
rmayr             146
                 ... 
wangandi520         1
chriswhite199       1
ealymbaev           1
migrap              1
gcharest            1
Length: 2890, dtype: int64
```

```
Push Event Sample

{'push_id': 8999348580,
 'size': 1,
 'distinct_size': 1,
 'ref': 'refs/heads/master',
 'head': 'c93a79f403ac9669d971a089354b362d5a861df7',
 'before': '8f7c02e681316c711b6ddd68392f084e4b8d539d',
 'commits': [{'sha': 'c93a79f403ac9669d971a089354b362d5a861df7',
   'author': {'email': 'd272b771ac5801e6f4a8185e9669dd091ae19b71@gmail.com',
    'name': 'Rob Sanheim'},
   'message': "BD help contact - take two (#3348)\n\n* Added Shamim's contact for HELP in BD\r\n\r\n* Added CSS for Bangladesh help button\r\n\r\n* Fix the help link\r\n\r\n* Add properly encoded URL for BD whatsapp support link\r\n\r\nCo-authored-by: Daniel Burka <danielburka@gmail.com>\r\nCo-authored-by: Tim Cheadle <tcheadle@resolvetosavelives.org>\r\nCo-authored-by: Hari Mohanraj <hari.mohanraj89@gmail.com>",
   'distinct': True,
   'url': 'https://api.github.com/repos/simpledotorg/simple-server/commits/c93a79f403ac9669d971a089354b362d5a861df7'}]}
```


## Task 3 GitGeo and Perceval

Summary: GitGeo and Perceval do the same things. Majority do not have location data, which is a field the user needs to manually specify inside the Github interface. Neither location extractor is doing anything special, just going through the API. Github rate limits bottleneck testing.

Perceval: No native Python implementation for Perceval - only bash. API `fetch` function is in line 178 of `grimoirelab-perceval/perceval/backends/core/github.py`. 
[Link](https://github.com/chaoss/grimoirelab-perceval/blob/master/perceval/backends/core/github.py)

GitGeo: API function `get_contributor_location` is in line 120 of `github.py`.
[Link](https://github.com/Open-Source-Software-Neighborhood-Watch/GitGeo/blob/main/gitgeo/github.py)

```
def get_contributor_location(user):
    """Return geographic location, if present on github page, of user.
    Args:
        user: the GitHub user name
    Return:
        str: a geographic location
    """
    # cycle through GitHub tokens
    github_token = next(GITHUB_TOKENS)
    response = requests.get(
        "https://api.github.com/users/" + user,
        # convert username and token to strings per requests's specifications
        auth=(str(GITHUB_USERNAME), str(github_token)),
    )

    user_location = ""
    if response.ok:
        user_info = json.loads(response.text or response.content)
        user_location = user_info["location"]

    return user_location
```


There is a low API rate limit, so it is hard to get batch data at once.

Sample Perceval response.

```
"user_data": {
            "avatar_url": "https://avatars.githubusercontent.com/u/438000?v=4",
            "bio": null,
            "blog": "",
            "company": null,
            "created_at": "2010-10-13T13:42:37Z",
            "email": null,
            "events_url": "https://api.github.com/users/camillem/events{/privacy}",
            "followers": 9,
            "followers_url": "https://api.github.com/users/camillem/followers",
            "following": 3,
            "following_url": "https://api.github.com/users/camillem/following{/other_user}",
            "gists_url": "https://api.github.com/users/camillem/gists{/gist_id}",
            "gravatar_id": "",
            "hireable": null,
            "html_url": "https://github.com/camillem",
            "id": 438000,
            "location": null,
            "login": "camillem",
            "name": "camillem",
            "node_id": "MDQ6VXNlcjQzODAwMA==",
            "organizations": [],
            "organizations_url": "https://api.github.com/users/camillem/orgs",
            "public_gists": 1,
            "public_repos": 29,
            "received_events_url": "https://api.github.com/users/camillem/received_events",
            "repos_url": "https://api.github.com/users/camillem/repos",
            "site_admin": false,
            "starred_url": "https://api.github.com/users/camillem/starred{/owner}{/repo}",
            "subscriptions_url": "https://api.github.com/users/camillem/subscriptions",
            "twitter_username": null,
            "type": "User",
            "updated_at": "2021-07-26T11:19:38Z",
            "url": "https://api.github.com/users/camillem"
        }
```


Sample GitGeo response

```
In [11]: js.raw_data
Out[11]:
{'login': 'Jerodsun',
 'id': 46911616,
 'node_id': 'MDQ6VXNlcjQ2OTExNjE2',
 'avatar_url': 'https://avatars.githubusercontent.com/u/46911616?v=4',
 'gravatar_id': '',
 'url': 'https://api.github.com/users/Jerodsun',
 'html_url': 'https://github.com/Jerodsun',
 'followers_url': 'https://api.github.com/users/Jerodsun/followers',
 'following_url': 'https://api.github.com/users/Jerodsun/following{/other_user}',
 'gists_url': 'https://api.github.com/users/Jerodsun/gists{/gist_id}',
 'starred_url': 'https://api.github.com/users/Jerodsun/starred{/owner}{/repo}',
 'subscriptions_url': 'https://api.github.com/users/Jerodsun/subscriptions',
 'organizations_url': 'https://api.github.com/users/Jerodsun/orgs',
 'repos_url': 'https://api.github.com/users/Jerodsun/repos',
 'events_url': 'https://api.github.com/users/Jerodsun/events{/privacy}',
 'received_events_url': 'https://api.github.com/users/Jerodsun/received_events',
 'type': 'User',
 'site_admin': False,
 'name': None,
 'company': '@georgetown-cset',
 'blog': 'jerodsun.github.io',
 'location': None,
 'email': None,
 'hireable': None,
 'bio': None,
 'twitter_username': None,
 'public_repos': 42,
 'public_gists': 1,
 'followers': 0,
 'following': 1,
 'created_at': '2019-01-22T02:12:24Z',
 'updated_at': '2022-02-08T04:37:57Z'}
```

<!-- test it out on a few repos, and if it seems to be working well write (or better yet, find in their code) a function that takes a repo and outputs a jsonl of contributors and locations? -->
