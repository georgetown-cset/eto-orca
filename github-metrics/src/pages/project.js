import React from "react";
import CircularProgress from "@mui/material/CircularProgress";

import {AppWrapper, ErrorBoundary} from "@eto/eto-ui-components";

const ProjectDashboard = React.lazy(() => import("../components/project_dashboard"));

const Project = () => {

  return (
      <AppWrapper>
      <div style={{
        backgroundColor: "white"
      }}>
        {(typeof window !== "undefined") &&
          <React.Suspense fallback={<div style={{textAlign: "center"}}><CircularProgress/></div>}>
            <ErrorBoundary>
              <ProjectDashboard/>
            </ErrorBoundary>
          </React.Suspense>
        }
      </div>
      </AppWrapper>
  )
};

export default Project;
