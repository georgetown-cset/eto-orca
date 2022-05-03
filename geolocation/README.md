# Geolocation

Objective: take a location input string commonly found in Github's user `location` setting, and return a normalized country name.


This code is based off of the `gitgeo` repository with some updates. 

https://pypi.org/project/gitgeo/

`gitgeo==1.0.2`


Manual update to `world_cities.csv`:

`University,United States,Florida,7260219` deleted
`Mexico,Philippines,Central Luzon,1699805` deleted

<!-- Manual update to `country_codes.csv`:

`"South Korea", KR` added -->
`city_country_dict['Korea'] = 'South Korea'`

`Mohali,Punjab` not being inferred correctly despite being in the set - reshuffle the order of how it is inferred.

Other error types:

errors: India 

below process is NOT safe, deleted: ex. India -> Indiana -> United States
```
for metro in METRO_AREA_COUNTRY_DICT.keys():
     if location_string in metro:
         return METRO_AREA_COUNTRY_DICT[metro]
```
