import React, {useEffect} from "react";
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

const dataUrl = "https://us-east1-gcp-cset-projects.cloudfunctions.net/github-metrics/";

function getStyles(name, selectedValue, theme) {
  return {
    fontWeight:
      selectedValue !== name
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

const Dashboard = () => {
  useEffect(() => {
    mkFields().then(mkRepoData());
  }, []);
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
  async function mkFields(){
    let response = await fetch(dataUrl).catch((error) => {
      console.log(error);
    });
    const data = (await response.json())["fields"];
    setFields(data);
  }
  async function mkRepoData(){
    const params = new URLSearchParams({"field": filterValues["field_of_study"], "order_by": orderBy}).toString();
    let response = await fetch(dataUrl+"?"+params).catch((error) => {
      console.log(error);
    });
    const data = (await response.json())["matches"];
    setRepoData(data);
  }
  const [filterValues, setFilterValues] = React.useState({...defaultFilterValues});
  const [orderBy, setOrderBy] = React.useState("stargazers_count");
  const [fields, setFields] = React.useState([]);
  const [repoData, setRepoData] = React.useState([]);

  const handleSingleSelectChange = (event, key) => {
    const updatedFilterValues = {...filterValues};
    updatedFilterValues[key] = event.target.value;
    setFilterValues(updatedFilterValues);
    mkRepoData();
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
            {fields.sort().map((name) => (
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
      {repoData.map(repo => (
        <RepoCard data={repo} sortOptions={sortOptions}/>
      ))}
    </div>
  )
};

export default Dashboard;
