/*
Summary metrics for top five repos within current selection
 */
import React from "react";

import {LineGraph} from "./graph";
import {css} from "@emotion/react";

import {keyToTitle, sortMapping} from "./utils";


const styles = {
  card: css`
    padding: 20px;
  `,
  summaryContainerLabel: css`
    display: inline-block;
    vertical-align: bottom;
    font-weight: bold;
    padding-bottom: 16px;
  `,
};

const SummaryPanel = (props) => {
  const {data, orderBy, field, isCurated, customTopics} = props;
  const customTopicMap = {};
  for(let topic of customTopics){
    customTopicMap[topic["val"]] = topic["text"];
  }
  let fieldName = field;
  if(field in customTopicMap){
    fieldName = customTopicMap[field];
  }
  fieldName = fieldName.toLowerCase();
  for(let [patt, capitalized] of [[/(\b)ai(\b)/, "$1AI$2"], [/risc-v/, "RISC-V"]]){
    fieldName = fieldName.replace(patt, capitalized);
  }
  const traceData = [...data];
  traceData.sort((r1, r2) => r2[orderBy] - r1[orderBy]);
  const topFive = traceData.slice(0, 5);

  const getTrace = (key, yMap = val => val[1]) => {
    return topFive.map(row => ({
      x: row[key].map(val => val[0]),
      y: row[key].map(val => yMap(val)),
      name: row["owner_name"]+"/"+row["current_name"]
    }))
  };

  const getContribTrace = (key) => {
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
      <h1 css={styles.summaryContainerLabel}>
        Currently tracking {data.length} software repositories {isCurated ? "related to" : "used for research into"} {fieldName}.
      </h1>
      <h2 css={styles.summaryContainerLabel}>
        Displaying the top 5 selected software repositories, ordered by {sortMapping[orderBy].toLowerCase()}.
      </h2>
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
