/*
Basic project metadata, currently displayed in a few lines of text
 */
import React from "react";
import { css } from "@emotion/react";

import "core-js/features/url";
import "core-js/features/url-search-params";

import {cleanFieldKey, cleanFieldName, FIELD_KEYS, metaMapping} from "./utils";


const styles = {
  metaSection: css`
    word-wrap: nobreak;
    margin-right: 10px;
    line-height: 1.5;
  `,
  sortOption: css`
    margin-right: 10px;
  `
};

const ProjectMetadata = (props) => {
  const {data, showNumReferences=false, field=null} = props;

  const getValue = (key) => {
    if(!data[key]) {
      return 0;
    } else if(showNumReferences && FIELD_KEYS.includes(key)){
      const cleanField = cleanFieldKey(field);
      return !(cleanField in data[key]) ? 0 : data[key][cleanField];
    }
    return data[key];
  };

  const metaGroups = [
    ["stargazers_count", "subscribers_count"],
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
                <span>{getValue(option)} references in <strong>{cleanFieldName(field)}</strong> articles ({getValue("relevance").toFixed(2)} relevance)</span>
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
