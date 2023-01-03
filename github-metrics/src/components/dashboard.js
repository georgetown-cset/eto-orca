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
import {id_to_repo, field_to_repos, fields, languages} from "../data/constants";

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

const Dashboard = () => {
  useEffect(() => {
    mkRepoData(defaultFilterValues);
  }, []);
  const defaultFilterValues = {
    "field_of_study": "Speech recognition",
    "order_by": "num_references",
    "compare_graph": "push_dates",
    "topic": "",
    "language": "All",
    "license": "All"
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
  languages.sort();
  const cleanLanguages = ["All"].concat(languages);
  const topicOptions = Object.entries(topicsMapping).map(e => ({"val": e[0], "text": e[1]}));
  const repoSortFn = (repo, filters) => {
    if(filters["order_by"] === "num_references"){
      return repo["num_references"][filters["field_of_study"]]
    }
    return repo[filters["order_by"]]
  };
  const mkRepoData = (filters) => {
    const relKeys = field_to_repos[filters["field_of_study"]];
    const newRepoData = [];
    for(let key of relKeys){
      const repo = id_to_repo[key];
      if((filters["language"] === "All") || (filters["language"] === repo["language"])){
        newRepoData.push(repo);
      }
    }
    relKeys.map(key => id_to_repo[key]);
    newRepoData.sort((a, b) => repoSortFn(b, filters) - repoSortFn(a, filters));
    setRepoData(newRepoData.slice(0, 20));
  };
  const [filterValues, setFilterValues] = React.useState({...defaultFilterValues});
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
          <Tab label="Project list" {...a11yProps(1)} />
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
                options={cleanLanguages.map(lang => ({"text": lang, "val": lang}))}
              />
            </div>
            <div style={{margin: "15px 0px 10px 20px"}}>
              <Dropdown
                selected={filterValues["license"]}
                setSelected={(val) => handleSingleSelectChange(val, "license")}
                inputLabel={"License"}
                options={[{"text": "All", "val": "All"}]}
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
              <RepoCard key={repoData["owner_name"]+"/"+repoData["current_name"]}
                        data={repo} metaMapping={sortMapping}
                        field={filterValues["field_of_study"]}
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
