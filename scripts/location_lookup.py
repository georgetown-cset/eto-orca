import argparse
import csv
import json
import os
import random
import re

import requests

PLACES_API_KEY = os.environ.get("PLACES_API_KEY")
ABBREV_TO_COUNTRY = {
    "uk": "United Kingdom",
    "us": "United States",
    "usa": "United States",
}
COUNTRIES = [
    "Abkhazia",
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Cape Verde",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czech Republic",
    "Côte d'Ivoire",
    "Democratic Republic of Congo",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "East Timor",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kosovo",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Palestine",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Puerto Rico",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "São Tomé and Príncipe",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "The Bahamas",
    "Togo",
    "Tonga",
    "Transnistria",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatican City",
    "Venezuela",
    "Vietnam",
    "Western Sahara",
    "Yemen",
    "Zambia",
    "Zimbabwe",
]


def get_place_response(location: str) -> dict:
    url = (
        f"https://maps.googleapis.com/maps/api/place/findplacefromtext/json?"
        f"input={location}&inputtype=textquery&fields=formatted_address&key={PLACES_API_KEY}"
    )
    response = requests.get(url)
    return response.json()


def get_country_from_place(place_addr: str) -> str:
    country = place_addr.split(",")[-1].strip()
    return ABBREV_TO_COUNTRY.get(country.lower(), country)


def get_country_from_regex(place_name: str) -> str:
    country_re = "|".join([f"({c})" for c in COUNTRIES])
    match = re.search(
        rf"(?i)\b({country_re}|(USA)|(US)|(UK))\b",
        place_name,
    )
    if match:
        country = match.group(1)
        print(f"found {country} in {place_name} using regex")
        country = ABBREV_TO_COUNTRY.get(country.lower(), country)
        return country.title()
    return None


def get_location_parts(location: str, loc_out, loc_to_api_result):
    inferred_country = get_country_from_regex(location)
    if not inferred_country:
        if location in loc_to_api_result:
            resp = loc_to_api_result[location]
        else:
            resp = get_place_response(location)
        loc_out.write(json.dumps({"location": location, "response": resp}) + "\n")
        if resp.get("candidates") and resp["candidates"] and resp["candidates"][0]:
            location = resp["candidates"][0]["formatted_address"]
            inferred_country = get_country_from_place(location)
            print(f"found {inferred_country} in {location} using Places API")
    if inferred_country not in COUNTRIES:
        inferred_country = None
    location_parts = [lp.strip().title() for lp in location.split(",")]
    city, state = None, None
    if (
        location_parts
        and inferred_country
        and (
            location_parts[-1].lower() in {inferred_country.lower(), "us", "usa", "uk"}
        )
    ):
        if len(location_parts) >= 3:
            city, state = location_parts[-3], location_parts[-2]
        elif len(location_parts) == 2:
            state = location_parts[0]
    elif len(location_parts) == 2:
        city, state = location_parts
    return city, state, inferred_country


def add_inferred_locations(
    input_data: str,
    locations_output: str,
    inferred_locations_output: str,
    loc_to_api_result: dict,
) -> None:
    loc_out = open(locations_output, mode="w")
    out_rows = []
    with open(input_data) as f:
        for line in csv.DictReader(f):
            location = line["location"]
            city, state, inferred_country = get_location_parts(
                location, loc_out, loc_to_api_result
            )
            line.pop("difficulty")
            line["inferred_country"] = inferred_country
            line["inferred_city"] = city
            line["inferred_state"] = state
            out_rows.append(line)
    with open(inferred_locations_output, mode="w") as out_f:
        out = csv.DictWriter(
            out_f,
            fieldnames=[
                "location",
                "inferred_country",
                "inferred_state",
                "inferred_city",
                "annotator_country",
                "contains_pii",
                "not_clear",
            ],
        )
        out.writeheader()
        random.shuffle(out_rows)
        for row in out_rows:
            out.writerow(row)
    loc_out.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_data", default="github_annotation_data.csv")
    parser.add_argument(
        "--locations_output", default="github_annotation_data_locations.jsonl"
    )
    parser.add_argument(
        "--inferred_locations_output",
        default="github_annotation_data_with_inferred_locations.csv",
    )
    parser.add_argument("--locations_api_results")
    args = parser.parse_args()

    loc_to_api_result = {}
    if args.locations_api_results:
        with open(args.locations_api_results) as f:
            for line in f:
                js = json.loads(line)
                loc_to_api_result[js["location"]] = js["response"]

    add_inferred_locations(
        args.input_data,
        args.locations_output,
        args.inferred_locations_output,
        loc_to_api_result,
    )
