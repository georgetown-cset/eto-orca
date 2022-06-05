import React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

import "core-js/features/url";
import "core-js/features/url-search-params";


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
  }

  return (
    <Paper style={{maxWidth: "1000px", margin: "20px auto", padding: "20px"}}>
     <Link href={"https://github.com/"+repo_name}>{repo_name}</Link>
      <div>
      {Object.keys(sortOptions).map(sortname => (
        <Typography component={"span"} variant={"body2"} style={{marginRight: "10px"}}>
          <span style={{fontWeight: "bold"}}>{sortname}</span>: {getValue(sortOptions[sortname])}
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
