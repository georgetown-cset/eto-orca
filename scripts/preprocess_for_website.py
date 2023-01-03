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


def get_lines(input_dir: str):
    for fi in os.listdir(input_dir):
        with open(os.path.join(input_dir, fi)) as f:
            for line in f:
                yield json.loads(line)


def retrieve_data(input_dir: str, output_js: str) -> None:
    seen_ids = set()
    id_to_repo = {}
    field_to_repos = {}
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
    }
    for line in tqdm(get_lines(input_dir)):
        if line["id"] in seen_ids:
            continue
        repo_id = line.pop("id")
        seen_ids.add(repo_id)
        row = {}
        for key in line.keys():
            if key.endswith("_at"):
                val = line[key].split()[0]
            elif key in int_keys:
                val = int(line[key].replace(",", "").replace("+", ""))
            else:
                val = line[key]
            row[key] = val
        row["star_dates"] = get_counts(row.pop("star_dates"))
        row["push_dates"] = get_counts(
            row.pop("push_events"), lambda evt: evt["contrib_date"]
        )
        row["issue_dates"] = get_issue_counts(row.pop("issue_events"))
        row["num_references"] = {}
        if "primary_programming_language" in row:
            lang = row.pop("primary_programming_language")
            languages.add(lang)
            row["language"] = lang
        for paper_meta in row.pop("paper_meta"):
            for field in paper_meta["fields"]:
                field_name = field["name"]
                if field_name not in field_to_repos:
                    field_to_repos[field_name] = set()
                if field_name not in row["num_references"]:
                    row["num_references"][field_name] = 0
                row["num_references"][field_name] += 1
                if row["num_references"][field_name] > 1:
                    field_to_repos[field_name].add(repo_id)
        if not any(
            [row["num_references"][field] > 1 for field in row["num_references"]]
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
