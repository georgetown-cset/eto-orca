import React from "react";

import {LineGraph} from "./graph";
import {css} from "@emotion/react";

const styles = {
  card: css`
    max-width: 100%;
    margin: 20px 40px;
    padding: 20px;
  `
};

const SummaryPanel = (props) => {
  const {data, field} = props;

  const getTrace = (data_key, getSortVal) => {
    const traceData = [...data];
    traceData.sort((r1, r2) => getSortVal(r2) - getSortVal(r1))
    const topFive = traceData.slice(0, 5);
    return topFive.map(row => ({
      x: row[data_key].map(val => val[0]),
      y: row[data_key].map(val => val[1]),
      name: row["owner_name"]+"/"+row["current_name"]
    }))
  };

  return (
    <div css={styles.card}>
      <LineGraph title={"Star events in top five referenced projects"}
                 traces={getTrace("star_dates", repo => repo["num_references"][field])}/>
      <LineGraph title={"Push events in top five referenced projects"}
                 traces={getTrace("push_dates", repo => repo["num_references"][field])}/>
    </div>
  );
};

export default SummaryPanel;
