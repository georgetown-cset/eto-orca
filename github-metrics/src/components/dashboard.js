import React, {useEffect} from "react";
import FormControl from "@mui/material/FormControl";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import { Dropdown } from "@eto/eto-ui-components";

import "core-js/features/url";
import "core-js/features/url-search-params";

import RepoCard from "./repo_card";

const ToolbarFormControl = styled(FormControl)(({ theme }) => ({
  verticalAlign: "middle",
  minWidth: "150px",
  width: null
}));

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
  const sortOptions = [
    {"val": "stargazers_count", "text": "Stars"},
    {"val": "subscribers_count", "text": "Watchers"},
    {"val": "num_contributors", "text": "Contributors"},
    {"val": "created_at", "text": "Created Date"},
    {"val": "pushed_at", "text": "Last Push Date"},
    {"val": "open_issues", "text": "Open Issues"},
    {"val": "num_references", "text": "References"}
 ];
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

  const handleSingleSelectChange = (value, key) => {
    const updatedFilterValues = {...filterValues};
    updatedFilterValues[key] = value;
    setFilterValues(updatedFilterValues);
    mkRepoData(updatedFilterValues);
  };

  return (
    <div style={{backgroundColor: "white"}}>
      <div style={{textAlign: "left", top: 0, backgroundColor: "white", zIndex: "998", padding: "20px", width: "350px", float: "left"}}>
        <Typography component={"span"} variant={"h5"} style={{verticalAlign: "middle"}}>Select a field of study </Typography>
        <div style={{margin: "15px 0px 10px 20px", display: "inline-block"}}>
          <Dropdown
            selected={filterValues["field_of_study"]}
            setSelected={(val) => handleSingleSelectChange(val, "field_of_study")}
            inputLabel={"Field of Study"}
            options={fields.sort().map(f => ({"text": f, "val": f}))}
          />
        </div>
      </div>
      <div style={{overflow: "auto"}}>
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
          <div style={{marginTop: "5px"}}>
            <Dropdown
              selected={filterValues["order_by"]}
              setSelected={(val) => handleSingleSelectChange(val, "order_by")}
              inputLabel={"Order by"}
              options={sortOptions}
            />
          </div>
          {repoData.map(repo => (
            <RepoCard data={repo} sortOptions={sortOptions} field={filterValues["field_of_study"]}/>
          ))}
        </TabPanel>
      </div>
    </div>
  )
};

export default Dashboard;
