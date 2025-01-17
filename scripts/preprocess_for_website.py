import argparse
import json
import math
import os
import shutil
import tempfile
from datetime import datetime
from typing import Tuple

import pycountry
from google.cloud import bigquery, storage
from tqdm import tqdm

from scripts.constants import (
    INT_KEYS,
    LICENSE_TO_GROUP,
    MANUAL_COUNTRY_MAPPING,
    MIN_FIELD_REFERENCES,
    OTHER_LICENSE,
    UNUSED_KEYS,
)

NOW = datetime.now()
END_YEAR = NOW.year if NOW.month > 6 else NOW.year - 1
START_YEAR = END_YEAR - 6


def add_repo_tfidf(id_to_repo: dict, num_fields: int) -> None:
    """
    Gets a tfidf-inspired score for each repo. In this case, the "terms" are repo mentions, and the "documents"
    are fields. See also https://en.wikipedia.org/wiki/Tf%E2%80%93idf
    :param id_to_repo: Dict mapping repo ids to (among other metadata) counts of occurrences in papers within fields
    :param num_fields: The number of total fields
    :return: None (mutates id_to_repo)
    """
    for id in id_to_repo:
        field_counts = id_to_repo[id]["num_references"]
        df = len(field_counts)
        # df may be 0 for repos we didn't extract from literature mentions
        idf = math.log(num_fields / (df + 1))
        id_to_repo[id]["relevance"] = {}
        for field in field_counts:
            tf = field_counts[field]
            id_to_repo[id]["relevance"][field] = round(tf * idf, 2)


def get_counts(dates: list, transform=lambda x: x) -> list:
    """
    Transform a list of dates into a list of year, count pairs ordered by year
    :param dates: List of dates
    :param transform: Function to transform the date (for example, if the date is an object not a string, we can use
        this to access one of its values
    :return: A list of year, count pairs
    """
    years = [int(transform(date).split("-")[0]) for date in dates]
    counts = {}
    for year in years:
        if (year >= START_YEAR) and (year <= END_YEAR):
            counts[year] = counts.get(year, 0) + 1
    return sorted(
        [[year, count] for year, count in counts.items()], key=lambda elt: elt[0]
    )


def get_issue_counts(dates: list) -> list:
    """
    Transform a list of issue events containing date and event type into a triple of
    year, issue open count, and issue close count
    :param dates: List of issue events containing date and event type
    :return: List of triples of year, issue open count, and issue close count
    """
    year_data = [
        (int(date["event_date"].split("-")[0]), date["event_type"]) for date in dates
    ]
    counts = {}
    for year, evt_type in year_data:
        if (year >= START_YEAR) and (year <= END_YEAR):
            count = counts.get(year, [0, 0])
            idx = 0 if evt_type == "opened" else 1
            count[idx] = count[idx] + 1
            counts[year] = count
    return sorted(
        [[year] + count for year, count in counts.items()], key=lambda elt: elt[0]
    )


def reformat_downloads(downloads: list) -> list:
    """
    Clean up a list of downloads, converting country codes to country names
    :param dates: List of dicts of pypi count by year
    :return: List of triples of year, country name, and pypi download count
    """
    reformatted_downloads = []
    total_country_counts = {}
    for dl in downloads:
        if not dl:
            continue
        country = "Unknown"
        if "country_code" in dl:
            country_obj = pycountry.countries.get(alpha_2=dl["country_code"])
            if country_obj:
                country = MANUAL_COUNTRY_MAPPING.get(country_obj.name, country_obj.name)
        year = int(dl["year"])
        if (year >= START_YEAR) and (year <= END_YEAR):
            reformatted_downloads.append([year, country, int(dl["num_downloads"])])
            total_country_counts[country] = total_country_counts.get(country, 0) + int(
                dl["num_downloads"]
            )
    top_countries = sorted(
        total_country_counts.keys(), key=lambda c: -1 * total_country_counts[c]
    )[:5]
    return sorted(
        [dl for dl in reformatted_downloads if dl[1] in top_countries],
        key=lambda elt: elt[0],
    )


