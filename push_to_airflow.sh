gsutil cp ml_repo_dag.py gs://us-east1-dev-888d59ac-bucket/dags/
gsutil cp scripts/* gs://us-east1-dev-888d59ac-bucket/dags/github_repo_monitor_scripts/
gsutil cp data/manually_collected_links.jsonl gs://airflow-data-exchange/github_repo_monitor/
gsutil cp schemas/* gs://airflow-data-exchange/github_repo_monitor/schemas/
gsutil cp schemas/* gs://us-east1-dev-888d59ac-bucket/dags/schemas/github_repo_monitor/
