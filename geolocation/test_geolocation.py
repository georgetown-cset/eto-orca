"""Unit tests and integration tests for geolocation"""

# pylint: disable=no-self-use, too-many-locals

from pathlib import Path

import pandas as pd
import pytest
from geolocation_base import get_country_from_location


class TestGitHubFunctionality:
    """Unit tests related to GitHub functionality"""

    def test_get_country_from_location_standard_order_with_comma(self):
        """test get_country_from_location on standard order pairs with comma."""
        assert get_country_from_location("Wellington, New Zealand") == "New Zealand"
        assert get_country_from_location("Jordan, Minnesota") == "United States"
        assert get_country_from_location("Jordan, MN") == "United States"
        assert get_country_from_location("Atlanta, Georgia") == "United States"
        assert get_country_from_location("Atlanta, Ga") == "United States"
        assert get_country_from_location("London, England") == "United Kingdom"
        assert get_country_from_location("Prague, Czech Republic") == "Czech Republic"
        assert get_country_from_location("Virginia, USA") == "United States"
        assert get_country_from_location("Naperville, IL") == "United States"
        assert get_country_from_location("Toronto, Ontario, Canada") == "Canada"
        assert get_country_from_location("Berlin, DE") == "Germany"
        assert get_country_from_location("CSU Sacramento") == "United States"
        assert get_country_from_location("Philadelphia, PA") == "United States"

    def test_get_country_from_location_nonstandard_order(self):
        """test get_country_from_location on non-standard order pairs."""
        assert get_country_from_location("Russia, Moscow") == "Russia"
        assert get_country_from_location("Russia, Nizhny Novgorod") == "Russia"

    def test_get_country_from_location_standard_order_no_comma(self):
        """test get_country_from_location on standard order pairs without comma."""
        assert get_country_from_location("Menlo Park CA") == "United States"

    def test_get_country_from_location_world_cities(self):
        """test get_country_from_location on world city names."""
        assert get_country_from_location("Tokyo") == "Japan"
        assert get_country_from_location("London") == "United Kingdom"
        assert get_country_from_location("Jakarta") == "Indonesia"
        assert get_country_from_location("Beijing") == "China"
        assert get_country_from_location("Washington D.C.") == "United States"
        assert get_country_from_location("Toronto, ON") == "Canada"

    def test_get_country_from_location_country_abbreviations(self):
        """test get_country_from_location on country abbreviations."""
        assert get_country_from_location("USA") == "United States"
        assert get_country_from_location("Cambridge, UK") == "United Kingdom"
        assert get_country_from_location("UK") == "United Kingdom"

    def test_get_country_from_location_corner_case_geographies(self):
        """test get_country_from_location on unusual geographies."""
        assert get_country_from_location("Palestine") == "Palestine"
        assert get_country_from_location("San Francisco Bay Area") == "United States"
        assert get_country_from_location("EU") == "None"
        assert get_country_from_location("Canary Islands") == "Spain"
        assert get_country_from_location("Earth") == "None"
        assert get_country_from_location("Sydney") == "Australia"
        assert get_country_from_location("Amsterdam") == "Netherlands"
        assert get_country_from_location("NYC") == "United States"
        assert get_country_from_location("Barcelona") == "Spain"
        assert get_country_from_location("Kerala") == "India"
        assert get_country_from_location("Hyderabad") == "India"
        assert get_country_from_location("Vancouver") == "Canada"
        assert get_country_from_location("Jiangxi Sheng") == "China"
        assert get_country_from_location("San Francisco") == "United States"
        assert get_country_from_location("New York") == "United States"
        assert get_country_from_location("Saint Petersburg") == "Russia"
        assert get_country_from_location("England") == "United Kingdom"
        assert get_country_from_location("Athens") == "Greece"
        assert get_country_from_location("Europe") == "None"
        assert get_country_from_location("Lima") == "Peru"
        assert get_country_from_location("Bay Area") == "United States"
        assert get_country_from_location("EU") == "None"
        assert get_country_from_location("Canary Islands") == "Spain"
        assert get_country_from_location("waterloo") == "United Kingdom"
        assert get_country_from_location("Europe/Berlin") == "None"
        assert get_country_from_location("York") == "United Kingdom"
        assert get_country_from_location("M√ºnchen") == "Germany"
        assert get_country_from_location("Montreal, CA") == "Canada"
        assert get_country_from_location("Florian√≥polis") == "Brazil"
        assert get_country_from_location("Montr√©al") == "Canada"
        assert get_country_from_location("Bangalore") == "India"
        assert get_country_from_location("Dublin") == "Ireland"
        assert get_country_from_location("Santiago de Quer√©taro, M√©xico") == "Mexico"
        assert get_country_from_location("J√ºlich") == "Germany"
        assert get_country_from_location("Victoria, BC") == "Canada"
        assert get_country_from_location("Waterloo, ON") == "Canada"
        assert get_country_from_location("Falls Church, Virginia") == "United States"
        assert get_country_from_location("Amsterdam, the Netherlands") == "Netherlands"
        assert get_country_from_location("BeiJing") == "China"
        assert get_country_from_location("Edinburgh, Scotland") == "United Kingdom"
        assert get_country_from_location("Medell√≠n, Colombia") == "Colombia"
        assert get_country_from_location("La Jolla, CA.") == "United States"
        assert get_country_from_location("beijing") == "China"
        assert get_country_from_location("Pemberton, British Columbia") == "Canada"
        assert get_country_from_location("Timi»ôoara") == "Romania"
        assert get_country_from_location("PRC") == "China"
        assert get_country_from_location("Amsterdam, The Netherlands") == "Netherlands"
        assert get_country_from_location("Oxford") == "United Kingdom"
        assert get_country_from_location("S√£o Paulo") == "Brazil"
        assert get_country_from_location("Vancouver, BC") == "Canada"
        assert get_country_from_location("N.H.") == "United States"
        assert get_country_from_location("Sri-City, Andhra Pradesh") == "India"
        assert get_country_from_location("Scotland") == "United Kingdom"
        assert get_country_from_location("Geneva") == "Switzerland"
        assert get_country_from_location("Rotterdam, the Netherlands") == "Netherlands"
        assert get_country_from_location("Milan") == "Italy"
        assert get_country_from_location("Republic of Korea") == "South Korea"
        assert get_country_from_location("Bras√≠lia, Brazil.") == "Brazil"
        assert get_country_from_location("beijing") == "China"
        assert get_country_from_location("Z√ºrich") == "Switzerland"
        assert get_country_from_location("Kitchener, Ontario") == "Canada"
        assert get_country_from_location("Montr√©al, QC") == "Canada"
        assert get_country_from_location("Glasgow, Scotland") == "United Kingdom"
        assert (
            get_country_from_location("28 rue du Dr Roux 75015 Paris, FRANCE")
            == "France"
        )
        assert get_country_from_location("Krak√≥w") == "Poland"
        assert get_country_from_location("ƒ∞stanbul") == "Turkey"
        assert get_country_from_location("Russian Federation") == "Russia"
        assert get_country_from_location("Newcastle, NSW") == "Australia"
        assert get_country_from_location("Australia, Victoria") == "Australia"
        assert get_country_from_location("Perth, Western Australia ") == "Australia"
        assert get_country_from_location("Gda≈Ñsk") == "Poland"
        assert get_country_from_location("SF") == "United States"
        assert get_country_from_location("Hyderabad (India)") == "India"
        assert get_country_from_location("BITS Pilani, Rajasthan") == "India"
        assert get_country_from_location("Sri-City, Andhra Pradesh") == "India"

    def additional_tests_verified(self):
        assert get_country_from_location("brookline, ma") == "United States"

    @pytest.mark.xfail
    def test_get_country_from_location_dataset_pull_geographies(self):
        """tests of get_gountry_from_location() that fail as of 2/14/2021"""
        assert (
            get_country_from_location("Warszawa") == "Poland"
        )  # failure due to native language
        assert (
            get_country_from_location("Greater Los Angeles Area") == "United States"
        )  # failure due to contained double word
        assert (
            get_country_from_location("roudnice nad labem, czech republic")
            == "Czech Republic"
        )
        assert (
            get_country_from_location("Berlin/Florence") == "Germany"
        )  # cleaned data will not have / sign
        assert get_country_from_location("Greater Seattle Area") == "United States"
        assert get_country_from_location("Flanders, Europe, Earth") == "Belgium"