def get_cumulative_contributor_counts(contribs: list) -> Tuple[list, int]:
    """
    Get a list of contributor ranks and their number of contributions (= number of opened PRs), as well as the total
    number of contributions/PRs
    :param contribs: Array of dicts containing a contributor key
    :return: Tuple of list of contributor ranks and their number of contributions (= number of opened PRs), and the
    total number of contributions/PRs across all contributors
    """
    contrib_counts = {}
    for contrib in contribs:
        if "contributor" not in contrib:
            continue
        contrib_counts[contrib["contributor"]] = (
            contrib_counts.get(contrib["contributor"], 0) + 1
        )
    total_counts = sum([count for _, count in contrib_counts.items()])
    top_contributors = sorted(
        [[contrib, count] for contrib, count in contrib_counts.items()],
        key=lambda elt: -1 * elt[1],
    )[:20]
    return [
        [idx + 1, count] for idx, [_, count] in enumerate(top_contributors)
    ], total_counts


def get_new_vs_returning_contributor_counts(contribs: list) -> list:
    """
    Given a list of contribution metadata dicts (date of PR, boolean "is_first_time_contributor", and user identifier),
    return a list of triples of year, count of new contributors, and count of returning contributors
    :param contribs: List of contribution metadata dicts (date of PR, boolean "is_first_time_contributor",
    and user identifier)
    :return: List of triples of year, count of new contributors, and count of returning contributors
    """
    year_data = [
        (
            int(contrib["contrib_date"].split("-")[0]),
            contrib.get("is_first_time_contribution", False),
            contrib.get("contributor", None),
        )
        for contrib in contribs
        if "contributor" in contrib
    ]
    first_year_contrib = {}
    for year, is_first_contrib, contributor in year_data:
        if (year >= START_YEAR) and (year <= END_YEAR):
            if year not in first_year_contrib:
                first_year_contrib[year] = {}
            new_is_first = (
                first_year_contrib[year].get(contributor, is_first_contrib)
                or is_first_contrib
            )
            first_year_contrib[year][contributor] = new_is_first
    counts = {}
    for year in first_year_contrib:
        count = counts.get(year, [0, 0])
        for contributor in first_year_contrib[year]:
            idx = 0 if first_year_contrib[year][contributor] else 1
            count[idx] = count[idx] + 1
            counts[year] = count
    return sorted(
        [[year] + count for year, count in counts.items()], key=lambda elt: elt[0]
    )


def get_entity_contribution_counts(contribs: list, entity_key: str) -> list:
    """
    Given a list of dicts containing the number of commits per year for some entity,
    and the key in that dict which identifies the committing entity, returns a sorted
    list of triples of year, the entity name, and the number of commits made by that entity
    :param contribs: List of dicts containing the number of commits per year for some entity
    :param entity_key: Key in `contribs` identifying the committing entity
    :return: List of triples of year, entity name, and the number of commits made by that entity
    """
    year_data = [
        [
            int(contrib.get("year")),
            contrib.get(entity_key, "Unknown"),
            contrib.get("num_commits"),
        ]
        for contrib in contribs
    ]
    return sorted(
        [d for d in year_data if (d[0] >= START_YEAR) and (d[0] <= END_YEAR)],
        key=lambda elt: elt[0],
    )


def get_lines(input_dir: str) -> iter:
    """
    For each file in an input dir, read the file and parse each line as json. Return a generator of these lines
    :param input_dir: Dir containing jsonls
    :return: A generator of jsons read from the files in `input_dir`
    """
    for fi in os.listdir(input_dir):
        with open(os.path.join(input_dir, fi)) as f:
            for line in f:
                yield json.loads(line)


