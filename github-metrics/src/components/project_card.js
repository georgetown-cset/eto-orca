/*
The project card component displayed for each repo in the list view
 */
import React from "react";
import Typography from "@mui/material/Typography";
import { css } from "@emotion/react";
import {ButtonStyled, ExternalLink} from "@eto/eto-ui-components";

import "core-js/features/url";
import "core-js/features/url-search-params";

import {LineGraph, BarGraph} from "./graph";
import ProjectMetadata from "./project_metadata";

import {getCountryTraces, getBarTraces, getX, getY} from "./utils";


const styles = {
  card: css`
    max-width: 100%;
    margin: 20px auto;
    padding: 20px;
    border: 1px solid black;
    border-radius: 5px;
  `,
  leftPanel: css`
    width: 40%;
    display: inline-block;
    vertical-align: top;
  `,
  rightPanel: css`
    width: 59%;
    display: inline-block;
    vertical-align: top;
  `,
  dataDesc: css`
    margin: 15px 0px;
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
  `
};

const ProjectCard = (props) => {
  const {data, field, graph_key, graph_title, isCurated} = props;

  const repo_name = data["owner_name"]+"/"+data["current_name"];

  const getGraph = () => {
    if(["issue_dates", "commit_dates", "contrib_counts"].includes(graph_key)){
      return <BarGraph traces={getBarTraces(graph_key, data)} title={graph_title} height={"250px"}
                       normalizeTime={graph_key !== "contrib_counts"}/>;
    } else if(["country_contributions", "org_contributions", "downloads"].includes(graph_key)){
      return <LineGraph traces={getCountryTraces(data[graph_key])} title={graph_title} height={"250px"} showLegend={true}/>;
    }
    return <LineGraph traces={[{x: getX(data[graph_key]), y: getY(data[graph_key])}]}
                       title={graph_title} height={"250px"}/>;
  };

  return (
    <div css={styles.card}>
      <div>
        <div css={styles.leftPanel}>
          <span>
            <h4 css={styles.ghLink}><ExternalLink href={"https://github.com/"+repo_name}>{repo_name}</ExternalLink></h4>
            {data["has_deps_dev"] &&
            <span css={styles.depsLink}>
              <ExternalLink href={"https://deps.dev/project/github/" + data["owner_name"] + "%2F" + data["current_name"]}>
                [deps.dev]
              </ExternalLink>
            </span>
            }
          </span>
          <Typography component={"p"} variant={"body2"} css={styles.dataDesc}>
            {data["description"]}
          </Typography>
          <ProjectMetadata data={data} showNumReferences={!isCurated} field={field}/>
        </div>
        <div css={styles.rightPanel}>
          {getGraph()}
        </div>
      </div>
      <div css={styles.buttonContainer}>
        <ButtonStyled href={`/project?project_id=${data['id']}`} target={"_blank"} rel={"noopener"}>More details</ButtonStyled>
      </div>
    </div>
  )
};

export default ProjectCard;