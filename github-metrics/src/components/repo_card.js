import React from "react";
import Typography from "@mui/material/Typography";
import { css } from "@emotion/react";
import {ButtonStyled, ExternalLink} from "@eto/eto-ui-components";

import "core-js/features/url";
import "core-js/features/url-search-params";

import {LineGraph} from "./graph";


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

const RepoCard = (props) => {
  const {data, metaMapping, field, graph_key, graph_title} = props;

  const repo_name = data["owner_name"]+"/"+data["current_name"];

  const getValue = (sort_key) => {
    if(data[sort_key] === null) {
      return 0;
    } else if(sort_key === "num_references"){
      return data[sort_key][field];
    }
    return data[sort_key];
  };

  const getX = (ary) => {
    return ary.map(elt => elt[0])
  };

  const getY = (ary) => {
    return ary.map(elt => elt[1])
  };

  const metaGroups = [
    ["stargazers_count", "subscribers_count", "num_contributors"],
    ["open_issues", "num_references"],
    ["created_at", "pushed_at"]
  ];

  return (
    <div css={styles.card}>
      <div>
        <div style={{width: "40%", display: "inline-block", verticalAlign: "top"}}>
          <span>
            <h4 style={{display: "inline-block", marginRight: "10px"}}><ExternalLink href={"https://github.com/"+repo_name}>{repo_name}</ExternalLink></h4>
            <span style={{display: "inline-block", fontSize: "80%"}}><ExternalLink href={"https://deps.dev/pypi/"+data["current_name"]}>[deps.dev]</ExternalLink></span>
          </span>
          <Typography component={"p"} variant={"body2"} css={styles.dataDesc}>
            {data["description"]}
          </Typography>
          {metaGroups.map((group, group_idx) => (
            <Typography component={"div"} variant={"body2"} css={styles.sortOption} key={`meta-group-${group_idx}`}>
              {group.map(option => (
                <span css={styles.nobreak} key={option}>
                  <span css={styles.emph}>{metaMapping[option]}</span>: {getValue(option)}
                </span>
              ))}
            </Typography>
          ))}
          <Typography component={"div"} variant={"body2"} css={styles.sortOption}>
            <span css={styles.nobreak}>
              <span css={styles.emph}>Funders</span>: tk
            </span>
          </Typography>
          <Typography component={"div"} variant={"body2"} css={styles.sortOption}>
            <span css={styles.nobreak}>
              <span css={styles.emph}>License TK</span>
            </span>
          </Typography>
        </div>
        <div style={{width: "59%", display: "inline-block", verticalAlign: "top"}}>
          <LineGraph traces={[{x: getX(data[graph_key]), y: getY(data[graph_key])}]}
                     title={graph_title} height={"250px"}/>
        </div>
      </div>
      <div style={{textAlign: "center"}}><ButtonStyled href={"/"}>More details</ButtonStyled></div>
    </div>
  )
};

export default RepoCard;
