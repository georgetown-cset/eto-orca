import React, {useEffect} from "react";
import CircularProgress from "@mui/material/CircularProgress";

import {AppWrapper, ErrorBoundary} from "@eto/eto-ui-components";
import {css} from "@emotion/react";

const ProjectDetails = React.lazy(() => import("../components/project_details"));

const styles = {
  suspense: css`
    text-align: center;
    margin: 40px;
  `
};

const Project = () => {
  useEffect(() => {
    document.title = "ETO ORCA";
    document.documentElement.lang = "en";
  }, []);

  return (
      <AppWrapper>
      <div style={{
        backgroundColor: "white"
      }}>
        {(typeof window !== "undefined") &&
          <React.Suspense fallback={<div css={styles.suspense}><CircularProgress/></div>}>
            <ErrorBoundary>
              <ProjectDetails/>
            </ErrorBoundary>
          </React.Suspense>
        }
      </div>
      </AppWrapper>
  )
};

export default Project;
