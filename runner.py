from geolocation import *
import pandas as pd

df = pd.read_csv("repo_owners_location.csv")

df["location"] = df["location"].str.normalize('NFKD').str.encode('ascii', errors='ignore').str.decode('utf-8')

df = df.iloc[:250]



for i in df["location"]:
    print(i, "\t", get_country_from_location(i))

