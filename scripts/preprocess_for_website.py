import argparse
import json
import os

from tqdm import tqdm


def get_counts(dates, transform=lambda x: x):
    years = [transform(date).split("-")[0] for date in dates]
    counts = {}
    for year in years:
        counts[year] = counts.get(year, 0) + 1
    return sorted(
        [[year, count] for year, count in counts.items()], key=lambda elt: elt[0]
    )


def get_issue_counts(dates):
    year_data = [
        (date["event_date"].split("-")[0], date["event_type"]) for date in dates
    ]
    counts = {}
    for year, evt_type in year_data:
        count = counts.get(year, [0, 0])
        idx = 0 if evt_type == "opened" else 1
        count[idx] = count[idx] + 1
        counts[year] = count
    return sorted(
        [[year] + count for year, count in counts.items()], key=lambda elt: elt[0]
    )


def get_cumulative_contributor_counts(contribs):
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


def get_new_vs_returning_contributor_counts(contribs):
    year_data = [
        (
            contrib["contrib_date"].split("-")[0],
            contrib.get("is_first_time_contributor", False),
            contrib.get("contributor", None),
        )
        for contrib in contribs
        if "contributor" in contrib
    ]
    first_year_contrib = {}
    for year, is_first_contrib, contributor in year_data:
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


def get_country_contribution_counts(contribs):
    year_data = [
        [
            contrib.get("year"),
            contrib.get("country", "Unknown"),
            contrib.get("num_pushes"),
        ]
        for contrib in contribs
    ]
    return sorted([d for d in year_data], key=lambda elt: elt[0])


def get_lines(input_dir: str):
    for fi in os.listdir(input_dir):
        with open(os.path.join(input_dir, fi)) as f:
            for line in f:
                yield json.loads(line)


def get_curated_repos():
    repo_to_field = {}
    for fi in os.listdir(os.path.join("repo_lists")):
        if fi.startswith("."):
            continue
        field = fi.replace(".txt", "")
        with open(os.path.join("repo_lists", fi)) as f:
            for line in f:
                line = line.strip()
                if line:
                    repo_to_field[line] = field
    return repo_to_field


def retrieve_data(input_dir: str, output_js: str) -> None:
    seen_ids = set()
    id_to_repo = {}
    field_to_repos = {}
    curated_repos = get_curated_repos()
    languages = set()
    int_keys = {
        "subscribers_count",
        "stargazers_count",
        "open_issues",
        "num_releases",
        "num_contributors",
        "id",
        "used_by",
    }
    unused_keys = {
        "matched_name",
        "topics",
        "sources",
        "pr_events",
        "issue_open_events",
        "ultimate_fork_of",
    }
    for line in tqdm(get_lines(input_dir)):
        if line["id"] in seen_ids:
            continue
        repo_id = line.pop("id")
        repo_name = line["owner_name"] + "/" + line["current_name"]
        seen_ids.add(repo_id)
        row = {}
        for key in int_keys:
            if (key not in line) or not line[key]:
                line[key] = 0
        for key in line.keys():
            if key.endswith("_at"):
                val = line[key].split()[0]
            elif (key in int_keys) and (type(line[key]) == str):
                val = int(line[key].replace(",", "").replace("+", ""))
            else:
                val = line[key]
            row[key] = val
        row["star_dates"] = get_counts(row.pop("star_dates"))
        row["push_dates"] = get_counts(
            row.pop("push_events"), lambda evt: evt["contrib_date"]
        )
        row["issue_dates"] = get_issue_counts(row.pop("issue_events"))
        contribs = row.pop("pr_events")
        row["contrib_counts"], row["num_prs"] = get_cumulative_contributor_counts(
            contribs
        )
        row["pr_dates"] = get_new_vs_returning_contributor_counts(contribs)
        row["country_contributions"] = get_country_contribution_counts(
            row.pop("country_year_contributions")
        )
        row["num_references"] = {}
        if "primary_programming_language" in row:
            lang = row.pop("primary_programming_language")
            languages.add(lang)
            row["language"] = lang
        if repo_name in curated_repos:
            field_to_repos[curated_repos[repo_name]] = field_to_repos.get(
                curated_repos[repo_name], []
            ) + [repo_id]
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
                if row["num_references"][field_name] > 1:
                    field_to_repos[field_name].add(repo_id)
        if not (
            repo_name in curated_repos
            or any(
                [row["num_references"][field] > 1 for field in row["num_references"]]
            )
        ):
            continue
        for k in unused_keys:
            if k in row:
                row.pop(k)
        id_to_repo[int(repo_id)] = row
    sizeable_fields = {
        field for field in field_to_repos.keys() if len(field_to_repos[field]) > 5
    }
    field_to_repos = {
        fn: list(elts) for fn, elts in field_to_repos.items() if fn in sizeable_fields
    }
    with open(output_js, mode="w") as f:
        f.write(f"const id_to_repo = {id_to_repo};\n")
        f.write(f"const field_to_repos = {field_to_repos};\n")
        f.write(f"const languages = {list(languages)};\n")
        f.write(f"const fields = {list(sizeable_fields)};\n")
        f.write("export {id_to_repo, field_to_repos, fields, languages};")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_dir", default="gh_website_stats")
    parser.add_argument(
        "--output_js",
        default=os.path.join("github-metrics", "src", "data", "constants.js"),
    )
    args = parser.parse_args()

    retrieve_data(args.input_dir, args.output_js)
