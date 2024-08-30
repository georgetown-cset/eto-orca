#!/bin/bash

working_dir=$1
data_bucket=$2
production_dataset=$3
tmp_dir=$4
done_file="scrape_additional_metadata"

cd $working_dir
gsutil rm "gs://${data_bucket}/${production_dataset}/done_files/${done_file}"
PYTHONPATH='.' python3 scripts/retrieve_repo_metadata.py curr_repos_filled.jsonl curr_repos_final.jsonl
gsutil cp curr_repos_final.jsonl "gs://${data_bucket}/${tmp_dir}/" && touch $done_file
gsutil cp $done_file "gs://${data_bucket}/${production_dataset}/done_files/"
