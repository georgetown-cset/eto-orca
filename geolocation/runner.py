import random

import pandas as pd
from geolocation_base import get_country_from_location

random.seed(120)
# get_country_from_location("Jalisco, Mexico")

df = pd.read_csv("repo_owners_location_sample.csv")

df["location_cleaned"] = (
    df["location"]
    .str.normalize("NFKD")
    .str.encode("ascii", errors="ignore")
    .str.decode("utf-8")
    .apply(str)
    # .str.replace("[^a-zA-Z0-9]", " ") # not practical to replace in world_cities.csv
)

df_min = df.sample(100, random_state=120)


for i, r in df_min.iterrows():  # ["location_cleaned"]:
    result = get_country_from_location(r["location_cleaned"])
    print("{:>50}  {:>50}  {:>50}".format(r["location"], r["location_cleaned"], result))