def get_curated_repos():
    """
    Get hand-selected repos, which we treat differently from the ones that were found in the scholarly literature
    :return: A dict mapping repo names to one or more "field names" which are parsed from the file name(s) in the
        `repo_lists` directory where the repo appears
    """
    repo_to_field = {}
    for fi in os.listdir("repo_lists"):
        if (fi == "weto.txt") or fi.startswith(".") or not fi.endswith(".txt"):
            continue
        field = fi.replace(".txt", "")
        with open(os.path.join("repo_lists", fi)) as f:
            for line in f:
                line = line.strip()
                if line:
                    repo_to_field[line] = repo_to_field.get(line, []) + [field]
    for category in os.listdir(
        os.path.join("repo_lists", "open_sustainable_technology")
    ):
        for sub_category in os.listdir(
            os.path.join("repo_lists", "open_sustainable_technology", category)
        ):
            with open(
                os.path.join(
                    "repo_lists", "open_sustainable_technology", category, sub_category
                )
            ) as f:
                for line in f:
                    line = line.strip()
                    if line:
                        repo_to_field[line] = repo_to_field.get(line, []) + [category]
    with open(os.path.join("repo_lists", "weto.txt")) as f:
        for line in f:
            line = line.strip()
            if line:
                repo_to_field[line] = repo_to_field.get(line, []) + ["weto"]
                if "Renewable Energy" not in repo_to_field.get(line):
                    repo_to_field[line].append("Renewable Energy")
    return repo_to_field


def get_grouped_license(raw_license: str) -> str:
    """
    Given a raw license string, returns a higher-level license type
    :param raw_license: License to group
    :return: Grouped license
    """
    if raw_license not in LICENSE_TO_GROUP:
        print(f"Warning, mapping unknown license {raw_license} to {OTHER_LICENSE}")
    return LICENSE_TO_GROUP.get(raw_license, OTHER_LICENSE)


def clean_row(raw_row: dict) -> dict:
    """
    Clean up raw data, normalizing strings and removing unused keys
    :param raw_row: raw repo metadata
    :return: clean repo metadata
    """
    row = {}
    for key in raw_row.keys():
        if key in UNUSED_KEYS:
            continue
        if key.endswith("_at"):
            # it's a timestamp, take the date part
            val = raw_row[key].split()[0]
        elif (key in INT_KEYS) and (type(raw_row.get(key, 0)) == str):
            # clean up scraped strings
            val = int(raw_row[key].replace(",", "").replace("+", ""))
        else:
            val = raw_row[key]
        row[key] = val
    for key in INT_KEYS:
        if (key not in row) or not row[key]:
            row[key] = 0
    if "description" in row:
        row["description"] = row["description"].replace("\ufffd", "").strip()
    return row


def reformat_row(row: dict) -> None:
    """
    Reformat data
    :param row: Data in need of reformatting
    :return: None (mutates `row`)
    """
    row["star_dates"] = get_counts(row.pop("star_dates"))
    contribs = row.pop("push_events")
    # todo rename this key
    row["push_dates"] = get_counts(contribs, lambda evt: evt["contrib_date"])
    row["issue_dates"] = get_issue_counts(row.pop("issue_events"))
    row["contrib_counts"], row["num_commits"] = get_cumulative_contributor_counts(
        contribs
    )
    row["commit_dates"] = get_new_vs_returning_contributor_counts(contribs)
    #    row["country_contributions"] = get_entity_contribution_counts(
    #        row.pop("country_year_contributions"), "country"
    #    )
    #    row["org_contributions"] = get_entity_contribution_counts(
    #        row.pop("org_year_contributions"), "org"
    #    )
    row["num_references"] = {}
    if "primary_programming_language" in row:
        row["language"] = row.pop("primary_programming_language")
    row["downloads"] = reformat_downloads(row.pop("downloads"))


