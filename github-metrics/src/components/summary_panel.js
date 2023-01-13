import React from "react";

import {LineGraph} from "./graph";
import {css} from "@emotion/react";
import {Dropdown} from "@eto/eto-ui-components";

const styles = {
  card: css`
    padding: 20px;
  `
};

const SummaryPanel = (props) => {
  const {data, field, sortOptions} = props;
  const [orderBy, setOrderBy] = React.useState(
    sortOptions.map(opt => opt.val).includes("num_references") ? "num_references" : "stargazers_count");

  const getTrace = (key, yMap = val => val[1]) => {
    const traceData = [...data];
    traceData.sort((r1, r2) => r2[orderBy] - r1[orderBy]);
    const topFive = traceData.slice(0, 5);
    return topFive.map(row => ({
      x: row[key].map(val => val[0]),
      y: row[key].map(val => yMap(val)),
      name: row["owner_name"]+"/"+row["current_name"]
    }))
  };

  const getContribTrace = (key) => {
    const traceData = [...data];
    traceData.sort((r1, r2) => r2[orderBy] - r1[orderBy]);
    const topFive = traceData.slice(0, 5);
    const traces = [];
    for(let row of topFive){
      const x = [];
      const y = [];
      for(let idx = 0; idx < row[key].length; idx++){
        x.push(row[key][idx][0]);
        y.push(100*row[key].slice(0, idx+1).reduce((partialSum, v) => partialSum + v[1], 0)/row["num_prs"])
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
      <div style={{marginTop: "5px", position: "sticky", top: "0", zIndex: 200, backgroundColor: "white",
                   borderBottom: "1px solid rgba(0, 0, 0, 0.12)", verticalAlign: "top"}}>
        <div style={{display: "inline-block", verticalAlign: "bottom", fontWeight: "bold", paddingBottom: "16px"}}>
          Displaying top 5 repos in {field.toLowerCase()}, ordered by
        </div>
        <div style={{display: "inline-block"}}>
          <Dropdown
            selected={orderBy}
            setSelected={val => setOrderBy(val)}
            inputLabel={"Order by"}
            options={sortOptions}
          />
        </div>
      </div>
      <h3>Contributor activity</h3>
      <LineGraph title={`Push events in top five projects`}
                 traces={getTrace("push_dates")}/>
      <LineGraph title={`Ratio of issues opened to closed in top five projects`}
                 traces={getTrace("issue_dates",
                   val => val[1]/val[2])}/>
      <LineGraph title={`Ratio of new vs returning contributors in top five projects`}
                 traces={getTrace("pr_dates",
                   val => val[1]/val[2])}/>
      <LineGraph title={"Cumulative total of contributions by number of contributors"}
                 traces={getContribTrace("contrib_counts")}/>
      <h3>User activity</h3>
      <LineGraph title={`Star events in top five projects`}
                 traces={getTrace("star_dates")}/>
    </div>
  );
};

export default SummaryPanel;
