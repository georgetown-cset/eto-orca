import pandas as pd
import json
import re
from github import Github
import os
import pprint
import time

from github_scraper import *

v = pd.read_hdf("light_archive.hdf", key="v")
p = pd.read_hdf("light_archive.hdf", key="p")

d = []
for i in p['github_repos']:
    d.extend(i)

# re.split(r"/", 'github.com/Ghailen-Ben-Achour/PointNet2_Segmentation')
# second one is org/person - put this through the previous process
# third one is repo


d = list(set(d))
split = [re.split(r"/", i) for i in d]

df = pd.DataFrame(split)
df['repo'] = d
df = df[df[3].isnull()][['repo', 1, 2]]


df = df.applymap(lambda s: s.lower() if type(s) == str else s)

# In [48]: df[df[3].notnull()]
# Out[48]:
#             0    1       2         3
# 5266   github  com  bldeng       LBC
# 43943  github  com  brentp      bwa-
# 43948  github  com  brentp  bwa-meth

# In [49]: d[5266]
# Out[49]: 'github/com/bldeng/LBC'

# In [50]: d[43943]
# Out[50]: 'github/com/brentp/bwa-'

# In [51]: d[43948]
# Out[51]: 'github/com/brentp/bwa-meth'

# These are incorrect


alias = v['aliases'].explode('aliases')
flattened = alias.apply(pd.Series)[["alias", "alias_language"]]


# df.merge(flattened, how="inner", left_on = 1, right_on = "alias")
# Only gets a dozen


if __name__ == "__main__":
    pass