def read_rows(input_dir: str) -> tuple:
    """
    Does a first pass over the data, cleaning fields that don't need information about the overall data distribution
    :param input_dir: Directory of repo metadata as jsonl BQ exports
    :return: A tuple of dicts. The first maps fields to repos, the second maps primary programming languages to counts,
    and the third maps ids to repo metadata
    """
    seen_ids = set()
    id_to_repo = {}
    curated_repos = get_curated_repos()
    field_to_repos = {}
    language_counts = {}

    for line in tqdm(get_lines(input_dir)):
        repo_id = line.pop("id")
        repo_name = line["owner_name"] + "/" + line["current_name"]
        if repo_name in seen_ids:
            continue
        seen_ids.add(repo_name)
        row = clean_row(line)
        reformat_row(row)
        if repo_name in curated_repos:
            for field in curated_repos[repo_name]:
                if field not in field_to_repos:
                    field_to_repos[field] = set()
                field_to_repos[field].add(repo_id)
        for paper_meta in row.pop("paper_meta"):
            for field in paper_meta["fields"]:
                field_name = field["name"]
                if not field_name:
                    continue
                if field_name not in field_to_repos:
                    field_to_repos[field_name] = set()
                if field_name not in row["num_references"]:
                    row["num_references"][field_name] = 0
                row["num_references"][field_name] += 1
                if row["num_references"][field_name] >= MIN_FIELD_REFERENCES:
                    field_to_repos[field_name].add(repo_id)
        if (
            not (
                repo_name in curated_repos
                or any(
                    [
                        row["num_references"][field] >= MIN_FIELD_REFERENCES
                        for field in row["num_references"]
                    ]
                )
            )
        ) and not (repo_name.lower() == "parsl/parsl"):
            continue
        row["language"] = row.get("language", "No language detected")
        language_counts[row["language"]] = language_counts.get(row["language"], 0) + 1
        id_to_repo[int(repo_id)] = row
    return field_to_repos, language_counts, id_to_repo


def write_download_data(ids_to_repos: dict) -> None:
    """
    Write data to share in export
    :param ids_to_repos: Mapping from repo ids to metadata
    :return: None
    """
    parent_dir = os.path.join("github-metrics", "static")
    os.makedirs(parent_dir, exist_ok=True)
    with open(os.path.join(parent_dir, "orca_download.jsonl"), mode="w") as f:
        first_line = True
        for id, meta in ids_to_repos.items():
            meta["github_id"] = id
            meta.pop("top_articles")
            meta["star_dates"] = [
                {"year": year, "count": count} for year, count in meta["star_dates"]
            ]
            meta["push_dates"] = [
                {"year": year, "count": count} for year, count in meta["push_dates"]
            ]
            meta["issue_dates"] = [
                {"year": year, "opened_count": open_count, "closed_count": close_count}
                for year, open_count, close_count in meta["issue_dates"]
            ]
            meta["contrib_counts"] = [
                {"contributor_rank": rank, "num_contributions": num_contrib}
                for rank, num_contrib in meta["contrib_counts"]
            ]
            meta["commit_dates"] = [
                {
                    "year": year,
                    "first_time_contributor_contributions": first_time,
                    "returning_contributor_contributions": returning,
                }
                for year, first_time, returning in meta["commit_dates"]
            ]
            meta["downloads"] = [
                {"year": year, "country": country, "count": count}
                for year, country, count in meta["downloads"]
            ]
            f.write(("" if first_line else "\n") + json.dumps(meta))
            first_line = False


def write_included_to_bq(id_to_repo: dict) -> None:
    """
    Write the set of repos that will appear in ORCA to BigQuery
    :param id_to_repo: dict mapping repo id to repo metadata
    :return: None
    """
    client = bigquery.Client()
    production_table = "gcp-cset-projects.orca.displayed_repos"
    backups_table = f"gcp-cset-projects.orca_backups.displayed_repos_{datetime.today().strftime('%Y%m%d')}"

    job_config = bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
        autodetect=True,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
    )

    with tempfile.TemporaryDirectory() as td:
        tmp_data = os.path.join(td, "repos.jsonl")
        with open(tmp_data, "w") as f:
            for id in id_to_repo:
                f.write(
                    json.dumps(
                        {
                            "repo": f"{id_to_repo[id]['owner_name']}/{id_to_repo[id]['current_name']}"
                        }
                    )
                    + "\n"
                )
        for table in [production_table, backups_table]:
            with open(tmp_data, "rb") as source_file:
                job = client.load_table_from_file(
                    source_file, table, job_config=job_config
                )
                job.result()


