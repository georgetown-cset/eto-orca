import json
import os
from datetime import datetime, timedelta

from airflow import DAG
from airflow.contrib.operators.bigquery_check_operator import BigQueryCheckOperator
from airflow.contrib.operators.bigquery_operator import BigQueryOperator
from airflow.contrib.operators.bigquery_to_bigquery import BigQueryToBigQueryOperator
from airflow.contrib.operators.gcs_delete_operator import (
    GoogleCloudStorageDeleteOperator,
)
from airflow.contrib.operators.gcs_to_bq import GoogleCloudStorageToBigQueryOperator
from airflow.contrib.operators.slack_webhook_operator import SlackWebhookOperator
from airflow.hooks.base_hook import BaseHook
from airflow.operators import DummyOperator
from airflow.operators.python_operator import BranchPythonOperator, PythonOperator
from dataloader.airflow_utils.slack import task_fail_slack_alert
from dataloader.scripts.populate_documentation import update_table_descriptions
from github_repo_monitor_scripts.retrieve_repo_metadata import airflow_runner

default_args = {
    "owner": "airflow",
    "depends_on_past": False,
    "retries": 0,
    "start_date": datetime(2021, 3, 29),
    "retry_delay": timedelta(minutes=5),
    # "on_failure_callback": task_fail_slack_alert # don't enable while testing!!
}

data_to_table_name_map = {
    "repository": "repositories",
    "repository-metric-snapshots": "metric_history",
}

with DAG(
    "ml_repo_etl",
    default_args=default_args,
    description="Retrieves ML repo metadata",
    schedule_interval=None,
) as dag:
    slack_webhook_token = BaseHook.get_connection("slack").password
    bucket = "airflow-data-exchange"
    production_dataset = "github_repo_monitor"
    tmp_dir = f"{production_dataset}/tmp"
    schema_dir = f"{production_dataset}/schemas"
    backups_dir = f"{production_dataset}/backups"
    sql_dir = f"sql/{production_dataset}"
    sequence_dir = f"sequences/{production_dataset}"
    staging_dataset = f"staging_{production_dataset}"
    backups_dataset = f"{production_dataset}_backups"
    project_id = "gcp-cset-projects"

    clear_tmp_dir = GoogleCloudStorageDeleteOperator(
        task_id="clear_tmp_dir", bucket_name=bucket, prefix=tmp_dir
    )

    retrieve_metadata = PythonOperator(
        task_id="retrieve_metadata",
        python_callable=airflow_runner,
        op_kwargs={
            "bucket": bucket,
            "output_tmp_dir": tmp_dir,
            "output_backup_dir": backups_dir,
            "gcs_manually_collected_path": f"{production_dataset}/manually_collected_links.jsonl",
        },
    )

    start_checks = DummyOperator(task_id="start_checks")

    prod_data = ["repository", "repository-metric-snapshots"]
    for data_fi in prod_data:
        table = data_to_table_name_map[data_fi]
        load = GoogleCloudStorageToBigQueryOperator(
            task_id=f"load_{table}",
            bucket=bucket,
            source_objects=[f"{tmp_dir}/{data_fi}.jsonl"],
            schema_object=f"{production_dataset}/schemas/{data_fi}.json",
            destination_project_dataset_table=f"{staging_dataset}.{table}",
            source_format="NEWLINE_DELIMITED_JSON",
            create_disposition="CREATE_IF_NEEDED",
            write_disposition="WRITE_TRUNCATE",
        )
        retrieve_metadata >> load >> start_checks

    wait_for_checks = DummyOperator(task_id="wait_for_checks")
    wait_for_prod = DummyOperator(task_id="wait_for_prod")

    for metric_column in [
        "commits_count",
        "contributors_count",
        "forks_count",
        "open_issues_count",
        "releases_count",
        "stargazers_count",
        "subscribers_count",
        "used_by_count",
    ]:
        check = BigQueryCheckOperator(
            task_id=f"check_{metric_column}_not_empty",
            sql=f"select sum({metric_column}) > 0 from {staging_dataset}.metric_history",
            use_legacy_sql=False,
        )
        start_checks >> check >> wait_for_checks

    mk_metric_history = BigQueryOperator(
        task_id="mk_metric_history",
        sql=f"select * from {staging_dataset}.metric_history "
        f"union all select * from {production_dataset}.metric_history",
        destination_dataset_table=f"{production_dataset}.metric_history",
        create_disposition="CREATE_IF_NEEDED",
        write_disposition="WRITE_TRUNCATE",
        use_legacy_sql=False,
    )

    mk_repositories = BigQueryToBigQueryOperator(
        task_id="mk_repositories",
        source_project_dataset_tables=[f"{staging_dataset}.repositories"],
        destination_project_dataset_table=f"{production_dataset}.repositories",
        create_disposition="CREATE_IF_NEEDED",
        write_disposition="WRITE_TRUNCATE",
    )

    success_alert = SlackWebhookOperator(
        task_id="post_success",
        http_conn_id="slack",
        webhook_token=slack_webhook_token,
        message="ML repo metadata update succeeded!",
        username="airflow",
    )

    curr_date = datetime.now().strftime("%Y%m%d")
    with open(
        f"{os.environ.get('DAGS_FOLDER')}/schemas/{production_dataset}/table_descriptions.json"
    ) as f:
        table_desc = json.loads(f.read())
    for data_fi in prod_data:
        table = data_to_table_name_map[data_fi]
        pop_descriptions = PythonOperator(
            task_id="populate_column_documentation_for_" + table,
            op_kwargs={
                "input_schema": f"{os.environ.get('DAGS_FOLDER')}/schemas/{production_dataset}/{data_fi}.json",
                "table_name": f"{production_dataset}.{table}",
                "table_description": table_desc[table],
            },
            python_callable=update_table_descriptions,
        )

        table_backup = BigQueryToBigQueryOperator(
            task_id=f"back_up_{table}",
            source_project_dataset_tables=[f"{production_dataset}.{table}"],
            destination_project_dataset_table=f"{backups_dataset}.{table}_{curr_date}",
            create_disposition="CREATE_IF_NEEDED",
            write_disposition="WRITE_TRUNCATE",
        )
        wait_for_prod >> pop_descriptions >> table_backup >> success_alert

    clear_tmp_dir >> retrieve_metadata
    wait_for_checks >> [mk_metric_history, mk_repositories] >> wait_for_prod
