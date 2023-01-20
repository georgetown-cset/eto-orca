import React from "react";
import Typography from "@mui/material/Typography";
import { css } from "@emotion/react";
import {ButtonStyled, ExternalLink} from "@eto/eto-ui-components";

import "core-js/features/url";
import "core-js/features/url-search-params";

import {LineGraph, BarGraph} from "./graph";


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
  const {data, metaMapping, field, graph_key, graph_title, isCurated} = props;

  const repo_name = data["owner_name"]+"/"+data["current_name"];

  const getValue = (sort_key) => {
    if(data[sort_key] === null) {
      return 0;
    } else if(sort_key === "num_references"){
      return data[sort_key][field];
    }
    return data[sort_key];
  };

  const getX = (ary) => {
    return ary.map(elt => elt[0])
  };

  const getY = (ary) => {
    return ary.map(elt => elt[1])
  };

  const getBarTraces = (key) => {
    const barData = data[key];
    const traceData = [];
    const yTrans = y => key !== "contrib_counts" ? y : 100*y/data["num_prs"];
    if(barData.length === 0){
      return [];
    }
    for(let i = 0; i < barData[0].length - 1; i ++){
      traceData.push({
        x: barData.map(elt => elt[0]),
        y: barData.map(elt => yTrans(elt[i+1])),
        name: barTraceNames[key][i]
      })
    }
    return traceData;
  };

  const getCountryTraces = (graphData) => {
    const nameToYearToCounts = {};
    const countryCounts = {};
    for(let elt of graphData){
      const [year, country, count] = elt;
      if(!(country in countryCounts)){
        countryCounts[country] = 0
      }
      countryCounts[country] += parseInt(count);
      if(!(country in nameToYearToCounts)){
        nameToYearToCounts[country] = {};
      }
      nameToYearToCounts[country][year] = count;
    }
    const topCountries = [...Object.keys(countryCounts)];
    topCountries.sort((a, b) => countryCounts[b] - countryCounts[a]);
    const traces = [];
    for(let name of topCountries.slice(0, 5)){
      const years = [...Object.keys(nameToYearToCounts[name])];
      years.sort();
      traces.push({
        x: years,
        y: years.map(y => nameToYearToCounts[name][y]),
        name: name
      })
    }
    return traces;
  };

  const getGraph = () => {
    if(["issue_dates", "pr_dates", "contrib_counts"].includes(graph_key)){
      return <BarGraph traces={getBarTraces(graph_key)} title={graph_title} height={"250px"}/>;
    } else if(["country_contributions", "org_contributions"].includes(graph_key)){
      return <LineGraph traces={getCountryTraces(data[graph_key])} title={graph_title} height={"250px"}/>;
    }
    return <LineGraph traces={[{x: getX(data[graph_key]), y: getY(data[graph_key])}]}
                       title={graph_title} height={"250px"}/>;
  };

  const metaGroups = [
    ["stargazers_count", "subscribers_count", "num_contributors"],
    ["open_issues", "num_references"],
    ["created_at", "pushed_at"]
  ];
  const barTraceNames = {
    "issue_dates": ["Opened", "Closed"],
    "pr_dates": ["New", "Returning"],
    "contrib_counts": ["Num Contributions"]
  };

  return (
    <div css={styles.card}>
      <div>
        <div style={{width: "40%", display: "inline-block", verticalAlign: "top"}}>
          <span>
            <h4 style={{display: "inline-block", marginRight: "10px"}}><ExternalLink href={"https://github.com/"+repo_name}>{repo_name}</ExternalLink></h4>
            <span style={{display: "inline-block", fontSize: "80%"}}><ExternalLink href={"https://deps.dev/pypi/"+data["current_name"]}>[deps.dev]</ExternalLink></span>
          </span>
          <Typography component={"p"} variant={"body2"} css={styles.dataDesc}>
            {data["description"]}
          </Typography>
          {metaGroups.map((group, group_idx) => (
            <Typography component={"div"} variant={"body2"} css={styles.sortOption} key={`meta-group-${group_idx}`}>
              {group.map(option => ((!isCurated) || (option !== "num_references")) && (
                <span css={styles.nobreak} key={option}>
                  <span css={styles.emph}>{metaMapping[option]}</span>: {getValue(option)}
                </span>
              ))}
            </Typography>
          ))}
          <Typography component={"div"} variant={"body2"} css={styles.sortOption}>
            <span css={styles.nobreak}>
              <span css={styles.emph}>Funders</span>: tk
            </span>
            <span css={styles.nobreak}>
              <span css={styles.emph}>License</span>: tk
            </span>
          </Typography>
          <Typography component={"div"} variant={"body2"} css={styles.sortOption}>
            <span css={styles.nobreak}>
              <span css={styles.emph}>Top programming language:</span> {data["language"]}
            </span>
          </Typography>
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
