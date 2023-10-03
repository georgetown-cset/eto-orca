/*
Summary metrics for top five repositories within current selection
 */
import React, {useEffect} from "react";

import {LineGraph} from "./graph";
import {css} from "@emotion/react";

import {keyToTitle, sortMappingBlurb, getRepoName, sortByKey, cleanFieldName, FIELD_KEYS, getTooltip} from "./utils";
import HighlightBox from "./highlight_box";
import {Accordion, Dropdown, ExternalLink, HelpTooltip} from "@eto/eto-ui-components";


const styles = {
  card: css`
    padding: 20px 0px;
  `,
  summaryContainerLabel: css`
    display: inline-block;
    vertical-align: bottom;
    font-weight: bold;
    padding-bottom: 16px;

    & .dropdown label {
      font-weight: normal;
    }
  `,
  dropdownContainer: css`
    display: inline-block;
    vertical-align: middle;
    margin: 0px 0px 5px 5px;
  `,
  dropdownIntro: css`
    vertical-align: middle;
  `,
  graphHeader: css`
    margin: 20px 20px 10px 20px;
  `,
  pctGraph: css`
    padding: 0px 10px 20px 10px;
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
  statTitle: css`
    font-weight: normal;
  `,
  headerContainer: css`
    margin: 0 20px;
  `
};

const StatBox = ({stat, data, yearly=null, field=null, fieldName=null}) => {
  const fmtStat = sortMappingBlurb[stat].toLowerCase();
  const title = <span css={styles.statTitle}>
    Top repositories by <strong>{stat === "relevance" ? <span>relevance to {fieldName} research <HelpTooltip text={getTooltip("relevance_list")}/></span> : fmtStat}</strong>
  </span>;
  const yearlyRepoStats = {};
  if(yearly !== null) {
    for (let repoStat of yearly) {
      const numYears = repoStat.y.length;
      const change = (100*(repoStat.y[numYears - 1] - repoStat.y[numYears - 2]) / repoStat.y[numYears - 2]).toFixed(2);
      const prettyChange = `${change < 0 ? "" : "+"}${change}`;
      const isBad = (repoStat.y[numYears - 2] === 0) || (!repoStat.x[numYears - 2]) || (!repoStat.x[numYears - 1]) || (repoStat.x[numYears - 2] === repoStat.x[numYears - 1]);
      yearlyRepoStats[repoStat.name] = {
        numYears: numYears,
        change: prettyChange,
        startYear: repoStat.x[numYears - 2],
        endYear: repoStat.x[numYears - 1],
        isBad: isBad
      };
    }
  }

  return (
    <HighlightBox title={title} isTall={true}>
      <ul css={styles.statList}>
        {!!data.length && sortByKey(data, stat, field).slice(0, 5).map((row) =>
          <li css={styles.statListElt} key={getRepoName(row)}>
            <a href={`/project?name=${getRepoName(row)}`}>
              {getRepoName(row)}
            </a><br/>
            <span css={styles.statDetail}>
              {stat === "relevance" ?
                <span><strong>{row["relevance"][field].toFixed(2)}</strong> {fmtStat} (<strong>{row["num_references"][field]}</strong> references)</span> :
                <span><strong>{row[stat]}</strong> {fmtStat}{!yearlyRepoStats[getRepoName(row)].isBad && <span> (<strong>{yearlyRepoStats[getRepoName(row)].change}</strong>%, {yearlyRepoStats[getRepoName(row)].startYear}-{yearlyRepoStats[getRepoName(row)].endYear})</span>}</span>}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      "content": <div>
        <div css={styles.graphHeader}>
          This graph shows the number of commits made to any branch of the displayed projects each year, as reported in GitHub Archive PushEvents. Within a project,
          we deduplicate commits based on their hash.
        </div>
        <LineGraph title={keyToTitle["push_dates"]} showLegend={true}
                 traces={getTrace("push_dates")}/>
      </div>
    },
    {
      "id": "open_to_closed",
      "name": "Ratio of issues and pull requests closed to opened over time",
      "content": <div>
        <div css={styles.graphHeader}>
          This graph shows the ratio of the number of issues and pull requests closed to opened each year in the displayed projects, as reported in GitHub Archive IssuesEvents. A high ratio of new
          issues opened to issues closed might indicate the project needs more maintenance capacity. For further discussion, see
          the CHAOSS metrics <ExternalLink href={"https://chaoss.community/kb/metric-issues-new/"}>Issues New</ExternalLink> and <ExternalLink href={"https://chaoss.community/kb/metric-issues-closed/"}>Issues Closed</ExternalLink>.
        </div>
        <LineGraph title={"Ratio of issues and pull requests closed to opened over time"}
                            showLegend={true} forceInteger={false}
                            traces={getTrace("issue_dates", val => val[1] === 0 ? 0 : val[2]/val[1])}/>
      </div>
    },
    {
      "id": "new_vs_returning",
      "name": "Ratio of new vs returning contributors over time",
      "content": <div>
        <div css={styles.graphHeader}>
          This graph shows the number of contributors who made a commit for the first time in a given year divided by
          the number of contributors that had made a commit in a previous year, as reported in GitHub Archive PushEvents.
          We currently only identify individual contributors based on their names, which may change over time. For further discussion,
          see the CHAOSS metrics <ExternalLink href={"https://chaoss.community/kb/metric-new-contributors/"}>New Contributors</ExternalLink> and <ExternalLink href={"https://chaoss.community/kb/metric-inactive-contributors/"}>Inactive Contributors</ExternalLink>.
        </div>
        <LineGraph title={"Ratio of new vs returning contributors over time"}
                            showLegend={true}
                            traces={getTrace("commit_dates", val => val[2] === 0 ? 0 : val[1]/val[2])}/>
      </div>
    },
    {
      "id": "pct_contribution",
      "name": "Percentage of commits by top 20 contributors",
      "content": (
        <div>
          <div css={styles.graphHeader}>
            This graph shows the cumulative percentage of commits to any branch that are made by the top 20 contributors across all years, as reported in GitHub Archive PushEvents. Within a project, we deduplicate commits based on their hash. We currently only identify individual contributors based on their names, which may change over time.
            Repositories with fewer than 20 contributors will show a partial line. For related discussion, see the CHAOSS metric <ExternalLink href={"https://chaoss.community/kb/metric-bus-factor/"}>Bus Factor</ExternalLink>.
          </div>
          <div css={styles.pctGraph}>
          <LineGraph title={"Cumulative percentage of commits by top 20 contributors"}
                            showLegend={true}
                            traces={getContribTrace("contrib_counts")}
                            normalizeTime={false}
                            xTitle={"Contributor ranking"}
                            yTitle={"Percentage of commits"}
          />
          </div>
        </div>
      )
    },
    {
      "id": "star_dates",
      "name": keyToTitle["star_dates"],
      "content": <div>
        <div css={styles.graphHeader}>
          This graph shows the number of new stars added to each project during each year we track, as reported in GitHub Archive WatchEvents.
        </div>
        <LineGraph title={keyToTitle["star_dates"]}
                            showLegend={true}
                            traces={getTrace("star_dates")}/>
      </div>
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
    if (window.plausible) {
      window.plausible("Set summary sort", {props: {
        "sort_metric": newSort
      }});
    }
  };

  const setAndLogExpanded = (newExpanded) => {
    if (window.plausible) {
      window.plausible("Set summary accordion state", {props: {
        "expanded": JSON.stringify(newExpanded)
      }});
    }
    setExpanded(newExpanded)
  };

  return (
    <div css={styles.card}>
      <div css={styles.headerContainer}>
        <h1 css={styles.summaryContainerLabel}>
          Currently tracking <a href={window.location.href.includes("?") ? window.location.href+"&show_list=true" : window.location.href.replace(/\/.*/, "")+"/?show_list=true"}><strong>{data.length}</strong> software repositories</a> {isCurated ? "related to" : "mentioned in research into"} <strong>{fieldName}</strong>.
        </h1>
        <div css={styles.statWrapper}>
          {isCurated ?
            <StatBox key={"open_issues"} stat={"open_issues"} yearly={getTrace("issue_dates", val => val[2], "open_issues")} data={data}/> :
            <StatBox key={"relevance"} stat={"relevance"} data={data} field={field} fieldName={fieldName}/>}
          <StatBox key={"stargazers_count"} stat={"stargazers_count"} yearly={getTrace("star_dates", val => val[1], "stargazers_count")} data={data}/>
          <StatBox key={"num_contributors"} stat={"num_contributors"} yearly={getTrace("commit_dates", val => val[1]+val[2], "num_contributors")} data={data}/>
        </div>
        <h2 css={styles.summaryContainerLabel}>
          <span css={styles.dropdownIntro}>Trends over time for top repositories by</span>
          <div css={styles.dropdownContainer}>
            <Dropdown
              alignSelectionWithLabel={false}
              selected={orderBy}
              setSelected={(val) => updateOrderBy(val)}
              inputLabel={"Sort by"}
              options={sortOptions}
            />
          </div>
        </h2>
      </div>
      <Accordion
        key={JSON.stringify(expanded)}
        panels={accordionDetails}
        expanded={expanded}
        updateExpanded={(newExpanded) => setAndLogExpanded(newExpanded)} headingVariant={"h6"}
      />
    </div>
  );
};

export default Summary;
