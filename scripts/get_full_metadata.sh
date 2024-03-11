#!/bin/bash

working_dir=$1
data_bucket=$2
production_dataset=$3
done_file="get_full_metadata"

cd $working_dir
gsutil rm "gs://${data_bucket}/${production_dataset}/done_files/${done_file}"
PYTHONPATH='.' python3 scripts/backfill_top_level_repo_data.py && touch $done_file
gsutil cp $done_file "gs://${data_bucket}/${production_dataset}/done_files/"
