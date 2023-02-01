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
  emph: css`
    font-weight: bold;
  `,
  nobreak: css`
    word-wrap: nobreak;
    margin-right: 10px;
  `,
  sortOption: css`
    margin-right: 10px;
  `,
  dataDesc: css`
    margin: 15px 0px;
  `
};

const RepoCard = (props) => {
  const {data, field, graph_key, graph_title, isCurated} = props;

  const repo_name = data["owner_name"]+"/"+data["current_name"];

  const getGraph = () => {
    if(["issue_dates", "pr_dates", "contrib_counts"].includes(graph_key)){
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
        <div style={{width: "40%", display: "inline-block", verticalAlign: "top"}}>
          <span>
            <h4 style={{display: "inline-block", marginRight: "10px"}}><ExternalLink href={"https://github.com/"+repo_name}>{repo_name}</ExternalLink></h4>
            {data["has_deps_dev"] &&
            <span style={{display: "inline-block", fontSize: "80%"}}>
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
        <div style={{width: "59%", display: "inline-block", verticalAlign: "top"}}>
          {getGraph()}
        </div>
      </div>
      <div style={{textAlign: "center"}}>
        <ButtonStyled href={`/project?project_id=${data['id']}`} target={"_blank"} rel={"noopener"}>More details</ButtonStyled>
      </div>
    </div>
  )
};

export default RepoCard;
