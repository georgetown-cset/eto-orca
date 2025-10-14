npm install && \
gatsby clean && \
npm run build && \
gsutil -m rsync -r -d public "gs://eto-tmp/eto-orca/public" && \
gsutil -m -h "Cache-Control:no-cache, max-age=0" rsync -r -d "gs://eto-tmp/eto-orca/public" "gs://orca.eto.tech/" && \
git tag --force deploy/previous deploy/current && \
git tag --force deploy/current HEAD && \
git push -f origin deploy/previous deploy/current
