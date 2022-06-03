import React from "react";
import { useTheme } from "@mui/material/styles";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { styled } from '@mui/material/styles';

import "core-js/features/url";
import "core-js/features/url-search-params";

import field_to_repos from "../data/fields";
import repo_data from "../data/repos";
import RepoCard from "./repo_card";

const ToolbarFormControl = styled(FormControl)(({ theme }) => ({
  verticalAlign: "middle",
  minWidth: "150px",
  width: null
}));

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(name, selectedValue, theme) {
  return {
    fontWeight:
      selectedValue !== name
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

const Dashboard = () => {

  const defaultFilterValues = {
    "field_of_study": "Speech recognition",
  };
  const sortOptions = {
    "Stars": "stargazers_count",
    "Watchers": "subscribers_count",
    "Releases": "num_releases",
    "Contributors": "num_contributors",
    "Created Date": "created_at",
    "Last Push Date": "pushed_at"
  };
  const theme = useTheme();

  const [filterValues, setFilterValues] = React.useState({...defaultFilterValues});
  const [orderBy, setOrderBy] = React.useState("stargazers_count");

  const handleSingleSelectChange = (event, key) => {
    const updatedFilterValues = {...filterValues};
    updatedFilterValues[key] = event.target.value;
    setFilterValues(updatedFilterValues);
  };

  const compareFn = (a, b) => {
    if(a > b){
      return -1
    } else if (b > a){
      return 1
    } else {
      return 0;
    }
  };

  return (
    <div>
      <Paper component={"div"} style={{textAlign: "left", top: 0, backgroundColor: "white", zIndex: "998", padding: "20px"}}>
        <Typography component={"span"} variant={"h5"} style={{verticalAlign: "middle"}}>Select a field of study </Typography>
        <div style={{margin: "15px 0px 10px 20px", display: "inline-block"}}>
          <ToolbarFormControl sx={{ m: 1}}>
            <InputLabel id="country-select-label">Field of Study</InputLabel>
            <Select
              labelId="fos-select-label"
              id="fos-select"
              value={filterValues["field_of_study"]}
              onChange={(evt) => handleSingleSelectChange(evt, "field_of_study")}
              input={<OutlinedInput label="Field of Study" />}
              MenuProps={MenuProps}
            >
            {Object.keys(field_to_repos).sort().map((name) => (
              <MenuItem
                key={name}
                value={name}
                style={getStyles(name, filterValues["field_of_study"], theme)}
              >
                {name}
              </MenuItem>
            ))}
            </Select>
          </ToolbarFormControl>
        </div>
        <Typography component={"span"} variant={"h5"} style={{verticalAlign: "middle"}}> ordered by </Typography>
        <div style={{margin: "15px 0px 10px 20px", display: "inline-block"}}>
          <ToolbarFormControl sx={{ m: 1}}>
            <InputLabel id="country-select-label">Order by</InputLabel>
            <Select
              labelId="fos-select-label"
              id="fos-select"
              value={orderBy}
              onChange={(evt) => setOrderBy(evt.target.value)}
              input={<OutlinedInput label="Order by" />}
              MenuProps={MenuProps}
            >
            {Object.keys(sortOptions).sort().map((name) => (
              <MenuItem
                key={sortOptions[name]}
                value={sortOptions[name]}
                style={getStyles(sortOptions[name], orderBy, theme)}
              >
                {name}
              </MenuItem>
            ))}
            </Select>
          </ToolbarFormControl>
        </div>
      </Paper>
      {field_to_repos[filterValues["field_of_study"]].sort((a, b) => compareFn(repo_data[a][orderBy], repo_data[b][orderBy])).map(repo_id => (
        <RepoCard data={repo_data[repo_id.toString()]} sortOptions={sortOptions}/>
      ))}
    </div>
  )
};

export default Dashboard;