def write_data(input_dir: str, output_dir: str) -> None:
    """
    Reads repo metadata, cleans it up, writes it out for the webapp
    :param input_dir: Directory of repo metadata as jsonl BQ exports
    :param output_dir: Directory where output json should be written for the webapp
    :return: None
    """
    # TODO: refactor, this is getting long
    field_to_repos, language_counts, id_to_repo = read_rows(input_dir)
    with open(os.path.join("fields", "exclude.txt")) as f:
        exclude = {line.strip() for line in f.readlines() if line.strip()}
    with open(os.path.join("fields", "expected.txt")) as f:
        expected = {line.strip() for line in f.readlines() if line.strip()}
    sizeable_fields = set()
    # need a copy of the field list to avoid RuntimeError: dictionary changed size during iteration
    fields = {f for f in field_to_repos}
    for field in fields:
        if (field not in exclude) and (len(field_to_repos[field]) > 10):
            if field not in expected:
                print(f"Unexpected field: {field}")
            sizeable_fields.add(field)
            field_to_repos[field] = list(field_to_repos[field])
        else:
            field_to_repos.pop(field)
    language_to_canonical_name = {}
    for lang in language_counts:
        lower_lang = lang.lower()
        # Take the lexicographically first language name as the "canonical" name
        if (
            lower_lang not in language_to_canonical_name
            or language_to_canonical_name[lower_lang] > lang
        ):
            language_to_canonical_name[lower_lang] = lang
    for repo_id in id_to_repo:
        id_to_repo[repo_id]["num_references"] = {
            k: v
            for k, v in id_to_repo[repo_id]["num_references"].items()
            if k in sizeable_fields
        }
        id_to_repo[repo_id]["license_group"] = get_grouped_license(
            id_to_repo[repo_id].get("license")
        )
        # Map null to the nicer name we have in the grouped license mapping
        id_to_repo[repo_id]["license"] = id_to_repo[repo_id].get(
            "license", id_to_repo[repo_id]["license_group"]
        )
        language = language_to_canonical_name[
            id_to_repo[repo_id].get("language").lower()
        ]
        id_to_repo[repo_id]["language"] = language
        if language_counts[language] < 20:
            language = "Other"
        id_to_repo[repo_id]["language_group"] = language
    name_to_id = {
        id_to_repo[id]["owner_name"] + "/" + id_to_repo[id]["current_name"]: id
        for id in id_to_repo
    }
    if len(field_to_repos) > 0:
        add_repo_tfidf(id_to_repo, len(field_to_repos))
    for out_fi, data in [
        ("id_to_repo", id_to_repo),
        ("name_to_id", name_to_id),
        ("field_to_repos", field_to_repos),
        ("fields", list(sizeable_fields)),
    ]:
        with open(os.path.join(output_dir, out_fi + ".json"), mode="w") as f:
            f.write(json.dumps(data))
    write_download_data(id_to_repo)
    write_included_to_bq(id_to_repo)


def write_config(config_fi: str) -> None:
    """
    Writes out start and end year for use by the webapp
    :param config_fi: Path to file where config info should be written
    :return: None
    """
    with open(config_fi, mode="w") as f:
        f.write(
            json.dumps(
                {
                    "start_year": START_YEAR,
                    "end_year": END_YEAR,
                    "last_updated": datetime.now().strftime("%B %d, %Y"),
                }
            )
        )


if __name__ == "__main__":
    default_data_dir = os.path.join("github-metrics", "src", "data")
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", default=default_data_dir)
    args = parser.parse_args()

    # we have to pull the data down from gcs like this rather than reading directly from BigQuery because
    # the latter is prohibitively slow
    input_dir = "website_stats"
    if os.path.exists(input_dir):
        shutil.rmtree(input_dir)
    os.makedirs(input_dir)
    client = storage.Client()
    bucket = client.get_bucket("airflow-data-exchange")
    for blob in client.list_blobs(
        "airflow-data-exchange", prefix="orca/tmp/website_stats"
    ):
        blob.download_to_filename(
            os.path.join(input_dir, blob.name.strip("/").split("/")[-1])
        )
    write_data(input_dir, args.data_dir)
    write_config(os.path.join(args.data_dir, "config.json"))
