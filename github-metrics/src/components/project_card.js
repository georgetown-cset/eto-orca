/*
The project card component displayed for each repo in the list view
 */
import React from "react";
import { css } from "@emotion/react";
import LaunchIcon from "@mui/icons-material/Launch";
import {ButtonStyled, ExternalLink, breakpointStops} from "@eto/eto-ui-components";

import "core-js/features/url";
import "core-js/features/url-search-params";

import {LineGraph, BarGraph} from "./graph";
import ProjectMetadata from "./project_metadata";
import githubLogo from "../images/github-mark.png";
import {getCountryTraces, getBarTraces, getX, getY, getRepoName} from "../util";


const styles = {
  card: css`
    max-width: 100%;
    border: 1px solid black;
    margin: 25px auto;
  `,
  leftPanel: css`
    width: 40%;
    display: inline-block;
    vertical-align: top;
    padding-bottom: 20px;
    @media (max-width: ${breakpointStops.tablet_small}px) {
      width: 100%;
    }
  `,
  rightPanel: css`
    width: 59%;
    display: inline-block;
    vertical-align: top;
    @media (max-width: ${breakpointStops.tablet_small}px) {
      width: 100%;
    }
  `,
  dataDesc: css`
    margin: 10px 0px 15px 0px;
    overflow-wrap: break-word;
  `,
  ghLink: css`
    display: inline-block;
    margin-right: 10px;
  `,
  depsLink: css`
    display: inline-block;
    font-size: 80%;
  `,
  buttonContainer: css`
    text-align: center;
  `,
  metadataContainer: css`
    padding: 20px 20px 0px 20px;
  `,
  githubLogo: css`
    height: 12px;
    vertical-align: bottom;
    margin: 0 4px 2px 0;
  `,
  noPyPi: css`
    font-weight: bold;
    text-align: center;
    margin-top: 22px;
  `,
  depsIcon: css`
    height: 13px;
    vertical-align: bottom;
  `
};

const ProjectCard = (props) => {
  const {data, field, graph_key, graph_title, isCurated} = props;

  const repo_name = getRepoName(data);

  const getGraph = () => {
    if((graph_key === "downloads") && (data[graph_key].length === 0)){
      return (
        <div css={styles.noPyPi}>
          No PyPi data available.
        </div>
      );
    }
    if(["issue_dates", "commit_dates", "contrib_counts"].includes(graph_key)){
      return (
        <BarGraph
          height="300px"
          normalizeTime={graph_key !== "contrib_counts"}
          title={graph_title}
          traces={getBarTraces(graph_key, data)}
        />
      );
    } else if(["country_contributions", "org_contributions", "downloads"].includes(graph_key)){
      return (
        <LineGraph
          height="300px"
          title={graph_title}
          traces={getCountryTraces(data[graph_key])}
          showLegend={true}
        />
      );
    }
    return (
      <BarGraph
        height="300px"
        title={graph_title}
        traces={[{x: getX(data[graph_key]), y: getY(data[graph_key])}]}
      />
    );
  };

  return (
    <div css={styles.card} data-testid="project-card">
      <div css={styles.metadataContainer}>
        <div css={styles.leftPanel}>
          <span>
            <h4 css={styles.ghLink}>
              <ExternalLink href={`/project?name=${repo_name}`}>{repo_name}</ExternalLink>
            </h4>
            <span css={styles.depsLink}>
              <ExternalLink href={"https://github.com/"+repo_name}>
                <img alt="" src={githubLogo} css={styles.githubLogo}/>GitHub<LaunchIcon css={styles.depsIcon}/>
              </ExternalLink>
            </span>
            {data["has_deps_dev"] &&
            <span css={styles.depsLink}>
              <ExternalLink href={"https://deps.dev/project/github/" + data["owner_name"] + "%2F" + data["current_name"]}>
                deps.dev<LaunchIcon css={styles.depsIcon}/>
              </ExternalLink>
            </span>
            }
          </span>
          <div css={styles.dataDesc}>
            {data["description"]}
          </div>
          <ProjectMetadata data={data} showNumReferences={!isCurated} field={field}/>
        </div>
        <div css={styles.rightPanel}>
          {getGraph()}
        </div>
      </div>
      <div css={styles.buttonContainer}>
        <ButtonStyled
          href={`/project?name=${repo_name}`}
          rel="noopener"
          style={{width: "100%", color: "white"}}
          target="_blank"
        >
          Full profile &gt;&gt;
        </ButtonStyled>
      </div>
    </div>
  )
};

export default ProjectCard;
