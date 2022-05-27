import argparse
import csv
import json
import os
import re

import requests

PLACES_API_KEY = os.environ.get("PLACES_API_KEY")


def get_place_response(location: str) -> dict:
    url = (
        f"https://maps.googleapis.com/maps/api/place/findplacefromtext/json?"
        f"input={location}&inputtype=textquery&fields=formatted_address&key={PLACES_API_KEY}"
    )
    response = requests.get(url)
    return response.json()


def get_country_from_place(place_addr: str) -> str:
    country = place_addr.split(",")[-1].strip()
    return "United States" if country.lower() == "usa" else country


def get_country_from_regex(place_name: str) -> str:
    match = re.search(
        r"(?i)\b((Abkhazia)|(Afghanistan)|(Albania)|(Algeria)|(Andorra)|(Angola)|(Antigua and Barbuda)|"
        r"(Argentina)|(Armenia)|(Australia)|(Austria)|(Azerbaijan)|(Bahrain)|(Bangladesh)|(Barbados)|"
        r"(Belarus)|(Belgium)|(Belize)|(Benin)|(Bhutan)|(Bolivia)|(Bosnia and Herzegovina)|(Botswana)|"
        r"(Brazil)|(Brunei)|(Bulgaria)|(Burkina Faso)|(Burundi)|(Cambodia)|(Cameroon)|(Canada)|(Cape Verde)|"
        r"(Central African Republic)|(Chad)|(Chile)|(China)|(Colombia)|(Comoros)|(Congo)|(Costa Rica)|"
        r"(Croatia)|(Cuba)|(Cyprus)|(Czech Republic)|(Côte d'Ivoire)|(Democratic Republic of Congo)|(Denmark)|"
        r"(Djibouti)|(Dominica)|(Dominican Republic)|(East Timor)|(Ecuador)|(Egypt)|(El Salvador)|"
        r"(Equatorial Guinea)|(Eritrea)|(Estonia)|(Eswatini)|(Ethiopia)|(Fiji)|(Finland)|(France)|(Gabon)|"
        r"(Gambia)|(Georgia)|(Germany)|(Ghana)|(Greece)|(Grenada)|(Guatemala)|(Guinea)|(Guinea-Bissau)|"
        r"(Guyana)|(Haiti)|(Honduras)|(Hungary)|(Iceland)|(India)|(Indonesia)|(Iran)|(Iraq)|(Ireland)|"
        r"(Israel)|(Italy)|(Jamaica)|(Japan)|(Jordan)|(Kazakhstan)|(Kenya)|(Kiribati)|(Kosovo)|(Kuwait)|"
        r"(Kyrgyzstan)|(Laos)|(Latvia)|(Lebanon)|(Lesotho)|(Liberia)|(Libya)|(Liechtenstein)|(Lithuania)|"
        r"(Luxembourg)|(Madagascar)|(Malawi)|(Malaysia)|(Maldives)|(Mali)|(Malta)|(Marshall Islands)|"
        r"(Mauritania)|(Mauritius)|(Mexico)|(Micronesia)|(Moldova)|(Monaco)|(Mongolia)|(Montenegro)|"
        r"(Morocco)|(Mozambique)|(Myanmar)|(Namibia)|(Nauru)|(Nepal)|(Netherlands)|(New Zealand)|"
        r"(Nicaragua)|(Niger)|(Nigeria)|(North Korea)|(North Macedonia)|(Norway)|(Oman)|(Pakistan)|"
        r"(Palau)|(Palestine)|(Panama)|(Papua New Guinea)|(Paraguay)|(Peru)|(Philippines)|(Poland)|"
        r"(Portugal)|(Puerto Rico)|(Qatar)|(Romania)|(Russia)|(Rwanda)|(Saint Kitts and Nevis)|"
        r"(Saint Lucia)|(Saint Vincent and the Grenadines)|(Samoa)|(San Marino)|(Saudi Arabia)|(Senegal)|"
        r"(Serbia)|(Seychelles)|(Sierra Leone)|(Singapore)|(Slovakia)|(Slovenia)|(Solomon Islands)|(Somalia)|"
        r"(South Africa)|(South Korea)|(South Sudan)|(Spain)|(Sri Lanka)|(Sudan)|(Suriname)|(Sweden)|"
        r"(Switzerland)|(Syria)|(São Tomé and Príncipe)|(Taiwan)|(Tajikistan)|(Tanzania)|(Thailand)|"
        r"(The Bahamas)|(Togo)|(Tonga)|(Transnistria)|(Trinidad and Tobago)|(Tunisia)|(Turkey)|"
        r"(Turkmenistan)|(Tuvalu)|(Uganda)|(Ukraine)|(United Arab Emirates)|(United Kingdom)|"
        r"(United States)|(Uruguay)|(Uzbekistan)|(Vanuatu)|(Vatican City)|(Venezuela)|(Vietnam)|"
        r"(Western Sahara)|(Yemen)|(Zambia)|(Zimbabwe)|(USA)|(UK))\b",
        place_name,
    )
    if match:
        country = match.group(1)
        print(f"found {country} in {place_name} using regex")
        if country.lower() == "usa":
            return "United States"
        if country.lower() == "uk":
            return "United Kingdom"
        return country.title()
    return None


def add_inferred_locations(
    input_data: str, locations_output: str, inferred_locations_output: str
) -> None:
    loc_out = open(locations_output, mode="w")
    with open(inferred_locations_output, mode="w") as out_f:
        out = csv.DictWriter(
            out_f,
            fieldnames=[
                "location",
                "inferred_country",
                "annotator_country",
                "contains_pii",
            ],
        )
        out.writeheader()
        with open(input_data) as f:
            for line in csv.DictReader(f):
                inferred_country = get_country_from_regex(line["location"])
                if not inferred_country:
                    resp = get_place_response(line["location"])
                    loc_out.write(json.dumps(resp) + "\n")
                    if resp.get("candidates") and resp["candidates"]:
                        inferred_country = get_country_from_place(
                            resp["candidates"][0]["formatted_address"]
                        )
                        print(
                            f"found {inferred_country} in {line['location']} using Places API"
                        )
                line.pop("difficulty")
                line["inferred_country"] = inferred_country
                out.writerow(line)
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
    args = parser.parse_args()

    add_inferred_locations(
        args.input_data, args.locations_output, args.inferred_locations_output
    )
