import React from "react";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { css } from "@emotion/react";

import "core-js/features/url";
import "core-js/features/url-search-params";

import {LineGraph} from "../components/graph";


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
  sortOption: css`
    margin-right: 10px;
  `,
  dataDesc: css`
    margin-top: 15px;
  `
};

const RepoCard = (props) => {
  const {data, sortOptions, field} = props;

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

  return (
    <div css={styles.card}>
      <Link href={"https://github.com/"+repo_name}>{repo_name}</Link>
      <div>
        {Object.keys(sortOptions).map(sortname => (
          <Typography component={"span"} variant={"body2"} css={styles.sortOption}>
            <span css={styles.emph}>{sortname}</span>: {getValue(sortOptions[sortname])}
          </Typography>
        ))}
        <Typography component={"p"} variant={"body2"} css={styles.dataDesc}>
          {data["description"]}
        </Typography>
      </div>
      <div>
        <LineGraph traces={[{x: getX(data["star_dates"]), y: getY(data["star_dates"])}]} title={"Stars over Time"}/>
        <LineGraph traces={[{x: getX(data["push_dates"]), y: getY(data["push_dates"])}]} title={"Push Events over Time"}/>
      </div>
    </div>
  )
};

export default RepoCard;
