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

  const getTrace = (ext_fn, getSortVal) => {
    const traceData = [...data];
    traceData.sort((r1, r2) => getSortVal(r2) - getSortVal(r1))
    const topFive = traceData.slice(0, 5);
    return topFive.map(row => ({
      x: ext_fn(row).map(val => val[0]),
      y: ext_fn(row).map(val => val[1]),
      name: row["owner_name"]+"/"+row["current_name"]
    }))
  };

  return (
    <div css={styles.card}>
      <h3>Contributor activity</h3>
      <LineGraph title={"Push events in top five referenced projects"}
                 traces={getTrace(row => row["push_dates"], repo => repo["num_references"][field])}/>
      <h3>User activity</h3>
      <LineGraph title={"Star events in top five referenced projects"}
                 traces={getTrace(row => row["star_dates"], repo => repo["num_references"][field])}/>
    </div>
  );
};

export default SummaryPanel;
