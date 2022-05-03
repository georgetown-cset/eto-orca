from geolocation_base import *
import pandas as pd

# get_country_from_location("Jalisco, Mexico")

df = pd.read_csv("repo_owners_location_sample.csv")

df["location"] = (
    df["location"]
    .str.normalize("NFKD")
    .str.encode("ascii", errors="ignore")
    .str.decode("utf-8")
    .apply(str)
)

# df = df.iloc[:250]


for i in df["location"]:
    result = get_country_from_location(i)
    print("{:>50}  {:>50}".format(i, result))
