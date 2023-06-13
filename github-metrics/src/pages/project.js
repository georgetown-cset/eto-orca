import React, {useEffect} from "react";
import CircularProgress from "@mui/material/CircularProgress";

import {AppWrapper, ErrorBoundary} from "@eto/eto-ui-components";

const ProjectDetails = React.lazy(() => import("../components/project_details"));

const Project = () => {
  useEffect(() => {
    document.title = "Open-Source Software for Emerging Technology Metrics";
    document.documentElement.lang = "en";
  }, []);

  return (
      <AppWrapper>
      <div style={{
        backgroundColor: "white"
      }}>
        {(typeof window !== "undefined") &&
          <React.Suspense fallback={<div style={{textAlign: "center"}}><CircularProgress/></div>}>
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
