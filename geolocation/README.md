# Geolocation

Objective: take a location input string found in Github's user `location` setting, and return a normalized country name.


This code is based off of the [`gitgeo==1.0.2`](https://pypi.org/project/gitgeo/) repository with manual updates.

Updates to `world_cities.csv` and `geographies_list.py`: added and removed city options, deduplicated.

Improvements in process based on testing in `runner.py`.

Unsafe processes deleted: ex. India -> Indiana -> United States
```
for metro in METRO_AREA_COUNTRY_DICT.keys():
     if location_string in metro:
         return METRO_AREA_COUNTRY_DICT[metro]
```


World cities sorted by aggregate country count.

added capitalization check to ensure last 2 letters correspond to US states.
```
for state in STATE_ABBREV:
    if location_string.endswith(state):
        return "United States"
```

### `runner.py` Analysis:

After all improvements implemented, taking a random sample of 100 rows:

3 Errors out of 84 inferred (94 actual locations): 96-97% accuracy rate

```
University of British Columbia -> United States
Feira de Santana, BA, Brasil -> Portugal
Mohali,Punjab -> Pakistan
```

Sample of locations unable to infer:
```
中国，上海 -> None
Zhejiang University -> None
The Netherlands, Europe -> None
Bazemont -> None
```

Error sampling edge case sample:

`get_country_from_location("Mohali,Punjab")`

`Mohali,Punjab` is not inferred correctly (India) because the 2nd token is searched first, and is matched as Punjab in Pakistan.
