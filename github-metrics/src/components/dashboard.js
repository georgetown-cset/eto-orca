import React, {useEffect} from "react";
import { useTheme } from "@mui/material/styles";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";

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

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <div>
          <Typography component={"div"}>{children}</Typography>
        </div>
      )}
    </div>
  );
}

const StyledTabs = styled(Tabs)({
  "& .MuiTabs-indicator": {
    backgroundColor: "var(--bright-blue)"
  },
  "& .Mui-selected": {
    color: "var(--dark-blue)",
    fontWeight: "bold",
    backgroundColor: "var(--bright-blue-light)",
  }
});

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

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
    mkFields();
  }, []);
  const defaultFilterValues = {
    "field_of_study": "Speech recognition",
    "order_by": "num_references"
  };
  const sortOptions = {
    "Stars": "stargazers_count",
    "Watchers": "subscribers_count",
    "Contributors": "num_contributors",
    "Created Date": "created_at",
    "Last Push Date": "pushed_at",
    "Open Issues": "open_issues",
    "References": "num_references"
  };
  const theme = useTheme();
  async function mkFields(){
    let response = await fetch(dataUrl).catch((error) => {
      console.log(error);
    });
    if(response !== undefined) {
      const data = (await response.json())["fields"];
      setFields(data);
      mkRepoData(defaultFilterValues);
    } else{
      console.log("No response for mkFields")
    }
  }
  async function mkRepoData(filterValues){
    const params = new URLSearchParams({"field": filterValues["field_of_study"],
      "order_by": filterValues["order_by"]}).toString();
    let response = await fetch(dataUrl+"?"+params).catch((error) => {
      console.log(error);
    });
    if(response !== undefined) {
      const data = (await response.json())["matches"];
      setRepoData(data);
    } else{
      console.log("No response for "+JSON.stringify(filterValues))
    }
  }
  const [filterValues, setFilterValues] = React.useState({...defaultFilterValues});
  const [fields, setFields] = React.useState([]);
  const [repoData, setRepoData] = React.useState([]);
  const [tabValue, setTabValue] = React.useState(0);

  const handleSingleSelectChange = (event, key) => {
    const updatedFilterValues = {...filterValues};
    updatedFilterValues[key] = event.target.value;
    setFilterValues(updatedFilterValues);
    mkRepoData(updatedFilterValues);
  };

  return (
    <div>
      <Paper component={"div"} style={{textAlign: "left", top: 0, backgroundColor: "white", zIndex: "998", padding: "20px"}}>
        <Typography component={"span"} variant={"h5"} style={{verticalAlign: "middle"}}>Select a field of study </Typography>
        <div style={{margin: "15px 0px 10px 20px", display: "inline-block"}}>
          <ToolbarFormControl sx={{ m: 1}}>
            <InputLabel id="fos-select-label">Field of Study</InputLabel>
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
            <InputLabel id="order-by-select-label">Order by</InputLabel>
            <Select
              labelId="order-by-select-label"
              id="order-by-select"
              value={filterValues["order_by"]}
              onChange={(evt) => handleSingleSelectChange(evt, "order_by")}
              input={<OutlinedInput label="Order by" />}
              MenuProps={MenuProps}
            >
            {Object.keys(sortOptions).sort().map((name) => (
              <MenuItem
                key={sortOptions[name]}
                value={sortOptions[name]}
                style={getStyles(sortOptions[name], filterValues["order_by"], theme)}
              >
                {name}
              </MenuItem>
            ))}
            </Select>
          </ToolbarFormControl>
        </div>
      </Paper>
      <div style={{ borderBottom: 1, borderColor: "divider", position: "sticky", top: "0", zIndex: 200, backgroundColor: "white"}}>
        <StyledTabs value={tabValue} onChange={(evt, newValue) => {setTabValue(newValue)}} aria-label="map of science tabs">
          <Tab label="Field summary" {...a11yProps(0)} />
          <Tab label="Repository list" {...a11yProps(1)} />
        </StyledTabs>
      </div>
      <TabPanel value={tabValue} index={0}>
        <span>This is where the summary view will go</span>
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {repoData.map(repo => (
          <RepoCard data={repo} sortOptions={sortOptions} field={filterValues["field_of_study"]}/>
        ))}
      </TabPanel>
    </div>
  )
};

export default Dashboard;
