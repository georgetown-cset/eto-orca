import React, {useEffect} from "react";
import {css} from "@emotion/react";
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
import {id_to_repo, field_to_repos, fields} from "../data/constants";
import {sortMapping, keyToTitle} from "./utils";

const styles = {
  tabContainer: css`
    background-color: white;
    border-color: divider;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12)
  `,
  leftPanel: css`
    text-align: left;
    padding: 20px;
    width: 25%;
    display: inline-block;
    vertical-align: top;
    @media (max-width: 1300px) {
      width: 100%;
      display: block;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
  `,
  rightPanel: css`
    width: 70%;
    min-height: 80vh;
    display: inline-block;
    @media (max-width: 1300px) {
      width: 95%;
      margin: auto;
      display: block;
    }
  `,
  filterDropdownContainer: css`
    margin: 15px 0px 10px 20px;
  `,
  sortDropdownContainer: css`
    display: inline-block;
  `,
  sortConfig: css`
    margin-top: 5px;
    position: sticky;
    top: 0;
    z-index: 200;
    background-color: white;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12)
  `
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

const Dashboard = () => {
  useEffect(() => {
    mkRepoData(defaultFilterValues);
  }, []);

  const defaultFilterValues = {
    "field_of_study": "ai_safety",
    "order_by": "stargazers_count",
    "compare_graph": "push_dates",
    "language": "All",
    "license": "All"
  };

  const [filterValues, setFilterValues] = React.useState({...defaultFilterValues});
  const [repoData, setRepoData] = React.useState([]);
  const [tabValue, setTabValue] = React.useState(1);

  const compareOptions = Object.entries(keyToTitle).map(e => ({"val": e[0], "text": e[1]}));

  const customTopics = [
    {"val": "ai_safety", "text": "AI Safety"},
    {"val": "asr", "text": "Speech Recognition (curated)"},
    {"val": "riscv", "text": "RISC-V"}
  ];

  const getSelectedRepos = (filters, ignoreFilter = null) => {
    const relKeys = field_to_repos[filters["field_of_study"]];
    const newRepoData = [];
    for(let key of relKeys){
      const repo = id_to_repo[key];
      repo["id"] = key;
      let addRepo = true;
      for(let filt of ["language", "license"]){
        if(!((filt === ignoreFilter) || (filters[filt] === "All") || (filters[filt] === repo[filt]))){
          addRepo = false;
        }
      }
      if(addRepo){
        newRepoData.push(repo);
      }
    }
    relKeys.map(key => id_to_repo[key]);
    return newRepoData;
  };

  const getFilterOptions = (key) => {
    const fieldRepos = getSelectedRepos(filterValues, key);
    const opts = [...new Set(fieldRepos.map(row => row[key]))];
    opts.sort();
    return ["All"].concat(opts);
  };

  const repoSortFn = (repo, filters) => {
    if(filters["order_by"] === "num_references"){
      return repo["num_references"][filters["field_of_study"]]
    }
    return repo[filters["order_by"]]
  };

  const mkRepoData = (filters) => {
    const newRepoData = getSelectedRepos(filters);
    newRepoData.sort((a, b) => repoSortFn(b, filters) - repoSortFn(a, filters));
    setRepoData(newRepoData.slice(0, 20));
  };

  const isCuratedField = (field) => {
    return customTopics.map(topic => topic["val"]).includes(field);
  };

  const sortOptions = Object.entries(sortMapping).map(e => ({"val": e[0], "text": e[1]})).filter(
    obj => (!isCuratedField(filterValues["field_of_study"]) || (obj["val"] !== "num_references")));

  const handleSingleSelectChange = (value, key) => {
    const updatedFilterValues = {...filterValues};
    updatedFilterValues[key] = value;
    if(key === "field_of_study"){
      if(filterValues["order_by"] === "num_references"){
        updatedFilterValues["order_by"] = "stargazers_count";
      }
      for(let filteredKey of ["language", "license"]){
        updatedFilterValues[filteredKey] = "All";
      }
    }
    setFilterValues(updatedFilterValues);
    mkRepoData(updatedFilterValues);
  };

  const getFOSOptions = () => {
    const options = [{"header": "Curated Fields"}].concat(customTopics);
    options.push({"header": "Automated Field Detection"});
    const autoFields = fields.filter(f => !isCuratedField(f)).sort().map(f => ({"text": f, "val": f}));
    return options.concat(autoFields);
  };

  return (
    <div style={{backgroundColor: "white"}} id={"dashboard"}>
      <div css={styles.tabContainer}>
        <StyledTabs value={tabValue} onChange={(evt, newValue) => {setTabValue(newValue)}} aria-label="OSS tracker tabs">
          <Tab label="Field summary" {...a11yProps(0)} />
          <Tab label="Project list" {...a11yProps(1)} />
        </StyledTabs>
      </div>
      <div>
        <div css={styles.leftPanel}>
          <div>
            <h3>Select a subject</h3>
            <div css={styles.filterDropdownContainer}>
              <Dropdown
                selected={filterValues["field_of_study"]}
                setSelected={(val) => handleSingleSelectChange(val, "field_of_study")}
                inputLabel={"Field of study"}
                options={getFOSOptions()}
              />
            </div>
          </div>
          <div>
            <h3>Filter further</h3>
            <div css={styles.filterDropdownContainer}>
              <Dropdown
                selected={filterValues["language"]}
                setSelected={(val) => handleSingleSelectChange(val, "language")}
                inputLabel={"Top programming language"}
                options={getFilterOptions("language").map(lang => ({"text": lang, "val": lang}))}
              />
            </div>
            <div css={styles.filterDropdownContainer}>
              <Dropdown
                selected={filterValues["license"]}
                setSelected={(val) => handleSingleSelectChange(val, "license")}
                inputLabel={"License"}
                options={getFilterOptions("license").map(lang => ({"text": lang, "val": lang}))}
              />
            </div>
          </div>
        </div>
        <div css={styles.rightPanel}>
          <TabPanel value={tabValue} index={0}>
            {repoData.length > 0 && <SummaryPanel data={repoData}
                                                  sortOptions={sortOptions} customTopics={customTopics}/>}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <div css={styles.sortConfig}>
              <div css={styles.sortDropdownContainer}>
                <Dropdown
                  selected={filterValues["order_by"]}
                  setSelected={(val) => handleSingleSelectChange(val, "order_by")}
                  inputLabel={"Order by"}
                  options={sortOptions}
                />
              </div>
              <div css={styles.sortDropdownContainer}>
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
                        data={repo}
                        field={filterValues["field_of_study"]}
                        graph_key={filterValues["compare_graph"]}
                        graph_title={keyToTitle[filterValues["compare_graph"]]}
                        isCurated={isCuratedField(filterValues["field_of_study"])}/>
            ))}
          </TabPanel>
        </div>
      </div>
    </div>
  )
};

export default Dashboard;
