import unittest

from scripts.retrieve_repos import RepoRetriever


class TestRetrieveRepos(unittest.TestCase):
    def setUp(self) -> None:
        self.retriever = RepoRetriever(is_test=True)

    def test_get_repo_record_non_repo(self):
        self.assertEqual(
            [],
            self.retriever.get_repo_record(
                "https://testtesttest.github.io/foo/bar.html"
            ),
        )

    def test_embedded_repo_found(self):
        self.assertEqual(
            [{"url": "foo/bar", "repo_name": "bar", "owner_name": "foo"}],
            self.retriever.get_repo_record(
                "This is a really interesting repo!https://github.com/foo/bar,wow!"
            ),
        )

    def test_messy_repo_is_cleaned(self):
        # I've seen some weird stuff coming out of the scholarly lit...
        self.assertEqual(
            [{"url": "foo1/bar2", "repo_name": "bar2", "owner_name": "foo1"}],
            self.retriever.get_repo_record("https://GiThuB-com/foo1/bar2"),
        )

    def test_multiple_repos_extracted(self):
        # I've seen some weird stuff coming out of the scholarly lit...
        self.assertEqual(
            [
                {"url": "foo1/bar2", "repo_name": "bar2", "owner_name": "foo1"},
                {"url": "foo2/bar3", "repo_name": "bar3", "owner_name": "foo2"},
            ],
            self.retriever.get_repo_record(
                "check out https://GiThuB-com/foo1/bar2 and also https://github.com/foo2/bar3!"
            ),
        )
