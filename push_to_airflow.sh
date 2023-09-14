gsutil cp orca_data_pipeline.py gs://us-east1-dev2023-cc1-b088c7e1-bucket/dags/
gsutil -m rm gs://airflow-data-exchange-development/orca/schemas/*
gsutil -m cp schemas/* gs://airflow-data-exchange-development/orca/schemas/
gsutil -m rm gs://us-east1-dev2023-cc1-b088c7e1-bucket/dags/schemas/orca/*
gsutil -m cp schemas/* gs://us-east1-dev2023-cc1-b088c7e1-bucket/dags/schemas/orca/
gsutil rm -r gs://airflow-data-exchange-development/orca/code
gsutil -m cp -r scripts gs://airflow-data-exchange-development/orca/code/
gsutil -m cp -r input_data gs://airflow-data-exchange-development/orca/code/
gsutil cp requirements.txt gs://airflow-data-exchange-development/orca/code/
gsutil cp sequences/* gs://us-east1-dev2023-cc1-b088c7e1-bucket/dags/sequences/orca/
gsutil -m rm gs://us-east1-dev2023-cc1-b088c7e1-bucket/dags/sql/orca/*
gsutil -m cp sql/* gs://us-east1-dev2023-cc1-b088c7e1-bucket/dags/sql/orca/
