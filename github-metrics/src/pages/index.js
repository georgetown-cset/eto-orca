import React from "react";
import {css} from "@emotion/react";

import CircularProgress from "@mui/material/CircularProgress";
import {AppWrapper, ExternalLink, InfoCard} from "@eto/eto-ui-components";
import { useStaticQuery, graphql } from "gatsby";

import MetaTagsWrapper from "../components/MetaTagsWrapper";
import config from "../data/config.json";

/* Set the body margin and padding to 0 here */
import "../styles/styles.css";
const Dashboard = React.lazy(() => import("../components/dashboard"));

const styles = {
  suspense: css`
    text-align: center;
    margin: 40px;
  `
};

const IndexPage = () => {
  const data = useStaticQuery(graphql`
    query {
      site {
        buildTime(formatString: "MMMM DD, YYYY")
      }
    }
  `);

  return (
    <AppWrapper>
      <InfoCard
        title={<div style={{fontFamily: "GTZirkonBold, sans-serif !important"}}>🌊 ORCA: OSS Research and Community Activity</div>}
        description={<div>
          <div style={{marginBottom: "10px"}}>
          ORCA compiles data on open-source software (OSS) used in science and technology research. Drawing on Github Archive, ETO’s Merged Academic Corpus, and many other data sources, ORCA tracks OSS usage, health, development activity, and community engagement across a wide range of software projects and research subjects. Use ORCA to compare OSS projects in a particular research area, track trends over time, and sort and filter projects by different metrics. <ExternalLink href={"https://eto.tech/tool-docs/orca"}>Read the docs &gt;&gt;</ExternalLink>
          </div>
          <div>
            Website last updated on {data.site.buildTime}. Data last updated on {config.last_updated}. You may <a href={"/orca_download.jsonl"}>download the data</a>.
          </div>
        </div>}
        documentationLink={"https://eto.tech/tool-docs/orca"}
        sidebarTitle={"Quick guide"}
        sidebarContent={<div>
          Use the "Research Field" dropdown to pick a field to browse. ORCA defaults to <strong>summary view</strong>, a condensed view that presents key facts and figures for the top OSS projects associated with the research field you selected. Click the view toggle in the toolbar to switch to <strong>list view</strong>, which includes information on every OSS project associated with the research field you selected. Click on a project's "full profile" buttons to open in-depth data and graphs in <strong>detail view</strong>.
        </div>}
      />
      {(typeof window !== "undefined") &&
        <React.Suspense fallback={<div css={styles.suspense}><CircularProgress/></div>}>
          <Dashboard/>
        </React.Suspense>
      }
    </AppWrapper>
  )
};

export default IndexPage;

export function Head() {
  return (
    <MetaTagsWrapper />
  );
}
