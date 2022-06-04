import argparse
import json
import os
import pickle

from tqdm import tqdm


def get_counts_by_month(dates):
    months = ["-".join(date.split("-")[:2]) for date in dates]
    counts = {}
    for month in months:
        counts[month] = counts.get(month, 0) + 1
    return sorted(
        [(month, count) for month, count in counts.items()], key=lambda elt: elt[0]
    )


def get_lines(input_dir: str):
    for fi in os.listdir(input_dir):
        with open(os.path.join(input_dir, fi)) as f:
            for line in f:
                yield json.loads(line)


def retrieve_data(
    input_dir: str, output_repo_file: str, output_field_file: str
) -> None:
    seen_ids = set()
    id_to_repo = {}
    field_to_repos = {}
    for line in tqdm(get_lines(input_dir)):
        if line["id"] in seen_ids:
            continue
        seen_ids.add(line["id"])
        row = {}
        for key in line.keys():
            row[key] = line[key] if not key.endswith("_at") else line[key].split()[0]
        row["star_dates"] = get_counts_by_month(row.pop("star_dates"))
        row["push_dates"] = get_counts_by_month(row.pop("push_dates"))
        assert row["open_issues_count"] == row["open_issues"], row
        row.pop("open_issues_count")
        for paper_meta in row.pop("paper_meta"):
            for field in paper_meta["fields"]:
                field_name = field["name"]
                if field_name not in field_to_repos:
                    field_to_repos[field_name] = []
                field_to_repos[field_name].append(row["id"])
        id_to_repo[int(row["id"])] = row
    with open(output_repo_file, mode="wb") as f:
        pickle.dump(id_to_repo, f)
    with open(output_field_file, mode="wb") as f:
        pickle.dump(field_to_repos, f)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_dir", default="gh_website_stats")
    parser.add_argument(
        "--output_repo_file",
        default=os.path.join("get_data_cloud_fn", "data", "id_to_repo.pkl"),
    )
    parser.add_argument(
        "--output_field_file",
        default=os.path.join("get_data_cloud_fn", "data", "field_to_repo.pkl"),
    )
    args = parser.parse_args()

    retrieve_data(args.input_dir, args.output_repo_file, args.output_field_file)
