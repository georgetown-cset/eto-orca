/*
Basic project metadata, currently displayed in a few lines of text
 */
import React from "react";
import { css } from "@emotion/react";

import {HelpTooltip} from "@eto/eto-ui-components";
import {helpStyle, getTooltip} from "./utils";

import "core-js/features/url";
import "core-js/features/url-search-params";

import {cleanFieldName, FIELD_KEYS, metaMapping} from "./utils";


const styles = {
  metaSection: css`
    word-wrap: nobreak;
    margin-right: 10px;
    line-height: 1.5;
  `,
  sortOption: css`
    margin-right: 10px;
  `,
  nowrap: css`
    white-space: nowrap;
  `
};

const ProjectMetadata = (props) => {
  const {data, showNumReferences=false, field=null} = props;

  const getValue = (key) => {
    if(!data[key]) {
      return 0;
    } else if(showNumReferences && FIELD_KEYS.includes(key)){
      return !(field in data[key]) ? 0 : data[key][field];
    } else if(key === "criticality_score"){
      return data[key].toFixed(2);
    }
    return data[key];
  };

  const metaGroups = [
    ["stargazers_count", "subscribers_count"],
    ["criticality_score"],
    ["num_references"],
    ["open_issues", "num_contributors"],
    ["created_at"],
    ["pushed_at"],
    ["license"],
    ["language"]
  ];

  return (
    <div>
      {metaGroups.map((group, group_idx) => (
        <div css={styles.sortOption} key={`meta-group-${group_idx}`}>
          {group.map(option => ((showNumReferences) || (option !== "num_references")) && (
            <span css={styles.metaSection} key={option}>
              {option === "num_references" ?
                <span>{getValue(option)} mentions in <strong>{cleanFieldName(field)}</strong> articles ({getValue("relevance").toFixed(2)} <span css={styles.nowrap}>relevance<HelpTooltip style={helpStyle} text={getTooltip("relevance_list")}/>)</span></span>
              :
                <span><strong>{metaMapping[option]}</strong>: {getValue(option)}</span>
              }
            </span>
          ))}
        </div>
      ))}
    </div>
  )
};

export default ProjectMetadata;
