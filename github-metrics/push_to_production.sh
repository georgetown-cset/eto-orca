gsutil -m rsync -r -d public "gs://eto-tmp/eto-orca/public" && gsutil -m -h "Cache-Control:no-cache, max-age=0" rsync -r -d "gs://eto-tmp/eto-orca/public" "gs://orca.eto.tech/"
