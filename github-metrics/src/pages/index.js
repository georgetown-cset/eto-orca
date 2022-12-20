import React, {useEffect} from "react";
import CircularProgress from "@mui/material/CircularProgress";
import {AppWrapper, InfoCard} from "@eto/eto-ui-components";

/* Set the body margin and padding to 0 here */
import "../styles/styles.css";
const Dashboard = React.lazy(() => import("../components/dashboard"));

const IndexPage = () => {
  useEffect(() => {
    document.title = "Open-Source Software for Emerging Technology Metrics";
    document.documentElement.lang = "en";
  }, []);

  return (
    <AppWrapper>
      <InfoCard
        title={"Open-Source Software in Emerging Technology Metrics"}
        description={"This will contain some cool info someday!"}
        documentationLink={"https://eto.tech/tool-docs/oss-tracker"}
      />
      {(typeof window !== "undefined") &&
        <React.Suspense fallback={<div style={{textAlign: "center"}}><CircularProgress/></div>}>
          <Dashboard/>
        </React.Suspense>
      }
    </AppWrapper>
  )
};

export default IndexPage;
