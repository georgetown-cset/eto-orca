gsutil cp orca_data_pipeline.py gs://us-east1-production-cc2-202-b42a7a54-bucket/dags/
gsutil -m rm gs://airflow-data-exchange/orca/schemas/*
gsutil -m cp schemas/* gs://airflow-data-exchange/orca/schemas/
gsutil -m rm gs://us-east1-production-cc2-202-b42a7a54-bucket/dags/schemas/orca/*
gsutil -m cp schemas/* gs://us-east1-production-cc2-202-b42a7a54-bucket/dags/schemas/orca/
gsutil rm -r gs://airflow-data-exchange/orca/code
gsutil -m cp -r scripts gs://airflow-data-exchange/orca/code/
gsutil -m cp -r input_data gs://airflow-data-exchange/orca/code/
gsutil cp requirements.txt gs://airflow-data-exchange/orca/code/
gsutil cp sequences/* gs://us-east1-production-cc2-202-b42a7a54-bucket/dags/sequences/orca/
gsutil -m rm gs://us-east1-production-cc2-202-b42a7a54-bucket/dags/sql/orca/*
gsutil -m cp sql/* gs://us-east1-production-cc2-202-b42a7a54-bucket/dags/sql/orca/
