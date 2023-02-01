import React from "react";

import {LineGraph} from "./graph";
import {css} from "@emotion/react";
import {Dropdown} from "@eto/eto-ui-components";

import {keyToTitle} from "./utils";


const styles = {
  card: css`
    padding: 20px;
  `,
  summaryContainer: css`
    margin-top: 5px;
    position: sticky;
    top: 0;
    z-index: 200;
    background-color: white;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    verticalAlign: top;
  `,
  summaryContainerLabel: css`
    display: inline-block;
    vertical-align: bottom;
    font-weight: bold;
    padding-bottom: 16px;
  `,
  summaryContainerFilter: css`
    display: inline-block;
  `
};

const SummaryPanel = (props) => {
  const {data, sortOptions, customTopics} = props;
  const [orderBy, setOrderBy] = React.useState(
    sortOptions.map(opt => opt.val).includes("num_references") ? "num_references" : "stargazers_count");
  const customTopicMap = {};
  for(let topic of customTopics){
    customTopicMap[topic["val"]] = topic["text"];
  }

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
        y.push(100*row[key].slice(0, idx+1).reduce((partialSum, v) => partialSum + v[1], 0)/row["num_commits"])
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
      <div css={styles.summaryContainer}>
        <div css={styles.summaryContainerLabel}>
          Displaying top 5 selected repos, ordered by
        </div>
        <div css={styles.summaryContainerFilter}>
          <Dropdown
            selected={orderBy}
            setSelected={val => setOrderBy(val)}
            inputLabel={"Order by"}
            options={sortOptions}
          />
        </div>
      </div>
      <h3>Contributor activity</h3>
      <LineGraph title={keyToTitle["push_dates"]} showLegend={true}
                 traces={getTrace("push_dates")}/>
      <LineGraph title={"Ratio of issues closed to opened over time"}
                 showLegend={true} forceInteger={false}
                 traces={getTrace("issue_dates",
                   val => val[1] === 0 ? 0 : val[2]/val[1])}/>
      <LineGraph title={"Ratio of new vs returning contributors over time"}
                 showLegend={true}
                 traces={getTrace("commit_dates",
                   val => val[2] === 0 ? 0 : val[1]/val[2])}/>
      <LineGraph title={"Cumulative percentage of contributions by number of contributors"}
                 showLegend={true}
                 traces={getContribTrace("contrib_counts")}
                 normalizeTime={false}/>
      <h3>User activity</h3>
      <LineGraph title={keyToTitle["star_dates"]}
                 showLegend={true}
                 traces={getTrace("star_dates")}/>
    </div>
  );
};

export default SummaryPanel;
