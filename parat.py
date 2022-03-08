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

if __name__ == "__main__":
    pass