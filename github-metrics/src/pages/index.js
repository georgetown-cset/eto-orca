import React, {useEffect, useState} from "react";
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
  `,
  etoParagraph: css`
    font-size: 1rem;
  `,
  lastUpdated: css`
    color: var(--grey);
    font-size: 1rem;
  `,
};

const IndexPage = () => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(true);
  }, [])

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
        title="🌊 ORCA"
        description={
          <>
            <p>
              ETO's ORCA (OSS Research and Community Activity) compiles data on open-source
              software used in science and technology research and tracks usage, health,
              development activity, and community engagement. Use ORCA to compare open-source
              software projects across a wide range of research areas, explore trends over
              time, and sort and filter projects by different metrics.
            </p>
            <p css={styles.etoParagraph}>
              ETO is a project of the {
                <ExternalLink href="https://cset.georgetown.edu/">Center for Security and Emerging Technology</ExternalLink>
              } at <ExternalLink href="https://www.georgetown.edu/">Georgetown University</ExternalLink>. ORCA is maintained
              by CSET’s <ExternalLink href="https://cset.georgetown.edu/research-topic/data/">data team</ExternalLink>.
            </p>
            <div css={styles.lastUpdated}>
              Website last updated on {data.site.buildTime}. Data last updated on {config.last_updated}. You may <a href={"/orca_download.jsonl"}>download the data</a>.
            </div>
          </>
        }
        documentationLink="https://eto.tech/tool-docs/orca"
        sidebarTitle="Quick guide"
        sidebarContent={<div>
          Use the "Research Field" dropdown to pick a field to browse. ORCA defaults to <strong>summary view</strong>, a condensed view that presents key facts and figures for the top OSS projects associated with the research field you selected. Click the view toggle in the toolbar to switch to <strong>list view</strong>, which includes information on every OSS project associated with the research field you selected. Click on a project's "full profile" buttons to open in-depth data and graphs in <strong>detail view</strong>.
        </div>}
      />
      {!loaded && <div css={styles.suspense}><CircularProgress/></div>}
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
