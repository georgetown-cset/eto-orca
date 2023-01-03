import React from "react";

import {LineGraph} from "./graph";
import {css} from "@emotion/react";

const styles = {
  card: css`
    padding: 20px;
  `
};

const SummaryPanel = (props) => {
  const {data, field} = props;

  const getTrace = (ext_fn, getSortVal, yMap = val => val[1]) => {
    const traceData = [...data];
    traceData.sort((r1, r2) => getSortVal(r2) - getSortVal(r1))
    const topFive = traceData.slice(0, 5);
    return topFive.map(row => ({
      x: ext_fn(row).map(val => val[0]),
      y: ext_fn(row).map(val => yMap(val)),
      name: row["owner_name"]+"/"+row["current_name"]
    }))
  };

  const getContribTrace = (ext_fn, getSortVal) => {
    const traceData = [...data];
    traceData.sort((r1, r2) => getSortVal(r2) - getSortVal(r1));
    const topFive = traceData.slice(0, 5);
    const traces = [];
    for(let row of topFive){
      const x = [];
      const y = [];
      for(let idx = 0; idx < ext_fn(row).length; idx++){
        x.push(ext_fn(row)[idx][0]);
        y.push(100*ext_fn(row).slice(0, idx+1).reduce((partialSum, v) => partialSum + v[1], 0)/row["num_prs"])
      }
      traces.push({
        x: x,
        y: y,
        name: row["owner_name"]+"/"+row["current_name"]
      })
    }
    return traces;
  };

  return (
    <div css={styles.card}>
      <h3>Contributor activity</h3>
      <LineGraph title={"Push events in top five referenced projects"}
                 traces={getTrace(row => row["push_dates"], repo => repo["num_references"][field])}/>
      <LineGraph title={"Ratio of issues opened to closed in top five referenced projects"}
                 traces={getTrace(row => row["issue_dates"], repo => repo["num_references"][field],
                   val => val[1]/val[2])}/>
      <LineGraph title={"Ratio of new vs returning contributors in top five referenced projects"}
                 traces={getTrace(row => row["pr_dates"], repo => repo["num_references"][field],
                   val => val[1]/val[2])}/>
      <LineGraph title={"Cumulative total of contributions by number of contributors"}
                 traces={getContribTrace(row => row["contrib_counts"],
                     repo => repo["num_references"][field])}/>
      <h3>User activity</h3>
      <LineGraph title={"Star events in top five referenced projects"}
                 traces={getTrace(row => row["star_dates"], repo => repo["num_references"][field])}/>
    </div>
  );
};

export default SummaryPanel;
