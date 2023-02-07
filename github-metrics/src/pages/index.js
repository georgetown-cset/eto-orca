import React, {useEffect} from "react";
import CircularProgress from "@mui/material/CircularProgress";
import {AppWrapper, ExternalLink, InfoCard} from "@eto/eto-ui-components";

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
        title={<div style={{fontFamily: "GTZirkonBold, sans-serif !important"}}>Open-Source Software in Emerging Technology Metrics</div>}
        description={<div>
          <div style={{marginBottom: "10px"}}>
          This tool is meant to enable comparative analysis of Open-Source Software (OSS) used in emerging technology (ET) areas.
          OSS projects are associated with an ET area either through manual curation (see the "Curated Field" section of the Field of Study
          dropdown below) or through automated retrieval (see the "Automated Field Detection" section of the Field of Study dropdown).
          </div>
          <div style={{ marginBottom: "10px"}}>
          In the automated
          retrieval method, we affiliate any OSS project that is mentioned in the title, abstract, arXiv or CNKI fulltext, or Papers with Code
          references of an article with that article. We assign each article to its top three fields of study, then
          affiliate each OSS project with fields of study containing at least three papers that reference the OSS project.
          </div>
          <div style={{marginBottom: "10px"}}>
          At the moment, this project only includes GitHub data, but in the future we hope to expand to other repository
            hosting services. Data sources include: <ExternalLink href={"https://console.cloud.google.com/bigquery?project=githubarchive&page=project"}>Github Archive</ExternalLink>, <ExternalLink href={"https://console.cloud.google.com/marketplace/product/gcp-public-data-pypi/pypi?_ga=2.174631522.-1309707215.1607703367"}>PyPI</ExternalLink>, and our <ExternalLink href={"https://eto.tech/dataset-docs/mac/"}>merged academic corpus</ExternalLink>.
          </div>
        </div>}
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
