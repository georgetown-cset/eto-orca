import json
from datetime import datetime

from airflow import DAG
from airflow.operators.bash_operator import BashOperator
from airflow.operators.dummy import DummyOperator
from airflow.operators.python import PythonOperator
from airflow.providers.google.cloud.operators.bigquery import (
    BigQueryCheckOperator,
    BigQueryInsertJobOperator,
)
from airflow.providers.google.cloud.operators.compute import (
    ComputeEngineStartInstanceOperator,
    ComputeEngineStopInstanceOperator,
)
from airflow.providers.google.cloud.operators.gcs import GCSDeleteObjectsOperator
from airflow.providers.google.cloud.sensors.gcs import GCSObjectExistenceSensor
from airflow.providers.google.cloud.transfers.bigquery_to_bigquery import (
    BigQueryToBigQueryOperator,
)
from airflow.providers.google.cloud.transfers.bigquery_to_gcs import (
    BigQueryToGCSOperator,
)
from airflow.providers.google.cloud.transfers.gcs_to_bigquery import (
    GCSToBigQueryOperator,
)
from dataloader.airflow_utils.defaults import (
    DAGS_DIR,
    DATA_BUCKET,
    GCP_ZONE,
    PROJECT_ID,
    get_default_args,
    get_post_success,
)
from dataloader.scripts.populate_documentation import update_table_descriptions

"""
This DAG retrieves data from GitHub and updates the tables in the `orca` BigQuery dataset
"""

args = get_default_args(pocs=["Brian"])
args["retries"] = 1

production_dataset = "orca"
staging_dataset = f"staging_{production_dataset}"
backup_dataset = f"{production_dataset}_backups"

