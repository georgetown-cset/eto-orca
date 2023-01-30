import unittest

from scripts.preprocess_for_website import (
    get_counts,
    get_cumulative_contributor_counts,
    get_issue_counts,
    get_new_vs_returning_contributor_counts,
)


class TestPreprocessForWebsite(unittest.TestCase):
    CONTRIBS = [
        {
            "contrib_date": "2020-01-01",
            "contributor": "user1",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2020-01-03",
            "contributor": "user1",
            "is_first_time_contributor": False,
        },
        {
            "contrib_date": "2021-01-01",
            "contributor": "user1",
            "is_first_time_contributor": False,
        },
        {
            "contrib_date": "2021-02-01",
            "contributor": "user1",
            "is_first_time_contributor": False,
        },
        {
            "contrib_date": "2021-05-01",
            "contributor": "user1",
            "is_first_time_contributor": False,
        },
        {
            "contrib_date": "2020-01-01",
            "contributor": "user2",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2021-01-01",
            "contributor": "user2",
            "is_first_time_contributor": False,
        },
        {
            "contrib_date": "2020-01-01",
            "contributor": "user2",
            "is_first_time_contributor": False,
        },
        {
            "contrib_date": "2020-01-01",
            "contributor": "user3",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2020-01-01",
            "contributor": "user3",
            "is_first_time_contributor": False,
        },
        {
            "contrib_date": "2020-01-01",
            "contributor": "user4",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2020-01-01",
            "contributor": "user5",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2020-01-06",
            "contributor": "user6",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2020-01-06",
            "contributor": "user7",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2020-01-08",
            "contributor": "user8",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2020-01-08",
            "contributor": "user9",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2020-01-09",
            "contributor": "user10",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2020-01-09",
            "contributor": "user11",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2020-01-09",
            "contributor": "user12",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2020-01-10",
            "contributor": "user13",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2020-02-01",
            "contributor": "user14",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2020-03-01",
            "contributor": "user15",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2020-04-01",
            "contributor": "user16",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2020-05-01",
            "contributor": "user17",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2021-01-01",
            "contributor": "user18",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2021-01-02",
            "contributor": "user19",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2021-01-03",
            "contributor": "user20",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2021-07-01",
            "contributor": "user21",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2021-07-01",
            "contributor": "user22",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2021-08-01",
            "contributor": "user23",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2021-09-01",
            "contributor": "user24",
            "is_first_time_contributor": True,
        },
        {
            "contrib_date": "2021-10-10",
            "contributor": "user25",
            "is_first_time_contributor": True,
        },
    ]

    def test_get_counts_dates(self):
        self.assertEqual(
            [[2020, 2], [2021, 1]],
            get_counts(["2021-01-02", "2020-02-03", "2020-01-01"]),
        )

    def test_get_counts_obj(self):
        self.assertEqual(
            [[2020, 1], [2021, 2]],
            get_counts(
                [
                    {"date": "2020-01-20"},
                    {"date": "2021-01-21"},
                    {"date": "2021-01-22"},
                ],
                lambda x: x["date"],
            ),
        )

    def test_get_issue_counts(self):
        self.assertEqual(
            [[2020, 2, 1], [2021, 1, 2]],
            get_issue_counts(
                [
                    {"event_date": "2021-02-13", "event_type": "closed"},
                    {"event_date": "2020-01-01", "event_type": "opened"},
                    {"event_date": "2020-01-02", "event_type": "opened"},
                    {"event_date": "2020-11-03", "event_type": "closed"},
                    {"event_date": "2021-01-04", "event_type": "opened"},
                    {"event_date": "2021-01-12", "event_type": "closed"},
                ]
            ),
        )

    def test_get_cumulative_contributor_counts(self):
        self.assertEqual(
            (
                [
                    [1, 5],
                    [2, 3],
                    [3, 2],
                    [4, 1],
                    [5, 1],
                    [6, 1],
                    [7, 1],
                    [8, 1],
                    [9, 1],
                    [10, 1],
                    [11, 1],
                    [12, 1],
                    [13, 1],
                    [14, 1],
                    [15, 1],
                    [16, 1],
                    [17, 1],
                    [18, 1],
                    [19, 1],
                    [20, 1],
                ],
                32,
            ),
            get_cumulative_contributor_counts(self.CONTRIBS),
        )

    def test_get_new_vs_returning_contributor_counts(self):
        self.assertEqual(
            [[2020, 17, 0], [2021, 8, 2]],
            get_new_vs_returning_contributor_counts(self.CONTRIBS),
        )
