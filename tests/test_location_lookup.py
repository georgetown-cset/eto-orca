import unittest

from scripts.location_lookup import get_country_from_place, get_country_from_regex


class TestLocationLookup(unittest.TestCase):
    def test_india_final_from_regex(self):
        self.assertEqual("India", get_country_from_regex("Udupi, Karnataka, India"))

    def test_united_states_from_regex(self):
        self.assertEqual(
            "United States", get_country_from_regex("Northridge, Los Angeles, CA, USA")
        )

    def test_initial_china_from_regex(self):
        self.assertEqual("china", get_country_from_regex("china, a country"))

    def get_country_from_place_usa(self):
        self.assertEqual("United States", get_country_from_place("Fulton, MD, USA"))
