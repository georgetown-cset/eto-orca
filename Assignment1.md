# github-metrics


### Task 1: Explore Methods of Classifying Repos


## Task 2: Explore methods for linking committers to their current employers

The ultimate goal is not to get data only from here, but also through the API.

__PyGithub exploration:__
Instantiate object: g = github
g.search_users is not a good function because simple names will hit the rate limit.
js = g.get_user("Jerodsun") will work.
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

