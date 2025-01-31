import React from 'react';
import { css } from '@emotion/react';

import { HelpTooltip } from '@eto/eto-ui-components';

import HighlightBox from "./highlight_box";
import {
  getRepoName,
  getTooltip,
  sortByKey,
  sortMappingBlurb,
} from "../util";

const styles = {
  statTitle: css`
    font-weight: normal;
  `,
  statList: css`
    padding-left: 0px;
  `,
  statListElt: css`
    line-height: 1.5;
    list-style-type: none;
  `,
  statDetail: css`
    padding-left: 10px;
  `,
};

const StatBox = ({
  stat,
  data,
  yearly=null,
  field=null,
  fieldName=null,
}) => {
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

export default StatBox;
