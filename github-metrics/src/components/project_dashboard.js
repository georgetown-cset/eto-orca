import React, {useEffect} from "react";

import "core-js/features/url";
import "core-js/features/url-search-params";

import {id_to_repo} from "../data/constants";
import {ExternalLink} from "@eto/eto-ui-components";
import Typography from "@mui/material/Typography";
import {css} from "@emotion/react";
import {BarGraph, LineGraph} from "./graph";

const ProjectDashboard = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get("project_id") !== null){
      const project_id = urlParams.get("project_id");
      setProject(project_id);
      setData(id_to_repo[project_id]);
    }
  }, []);

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
      margin-bottom: 5px;
    `,
    dataDesc: css`
      margin: 15px 0px;
    `
  };

  const [project, setProject] = React.useState();
  const [data, setData] = React.useState({});
  const repo_name = data["owner_name"]+"/"+data["current_name"];

  // todo: refactor this shared code out of here and repo_card
  const metaGroups = [
    ["stargazers_count", "subscribers_count"],
    ["num_contributors", "open_issues"],
    ["created_at", "pushed_at"]
  ];
  const getValue = (sort_key) => {
    if(data[sort_key] === null) {
      return 0;
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
  const barTraceNames = {
    "issue_dates": ["Opened", "Closed"],
    "pr_dates": ["New", "Returning"],
    "contrib_counts": ["Num Contributions"]
  };

  // todo: pull this out of here and dashboard
  const metaMapping = {
    "stargazers_count": "Stars",
    "subscribers_count": "Watchers",
    "num_contributors": "Contributors",
    "created_at": "Created Date",
    "pushed_at": "Last Push Date",
    "open_issues": "Open Issues",
    "num_references": "References"
  };
  const keyToTitle = {
    "star_dates": "Stars over time",
    "push_dates": "Push events over time",
    "issue_dates": "Issues over time",
    "pr_dates": "New vs returning contributors over time",
    "contrib_counts": "Contribution percentage counts"
  };

  const contribGraphs = [
    ["push_dates", "line"],
    ["issue_dates", "bar"],
    ["pr_dates", "bar"],
    ["contrib_counts", "bar"]
  ];
  const userGraphs = [
    ["star_dates", "line"]
  ];

  return (
   <div style={{margin: "20px auto", maxWidth: "1000px"}}>
     <div style={{textAlign: "right"}}>
      <a href={"/"}>Back to summary page</a>
     </div>
     <div>
       <h2 style={{display: "inline-block", marginRight: "10px"}}>
         <ExternalLink href={"https://github.com/"+repo_name}>{repo_name}</ExternalLink>
       </h2>
       <div style={{display: "inline-block", fontSize: "80%"}}>
         <ExternalLink href={"https://deps.dev/pypi/"+data["current_name"]}>[deps.dev]</ExternalLink>
       </div>
       <div>
         <div style={{display: "inline-block", width: "50%", verticalAlign: "top"}}>
           {data["description"]}
         </div>
         <div style={{display: "inline-block", width: "50%"}}>
           {metaGroups.map((group, group_idx) => (
             <div css={styles.sortOption} key={`meta-group-${group_idx}`}>
                {group.map(option => (
                  <span css={styles.nobreak} key={option}>
                    <span css={styles.emph}>{metaMapping[option]}</span>: {getValue(option)}
                  </span>
                ))}
             </div>
           ))}
         </div>
       </div>
     </div>
     <div>
       <h3>Contributor activity</h3>
       {Object.keys(data).length > 0 && contribGraphs.map(meta => (
         meta[1] === "bar" ? <BarGraph traces={getBarTraces(meta[0])} title={keyToTitle[meta[0]]} height={"250px"}/> :
            <LineGraph traces={[{x: getX(data[meta[0]]), y: getY(data[meta[0]])}]}
                       title={keyToTitle[meta[0]]} height={"250px"}/>
       ))}
     </div>
     <div>
       <h3>User activity</h3>
       {Object.keys(data).length > 0 && userGraphs.map(meta => (
         meta[1] === "bar" ? <BarGraph traces={getBarTraces(meta[0])} title={keyToTitle[meta[0]]} height={"250px"}/> :
            <LineGraph traces={[{x: getX(data[meta[0]]), y: getY(data[meta[0]])}]}
                       title={keyToTitle[meta[0]]} height={"250px"}/>
       ))}
     </div>
   </div>
  );
};

export default ProjectDashboard;
