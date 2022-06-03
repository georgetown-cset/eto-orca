import React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

import "core-js/features/url";
import "core-js/features/url-search-params";


const RepoCard = (props) => {
  const {data, sortOptions} = props;

  const repo_name = data["owner_name"]+"/"+data["current_name"];

  return (
    <Paper style={{maxWidth: "1000px", margin: "20px auto", padding: "20px"}}>
     <Link href={"https://github.com/"+repo_name}>{repo_name}</Link>
      <div>
      {Object.keys(sortOptions).map(sortname => (
        <Typography component={"span"} variant={"body2"} style={{marginRight: "10px"}}>
          <span style={{fontWeight: "bold"}}>{sortname}</span>: {data[sortOptions[sortname]] === null ? 0 : data[sortOptions[sortname]]}
        </Typography>
      ))}
      <Typography component={"p"} variant={"body2"} style={{marginTop: "15px"}}>
        {data["description"]}
      </Typography>
      </div>
    </Paper>
  )
};

export default RepoCard;