with DAG(
    "orca_updater",
    default_args=args,
    description="Updates ORCA data",
    user_defined_macros={
        "staging_dataset": staging_dataset,
        "production_dataset": production_dataset,
    },
    schedule_interval="0 0 1 * *",
    catchup=False,
) as dag:
    tmp_dir = f"{production_dataset}/tmp"
    sql_dir = f"sql/{production_dataset}"
    gce_resource_id = "orca-etl"
    ssh_command = (
        f"gcloud compute ssh airflow@{gce_resource_id} --zone {GCP_ZONE} --command "
        + '"{}"'
    )

    clear_dl_dir = GCSDeleteObjectsOperator(
        task_id="clear_dl_dir", bucket_name=DATA_BUCKET, prefix=tmp_dir
    )

    extract_repo_mentions = BigQueryInsertJobOperator(
        task_id="extract_repo_mentions",
        configuration={
            "query": {
                "query": "{% include '" + f"{sql_dir}/repos_in_papers.sql" + "' %}",
                "useLegacySql": False,
                "destinationTable": {
                    "projectId": PROJECT_ID,
                    "datasetId": staging_dataset,
                    "tableId": "repos_in_papers",
                },
                "allowLargeResults": True,
                "createDisposition": "CREATE_IF_NEEDED",
                "writeDisposition": "WRITE_TRUNCATE",
            }
        },
    )

    gce_instance_start = ComputeEngineStartInstanceOperator(
        project_id=PROJECT_ID,
        zone=GCP_ZONE,
        resource_id=gce_resource_id,
        task_id="start-" + gce_resource_id,
    )

    working_dir = "current_run"
    prep_environment_sequence = [
        f"gsutil cp -r gs://{DATA_BUCKET}/{production_dataset}/code/scripts/*.sh .",
        f"mkdir {working_dir}",
        f"cd {working_dir}",
        f"gsutil cp -r gs://{DATA_BUCKET}/{production_dataset}/code/scripts .",
        f"gsutil cp -r gs://{DATA_BUCKET}/{production_dataset}/code/input_data .",
        f"gsutil cp -r gs://{DATA_BUCKET}/{production_dataset}/code/requirements.txt .",
        "python3 -m pip install -r requirements.txt",
    ]
    prep_environment_script = f"rm -r {working_dir};" + " && ".join(
        prep_environment_sequence
    )
    prep_environment = BashOperator(
        task_id="prep_environment",
        bash_command=ssh_command.format(prep_environment_script),
    )

    # Pull the repos from BQ, along with repos specified by custom lists
    retrieve_repos = BashOperator(
        task_id="retrieve_repos",
        bash_command=ssh_command.format(
            f"bash retrieve_repos.sh {working_dir} {DATA_BUCKET} "
            f"{production_dataset} &> retrieve_repos_log &"
        ),
    )
    wait_for_retrieve_repos = GCSObjectExistenceSensor(
        task_id="wait_for_retrieve_repos",
        bucket=DATA_BUCKET,
        object=f"{production_dataset}/done_files/retrieve_repos",
        deferrable=True,
    )

    # Retrieve full metadata for each repo from the GitHub API
    get_full_metadata = BashOperator(
        task_id="get_full_metadata",
        bash_command=ssh_command.format(
            f"bash get_full_metadata.sh {working_dir} {DATA_BUCKET} "
            f"{production_dataset} &> get_full_metadata_log &"
        ),
    )
    wait_for_get_full_metadata = GCSObjectExistenceSensor(
        task_id="wait_for_get_full_metadata",
        bucket=DATA_BUCKET,
        object=f"{production_dataset}/done_files/get_full_metadata",
        deferrable=True,
    )

    # Scrape GitHub for READMEs and additional metadata we aren't otherwise able to collect
    scrape_additional_metadata = BashOperator(
        task_id="scrape_additional_metadata",
        bash_command=ssh_command.format(
            f"bash scrape_additional_metadata.sh {working_dir} {DATA_BUCKET} "
            f"{production_dataset} {tmp_dir} &> scrape_additional_metadata_log &"
        ),
    )
    wait_for_scrape_additional_metadata = GCSObjectExistenceSensor(
        task_id="wait_for_scrape_additional_metadata",
        bucket=DATA_BUCKET,
        object=f"{production_dataset}/done_files/scrape_additional_metadata",
        deferrable=True,
    )

    gce_instance_stop = ComputeEngineStopInstanceOperator(
        project_id=PROJECT_ID,
        zone=GCP_ZONE,
        resource_id=gce_resource_id,
        task_id="stop-" + gce_resource_id,
    )

    load_data_to_bq = GCSToBigQueryOperator(
        task_id="load_data_to_bq",
        bucket=DATA_BUCKET,
        source_objects=[f"{tmp_dir}/curr_repos_final.jsonl"],
        schema_object=f"{production_dataset}/schemas/repos_with_full_meta_raw.json",
        destination_project_dataset_table=f"{staging_dataset}.repos_with_full_meta_raw",
        source_format="NEWLINE_DELIMITED_JSON",
        create_disposition="CREATE_IF_NEEDED",
        write_disposition="WRITE_TRUNCATE",
        ignore_unknown_values=True,
    )

    (
        clear_dl_dir
        >> extract_repo_mentions
        >> gce_instance_start
        >> prep_environment
        >> retrieve_repos
        >> wait_for_retrieve_repos
        >> get_full_metadata
        >> wait_for_get_full_metadata
        >> scrape_additional_metadata
        >> wait_for_scrape_additional_metadata
        >> gce_instance_stop
        >> load_data_to_bq
    )

    curr = load_data_to_bq
    downstream_seq_file = (
        f"{DAGS_DIR}/sequences/{production_dataset}/downstream_order.txt"
    )
    for line in open(downstream_seq_file):
        table_name = line.strip()
        if not table_name:
            continue
        last = BigQueryInsertJobOperator(
            task_id=f"create_{table_name}",
            configuration={
                "query": {
                    "query": "{% include '" + f"{sql_dir}/{table_name}.sql" + "' %}",
                    "useLegacySql": False,
                    "destinationTable": {
                        "projectId": PROJECT_ID,
                        "datasetId": staging_dataset,
                        "tableId": table_name,
                    },
                    "allowLargeResults": True,
                    "createDisposition": "CREATE_IF_NEEDED",
                    "writeDisposition": "WRITE_TRUNCATE",
                }
            },
        )
        curr >> last
        curr = last

    export_website_stats = BigQueryToGCSOperator(
        task_id="export_website_stats",
        source_project_dataset_table=f"{staging_dataset}.website_stats",
        destination_cloud_storage_uris=f"gs://{DATA_BUCKET}/{tmp_dir}/website_stats/data*",
        export_format="NEWLINE_DELIMITED_JSON",
    )

    checks = [
        BigQueryCheckOperator(
            task_id="check_pk_distinct_website_stats",
            sql=f"select count(0) = count(distinct(id)) from {staging_dataset}.website_stats",
            use_legacy_sql=False,
        ),
        BigQueryCheckOperator(
            task_id="check_distinct_repos_with_full_meta",
            sql=f"select count(0) = count(distinct(concat(matched_owner, '/', matched_name))) from {staging_dataset}.repos_with_full_meta",
            use_legacy_sql=False,
        ),
        BigQueryCheckOperator(
            task_id="check_no_readme_404s",
            sql=f"select count(id) = 0 from {staging_dataset}.repos_with_full_meta where readme_text='404: Not Found'",
            use_legacy_sql=False,
        ),
    ]

    last >> checks >> export_website_stats

    msg_success = get_post_success("ORCA data updated!", dag)
    curr_time = datetime.strftime(datetime.now(), "%Y_%m_%d")
    with open(f"{DAGS_DIR}/schemas/{production_dataset}/table_info.json") as f:
        table_desc = json.loads(f.read())

    for table in ["website_stats", "full_stats", "repos_with_full_meta"]:
        copy_to_prod = BigQueryToBigQueryOperator(
            task_id=f"copy_{table}_to_prod",
            source_project_dataset_tables=[f"{staging_dataset}.{table}"],
            destination_project_dataset_table=f"{production_dataset}.{table}",
            create_disposition="CREATE_IF_NEEDED",
            write_disposition="WRITE_TRUNCATE",
        )

        pop_descriptions = (
            PythonOperator(
                task_id=f"populate_column_documentation_for_{table}",
                op_kwargs={
                    "input_schema": f"{DAGS_DIR}/schemas/{production_dataset}/{table}.json",
                    "table_name": f"{production_dataset}.{table}",
                    "table_description": table_desc[table],
                },
                python_callable=update_table_descriptions,
            )
            if table == "repos_with_full_meta"
            else None
        )

        take_snapshot = BigQueryToBigQueryOperator(
            task_id=f"snapshot_{table}",
            source_project_dataset_tables=[f"{staging_dataset}.{table}"],
            destination_project_dataset_table=f"{backup_dataset}.{table}_{curr_time}",
            create_disposition="CREATE_IF_NEEDED",
            write_disposition="WRITE_TRUNCATE",
        )
        export_website_stats >> copy_to_prod
        if table == "repos_with_full_meta":
            copy_to_prod >> pop_descriptions >> take_snapshot
        else:
            copy_to_prod >> take_snapshot
        take_snapshot >> msg_success
