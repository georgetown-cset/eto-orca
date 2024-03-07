import React, { useEffect, useState } from "react";
import {css} from "@emotion/react";
import CircularProgress from "@mui/material/CircularProgress";

import { AppWrapper, ErrorBoundary } from "@eto/eto-ui-components";

import MetaTagsWrapper from "../components/MetaTagsWrapper";
import id_to_repo from "../data/id_to_repo";
import name_to_id from "../data/name_to_id";
import { getRepoName } from "../util";

const ProjectDetails = React.lazy(() => import("../components/project_details"));

const styles = {
  suspense: css`
    text-align: center;
    margin: 40px;
  `
};

const Project = () => {
  const [data, setData] = useState({});
  const [repoName, setRepoName] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get("name") !== null){
      const project_name = urlParams.get("name");
      if (window.plausible) {
        window.plausible("Loaded project detail", {props: {
          "project_name": project_name
        }});
      }
      if(!(project_name in name_to_id)){
        setData([])
      } else {
        const project_id = name_to_id[project_name];
        const newData = id_to_repo[project_id];
        setRepoName(getRepoName(newData));
        setData(newData);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
      <AppWrapper>
      <div style={{
        backgroundColor: "white"
      }}>
        {(typeof window !== "undefined") &&
          <React.Suspense fallback={<div css={styles.suspense}><CircularProgress/></div>}>
            <ErrorBoundary>
              <ProjectDetails data={data} repoName={repoName} />
            </ErrorBoundary>
          </React.Suspense>
        }
      </div>
      </AppWrapper>
  )
};

export default Project;

export function Head() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectName = urlParams.get("name") ?? undefined;

  return (
    <MetaTagsWrapper subtitle={projectName} title="ETO ORCA" />
  );
}
