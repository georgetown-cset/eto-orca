/*
Summary metrics for top five repos within current selection
 */
import React from "react";

import {LineGraph} from "./graph";
import {css} from "@emotion/react";

import {keyToTitle, sortMapping, getRepoName, sortByKey, customTopics, cleanFieldName} from "./utils";
import HighlightBox from "./highlight_box";
import {Accordion, Dropdown, ExternalLink} from "@eto/eto-ui-components";


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
  dropdownContainer: css`
    display: inline-block;
    vertical-align: middle;
    margin: 0px 0px 5px 5px;
  `,
  dropdownIntro: css`
    vertical-align: middle;
  `,
  statListElt: css`
    line-height: 1.5;
    list-style-type: none;
  `,
  statList: css`
    padding-left: 0px;
  `
};

const StatBox = ({stat, data, field=null, fieldName=null}) => {
  const fmtStat = sortMapping[stat].toLowerCase();
  const title = `Top repositories by ${stat === "num_references" ? fieldName+" references" : fmtStat}`;

  return (
    <HighlightBox title={title}>
      <ul css={styles.statList}>
        {!!data.length && sortByKey(data, stat, field).slice(0, 5).map((row) =>
          <li css={styles.statListElt}>
            <ExternalLink href={`/project?project_id=${row['id']}`}>
              {getRepoName(row)}
            </ExternalLink> ({stat === "num_references" ? row["num_references"][field] : row[stat]} {fmtStat})
          </li>
        )}
      </ul>
    </HighlightBox>
  )
};

const Summary = (props) => {
  const {data, sortOptions, field, isCurated} = props;

  const [orderBy, setOrderBy] = React.useState("stargazers_count");
  const [expanded, setExpanded] = React.useState(["push_dates"]);

  const fieldName = cleanFieldName(field);
  const topFive = sortByKey(data, orderBy, field).slice(0, 5);

  const getTrace = (key, yMap = val => val[1]) => {
    return topFive.map(row => ({
      x: row[key].map(val => val[0]),
      y: row[key].map(val => yMap(val)),
      name: getRepoName(row)
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
        name: getRepoName(row)
      })
    }
    return traces;
  };

  const accordionDetails = [
    {
      "id": "push_dates",
      "name": keyToTitle["push_dates"],
      "content": <LineGraph title={keyToTitle["push_dates"]} showLegend={true}
                 traces={getTrace("push_dates")}/>
    },
    {
      "id": "open_to_closed",
      "name": "Ratio of issues closed to opened over time",
      "content": <LineGraph title={"Ratio of issues closed to opened over time"}
                            showLegend={true} forceInteger={false}
                            traces={getTrace("issue_dates", val => val[1] === 0 ? 0 : val[2]/val[1])}/>
    },
    {
      "id": "new_vs_returning",
      "name": "Ratio of new vs returning contributors over time",
      "content": <LineGraph title={"Ratio of new vs returning contributors over time"}
                            showLegend={true}
                            traces={getTrace("commit_dates", val => val[2] === 0 ? 0 : val[1]/val[2])}/>
    },
    {
      "id": "pct_contribution",
      "name": "Cumulative percentage of contributions by number of contributors",
      "content": <LineGraph title={"Cumulative percentage of contributions by number of contributors"}
                            showLegend={true}
                            traces={getContribTrace("contrib_counts")}
                            normalizeTime={false}/>
    },
    {
      "id": "star_dates",
      "name": keyToTitle["star_dates"],
      "content": <LineGraph title={keyToTitle["star_dates"]}
                            showLegend={true}
                            traces={getTrace("star_dates")}/>
    }
  ];

  return (
    <div css={styles.card}>
      <h1 css={styles.summaryContainerLabel}>
        Currently tracking <strong>{data.length}</strong> software repositories {isCurated ? "related to" : "used for research into"} <strong>{fieldName}</strong>.
      </h1>
      <div>
        <StatBox stat={"stargazers_count"} data={data}/>
        <StatBox stat={"num_contributors"} data={data}/>
        {isCurated ?
          <StatBox stat={"open_issues"} data={data}/> :
          <StatBox stat={"num_references"} data={data} field={field} fieldName={fieldName}/>}
      </div>
      <h2 css={styles.summaryContainerLabel}>
        <span css={styles.dropdownIntro}>Trends over time for top repos by</span>
        <div css={styles.dropdownContainer}>
          <Dropdown
            selected={orderBy}
            setSelected={(val) => setOrderBy(val)}
            inputLabel={"Order by"}
            options={sortOptions}
          />
        </div>
      </h2>
        <Accordion
          key={JSON.stringify(expanded)}
          panels={accordionDetails}
          expanded={expanded}
          setExpanded={(newExpanded) => setExpanded(newExpanded)} headingVariant={"h6"}
        />
    </div>
  );
};

export default Summary;
