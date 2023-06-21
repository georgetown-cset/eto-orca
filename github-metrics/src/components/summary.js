/*
Summary metrics for top five repos within current selection
 */
import React, {useEffect} from "react";

import {LineGraph} from "./graph";
import {css} from "@emotion/react";

import {keyToTitle, sortMapping, getRepoName, sortByKey, cleanFieldName, cleanFieldKey, FIELD_KEYS} from "./utils";
import HighlightBox from "./highlight_box";
import {Accordion, Dropdown, ExternalLink} from "@eto/eto-ui-components";


const styles = {
  card: css`
    padding: 20px 0px;
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
  `,
  statDetail: css`
    padding-left: 10px;
  `,
  statWrapper: css`
    text-align: center;
  `,
  headerContainer: css`
    margin: 0 20px;
  `
};

const StatBox = ({stat, data, yearly=null, field=null, fieldName=null}) => {
  const fmtStat = sortMapping[stat].toLowerCase();
  const title = `Top repositories by ${stat === "relevance" ? `relevance to ${fieldName}` : fmtStat}`;
  const yearlyRepoStats = {};
  if(yearly !== null) {
    for (let repoStat of yearly) {
      const numYears = repoStat.y.length;
      const change = (100*(repoStat.y[numYears - 1] - repoStat.y[numYears - 2]) / repoStat.y[numYears - 2]).toFixed(2);
      const prettyChange = `${change < 0 ? "" : "+"}${change}`;
      yearlyRepoStats[repoStat.name] = {
        numYears: numYears,
        change: prettyChange,
        startYear: repoStat.x[numYears - 2],
        endYear: repoStat.x[numYears - 1]
      };
    }
  }

  return (
    <HighlightBox title={title} isTall={true}>
      <ul css={styles.statList}>
        {!!data.length && sortByKey(data, stat, field).slice(0, 5).map((row) =>
          <li css={styles.statListElt}>
            <ExternalLink href={`/project?name=${getRepoName(row)}`}>
              {getRepoName(row)}
            </ExternalLink><br/>
            <span css={styles.statDetail}>
              {stat === "relevance" ?
                <span><strong>{row["relevance"][cleanFieldKey(field)].toFixed(2)}</strong> {fmtStat} (<strong>{row["num_references"][cleanFieldKey(field)]}</strong> references)</span> :
                <span><strong>{row[stat]}</strong> {fmtStat} (<strong>{yearlyRepoStats[getRepoName(row)].change}</strong>%, {yearlyRepoStats[getRepoName(row)].startYear}-{yearlyRepoStats[getRepoName(row)].endYear})</span>}
            </span>
          </li>
        )}
      </ul>
    </HighlightBox>
  )
};

const Summary = ({data, sortOptions, field, isCurated}) => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has(ORDER_BY_URL_PARAM) && urlParams.get(ORDER_BY_URL_PARAM)){
      const urlOrder = urlParams.get(ORDER_BY_URL_PARAM);
      if(FIELD_KEYS.includes(urlOrder) && isCurated){
        // override the url order if it's not applicable to the selected field
        setOrderBy(DEFAULT_ORDER_BY);
      } else {
        setOrderBy(urlOrder);
      }
    }
  }, []);

  const DEFAULT_ORDER_BY = "stargazers_count";
  const ORDER_BY_URL_PARAM = "summary_order";
  const [orderBy, setOrderBy] = React.useState(DEFAULT_ORDER_BY);
  const [expanded, setExpanded] = React.useState(["push_dates"]);

  const fieldName = cleanFieldName(field);

  const getTrace = (key, yMap = val => val[1], currOrderBy=orderBy) => {
    const topFive = sortByKey(data, currOrderBy, field).slice(0, 5);
    return topFive.map(row => ({
      x: row[key].map(val => val[0]),
      y: row[key].map(val => yMap(val)),
      name: getRepoName(row)
    }))
  };

  const getContribTrace = (key) => {
    const topFive = sortByKey(data, orderBy, field).slice(0, 5);
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

  const updateOrderBy = (newSort) => {
    const urlParams = new URLSearchParams(window.location.search);
    if(newSort !== DEFAULT_ORDER_BY) {
      urlParams.set(ORDER_BY_URL_PARAM, newSort)
    } else {
      urlParams.delete(ORDER_BY_URL_PARAM);
    }
    const params = urlParams.toString().length > 0 ? "?" + urlParams.toString() : "";
    window.history.replaceState(null, null, window.location.pathname + params);
    setOrderBy(newSort);
  };

  return (
    <div css={styles.card}>
      <div css={styles.headerContainer}>
        <h1 css={styles.summaryContainerLabel}>
          Currently tracking <strong>{data.length}</strong> software repositories {isCurated ? "related to" : "used for research into"} <strong>{fieldName}</strong>.
        </h1>
        <div css={styles.statWrapper}>
          <StatBox stat={"stargazers_count"} yearly={getTrace("star_dates", val => val[1], "stargazers_count")} data={data}/>
          <StatBox stat={"num_contributors"} yearly={getTrace("commit_dates", val => val[1]+val[2], "num_contributors")} data={data}/>
          {isCurated ?
            <StatBox stat={"open_issues"} yearly={getTrace("issue_dates", val => val[2], "open_issues")} data={data}/> :
            <StatBox stat={"relevance"} data={data} field={field} fieldName={fieldName}/>}
        </div>
        <h2 css={styles.summaryContainerLabel}>
          <span css={styles.dropdownIntro}>Trends over time for top repos by</span>
          <div css={styles.dropdownContainer}>
            <Dropdown
              selected={orderBy}
              setSelected={(val) => updateOrderBy(val)}
              inputLabel={"Order by"}
              options={sortOptions}
            />
          </div>
        </h2>
      </div>
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
