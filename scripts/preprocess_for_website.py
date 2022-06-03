import argparse
import json
import os
from datetime import datetime

from google.cloud import bigquery
from tqdm import tqdm


def get_counts_by_month(dates):
    months = [date.strftime("%Y-%m") for date in dates]
    counts = {}
    for month in months:
        counts[month] = counts.get(month, 0) + 1
    return sorted(
        [(month, count) for month, count in counts.items()], key=lambda elt: elt[0]
    )


def retrieve_data(
    input_table: str, output_repo_file: str, output_field_file: str
) -> None:
    client = bigquery.Client()
    query_job = client.query(f"select * from {input_table}")
    results = query_job.result()
    seen_ids = set()
    fmt_data = {}
    field_to_repos = {}
    for result in tqdm(results):
        if result["id"] in seen_ids:
            continue
        seen_ids.add(result["id"])
        row = {}
        for key in result.keys():
            row[key] = (
                result[key]
                if not key.endswith("_at")
                else datetime.strftime(result[key], "%Y-%m-%d")
            )
        row["star_dates"] = get_counts_by_month(row.pop("star_dates"))
        row["push_dates"] = get_counts_by_month(row.pop("push_dates"))
        assert row["open_issues_count"] == row["open_issues"], row
        row.pop("open_issues_count")
        for paper_meta in row["paper_meta"]:
            for field in paper_meta["fields"]:
                field_name = field["name"]
                if field_name not in field_to_repos:
                    field_to_repos[field_name] = []
                field_to_repos[field_name].append(row["id"])
        fmt_data[int(row["id"])] = row
    with open(output_repo_file, mode="w") as f:
        f.write(f"const repo_data={json.dumps(fmt_data)};\n\nexport default repo_data;")
    with open(output_field_file, mode="w") as f:
        f.write(
            f"const field_to_repos={json.dumps(field_to_repos)};\n\nexport default field_to_repos;"
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_table", default="staging_github_metrics.website_stats")
    parser.add_argument(
        "--output_repo_file",
        default=os.path.join("github-metrics", "src", "data", "repos.js"),
    )
    parser.add_argument(
        "--output_field_file",
        default=os.path.join("github-metrics", "src", "data", "fields.js"),
    )
    args = parser.parse_args()

    retrieve_data(args.input_table, args.output_repo_file, args.output_field_file)
