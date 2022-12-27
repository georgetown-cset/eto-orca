import React, {useEffect} from "react";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import { Dropdown } from "@eto/eto-ui-components";

import "core-js/features/url";
import "core-js/features/url-search-params";

import RepoCard from "./repo_card";
import SummaryPanel from "./summary_panel";

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

const Dashboard = () => {
  useEffect(() => {
    mkFields();
  }, []);
  const defaultFilterValues = {
    "field_of_study": "Speech recognition",
    "order_by": "num_references",
    "compare_graph": "push_dates",
    "topic": "",
    "language": "Coming soon!",
    "license": "Coming soon!"
  };
  const sortMapping = {
    "stargazers_count": "Stars",
    "subscribers_count": "Watchers",
    "num_contributors": "Contributors",
    "created_at": "Created Date",
    "pushed_at": "Last Push Date",
    "open_issues": "Open Issues",
    "num_references": "References"
  };
  const sortOptions = Object.entries(sortMapping).map(e => ({"val": e[0], "text": e[1]}));
  const compareMapping = {
    "star_dates": "Stars over time",
    "push_dates": "Push events over time"
  };
  const compareOptions = Object.entries(compareMapping).map(e => ({"val": e[0], "text": e[1]}));
  const topicsMapping = {
    "riscv": "RISC-V",
    "speech_recognition": "Speech recognition",
    "ai_safety": "AI Safety"
  };
  const topicOptions = Object.entries(topicsMapping).map(e => ({"val": e[0], "text": e[1]}));

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
      <div style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.12)", borderColor: "divider", backgroundColor: "white"}}>
        <StyledTabs value={tabValue} onChange={(evt, newValue) => {setTabValue(newValue)}} aria-label="OSS tracker tabs">
          <Tab label="Field summary" {...a11yProps(0)} />
          <Tab label="Repository list" {...a11yProps(1)} />
        </StyledTabs>
      </div>
      <div>
        <div style={{textAlign: "left", padding: "20px", width: "25%", display: "inline-block", verticalAlign: "top"}}>
          <div>
            <h3>Select a subject</h3>
            <div style={{margin: "15px 0px 10px 20px"}}>
              <Dropdown
                selected={filterValues["topic"]}
                setSelected={(val) => handleSingleSelectChange(val, "topic")}
                inputLabel={"Curated topic area"}
                options={topicOptions}
              />
            </div>
            <div style={{textAlign: "center"}}>or (advanced)</div>
            <div style={{margin: "15px 0px 10px 20px"}}>
              <Dropdown
                selected={filterValues["field_of_study"]}
                setSelected={(val) => handleSingleSelectChange(val, "field_of_study")}
                inputLabel={"Field of study"}
                options={fields.sort().map(f => ({"text": f, "val": f}))}
              />
            </div>
          </div>
          <div>
            <h3>Filter further</h3>
            <div style={{margin: "15px 0px 10px 20px"}}>
              <Dropdown
                selected={filterValues["language"]}
                setSelected={(val) => handleSingleSelectChange(val, "language")}
                inputLabel={"Top programming language"}
                options={[{"text": "Coming soon!", "val": "coming_soon"}]}
              />
            </div>
            <div style={{margin: "15px 0px 10px 20px"}}>
              <Dropdown
                selected={filterValues["license"]}
                setSelected={(val) => handleSingleSelectChange(val, "license")}
                inputLabel={"License"}
                options={[{"text": "Coming soon!", "val": "coming_soon"}]}
              />
            </div>
          </div>
        </div>
        <div style={{width: "70%", minHeight: "80vh", display: "inline-block"}}>
          <TabPanel value={tabValue} index={0}>
            {repoData.length > 0 && <SummaryPanel data={repoData} field={filterValues["field_of_study"]}/>}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <div style={{marginTop: "5px", position: "sticky", top: "0", zIndex: 200, backgroundColor: "white",
                borderBottom: "1px solid rgba(0, 0, 0, 0.12)"}}>
              <div style={{display: "inline-block"}}>
                <Dropdown
                  selected={filterValues["order_by"]}
                  setSelected={(val) => handleSingleSelectChange(val, "order_by")}
                  inputLabel={"Order by"}
                  options={sortOptions}
                />
              </div>
              <div style={{display: "inline-block"}}>
                <Dropdown
                  selected={filterValues["compare_graph"]}
                  setSelected={(val) => handleSingleSelectChange(val, "compare_graph")}
                  inputLabel={"Compare"}
                  options={compareOptions}
                />
              </div>
            </div>
            {repoData.map(repo => (
              <RepoCard data={repo} metaMapping={sortMapping} field={filterValues["field_of_study"]}
                        graph_key={filterValues["compare_graph"]}
                        graph_title={compareMapping[filterValues["compare_graph"]]}/>
            ))}
          </TabPanel>
        </div>
      </div>
    </div>
  )
};

export default Dashboard;
