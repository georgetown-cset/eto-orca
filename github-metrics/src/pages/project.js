import React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

import {AppWrapper, ErrorBoundary} from "@eto/eto-ui-components";

import "../styles/styles.css";
//const ClusterDashboard = React.lazy(() => import("../components/cluster_dashboard"));

const Cluster = () => {

  return (
    <AppWrapper>
      <Box style={{
        backgroundColor: "white"
      }}>
        Hello world
      </Box>
    </AppWrapper>
  )
};

export default Cluster;
