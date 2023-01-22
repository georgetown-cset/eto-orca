import React from "react";
import Typography from "@mui/material/Typography";
import { css } from "@emotion/react";

import "core-js/features/url";
import "core-js/features/url-search-params";



const styles = {
  card: css`
    max-width: 100%;
    margin: 20px auto;
    padding: 20px;
    border: 1px solid black;
    border-radius: 5px;
  `,
  emph: css`
    font-weight: bold;
  `,
  nobreak: css`
    word-wrap: nobreak;
    margin-right: 10px;
  `,
  sortOption: css`
    margin-right: 10px;
  `,
  dataDesc: css`
    margin: 15px 0px;
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

  const metaMapping = {
    "stargazers_count": "Stars",
    "subscribers_count": "Watchers",
    "num_contributors": "Contributors",
    "created_at": "Created Date",
    "pushed_at": "Last Push Date",
    "open_issues": "Open Issues",
    "num_references": "References",
    "license": "License",
    "language": "Top Programming Language"
  };

  const metaGroups = [
    ["stargazers_count", "subscribers_count", "num_contributors"],
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
            <span css={styles.nobreak} key={option}>
              <span css={styles.emph}>{metaMapping[option]}</span>: {getValue(option)}
            </span>
          ))}
        </Typography>
      ))}
    </div>
  )
};

export default ProjectMetadata;
