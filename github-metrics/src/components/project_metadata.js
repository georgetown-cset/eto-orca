/*
Basic project metadata, currently displayed in a few lines of text
 */
import React from "react";
import Typography from "@mui/material/Typography";
import { css } from "@emotion/react";

import "core-js/features/url";
import "core-js/features/url-search-params";

import {metaMapping} from "./utils";


const styles = {
  emph: css`
    font-weight: bold;
  `,
  metaSection: css`
    word-wrap: nobreak;
    margin-right: 10px;
  `,
  sortOption: css`
    margin-right: 10px;
  `
};

const ProjectMetadata = (props) => {
  const {data, showNumReferences=false, field=null} = props;

  const getValue = (sort_key) => {
    if(data[sort_key] === null) {
      return 0;
    } else if(showNumReferences && (sort_key === "num_references")){
      return data[sort_key][field];
    }
    return data[sort_key];
  };

  const metaGroups = [
    ["stargazers_count", "num_contributors"],
    ["open_issues", "num_references"],
    ["created_at", "pushed_at"],
    ["license"],
    ["language"]
  ];

  return (
    <div>
      {metaGroups.map((group, group_idx) => (
        <Typography component={"div"} variant={"body2"} css={styles.sortOption} key={`meta-group-${group_idx}`}>
          {group.map(option => ((showNumReferences) || (option !== "num_references")) && (
            <span css={styles.metaSection} key={option}>
              <span css={styles.emph}>{metaMapping[option]}</span>: {getValue(option)}
            </span>
          ))}
        </Typography>
      ))}
    </div>
  )
};

export default ProjectMetadata;
