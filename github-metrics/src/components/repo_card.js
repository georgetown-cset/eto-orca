import React from "react";
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";

import "core-js/features/url";
import "core-js/features/url-search-params";


const RepoCard = (props) => {
  const {data} = props;

  const repo_name = data["owner_name"]+"/"+data["current_name"];

  return (
    <Paper style={{maxWidth: "1000px", margin: "20px auto", padding: "20px"}}>
     <Link href={"https://github.com/"+repo_name}>{repo_name}</Link>
    </Paper>
  )
};

export default RepoCard;
