/*
The container component for the list view and summary view
 */
import React, {useEffect} from "react";
import {css} from "@emotion/react";
import Pagination from "@mui/material/Pagination";
import {styled} from "@mui/material/styles";
import { ButtonStyled, Dropdown } from "@eto/eto-ui-components";

import "core-js/features/url";
import "core-js/features/url-search-params";

import ProjectCard from "./project_card";
import Summary from "./summary";
import StyledSwitch from "./styled_switch";
import id_to_repo from "../data/id_to_repo";
import field_to_repos from "../data/field_to_repos";
import fields from "../data/fields";
import {sortMapping, keyToTitle, getRepoName, customTopics, sortByKey} from "./utils";

const styles = {
  topPanel: css`
    text-align: left;
    padding: 20px;
    display: block;
    vertical-align: top;
    position: sticky;
    top: 0;
    z-index: 200;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    background-color: var(--bright-blue-lightest);
  `,
  bottomPanel: css`
    display: block;
    margin: 0px auto;
    max-width: 1300px;
  `,
  dropdownContainer: css`
    display: inline-block;
  `,
  moreFilters: css`
    vertical-align: bottom;
    margin: 0px 5px 8px 5px;
  `,
  switchContainer: css`
    float: right;
  `,
  paginationContainer: css`
    margin: 10px auto 30px auto;
    display: flex;
    justify-content: center;
  `
};

const StyledPagination = styled(Pagination)(({ theme }) => ({
  "button": {
    fontFamily: "GTZirkonLight, sans-serif"
  }
}));

const Dashboard = () => {
  useEffect(() => {
    const updatedFilterValues = {...defaultFilterValues};
    const urlParams = new URLSearchParams(window.location.search);
    for(let key in defaultFilterValues){
      if (urlParams.has(key) && urlParams.get(key) !== null) {
        updatedFilterValues[key] = urlParams.get(key)
      }
    }
    setFilterValues(updatedFilterValues);
    setMoreFilters(urlParams.has(MORE_FILTERS) && urlParams.get(MORE_FILTERS));
    setShowSummary(urlParams.has(SHOW_SUMMARY) && urlParams.get(SHOW_SUMMARY));
    mkRepoData(updatedFilterValues);
  }, []);

  const defaultFilterValues = {
    "field_of_study": "ai_safety",
    "order_by": "stargazers_count",
    "compare_graph": "push_dates",
    "language_group": "All",
    "license_group": "All"
  };

  const PAGE_SIZE = 10;
  const MORE_FILTERS = "more_filters";
  const SHOW_SUMMARY = "show_summary";

  const [filterValues, setFilterValues] = React.useState({...defaultFilterValues});
  const [repoData, setRepoData] = React.useState([]);
  const [moreFilters, setMoreFilters] = React.useState(false);
  const [showSummary, setShowSummary] = React.useState(false);
  const [currPage, setCurrPage] = React.useState(1);

  const toggleToState = {
    [MORE_FILTERS]: [moreFilters, setMoreFilters],
    [SHOW_SUMMARY]: [showSummary, setShowSummary]
  };

  const contentContainer = React.createRef();

  const compareOptions = Object.entries(keyToTitle).map(e => ({"val": e[0], "text": e[1]}));

  const getSelectedRepos = (filters, ignoreFilter = null) => {
    const relKeys = field_to_repos[filters["field_of_study"]];
    const newRepoData = [];
    for(let key of relKeys){
      const repo = id_to_repo[key];
      repo["id"] = key;
      let addRepo = true;
      for(let filt of ["language_group", "license_group"]){
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

  const mkRepoData = (filters, currShowSummary=showSummary) => {
    let relevantFilters = filters;
    // if we're currently showing the summary, only filter by the field
    if(currShowSummary){
      relevantFilters = {...defaultFilterValues};
      relevantFilters["field_of_study"] = filters["field_of_study"]
    }
    let newRepoData = getSelectedRepos(relevantFilters);
    newRepoData = sortByKey(newRepoData, relevantFilters["order_by"], relevantFilters["field_of_study"]);
    setRepoData(newRepoData);
  };

  const isCuratedField = (field) => {
    return customTopics.map(topic => topic["val"]).includes(field);
  };

  const sortOptions = Object.entries(sortMapping).map(e => ({"val": e[0], "text": e[1]})).filter(
    obj => (!isCuratedField(filterValues["field_of_study"]) || (obj["val"] !== "num_references")));

  const handleFilterUpdate = (updated) => {
    setFilterValues(updated);
    mkRepoData(updated);
    setCurrPage(1);
    contentContainer.current.scrollIntoView();
    const urlParams = new URLSearchParams(window.location.search);
    for(let key in updated){
      if(updated[key] !== defaultFilterValues[key]) {
        urlParams.set(key, updated[key]);
      } else {
        urlParams.delete(key);
      }
    }
    const params = urlParams.toString().length > 0 ? "?" + urlParams.toString() : "";
    window.history.replaceState(null, null, window.location.pathname + params);
  };

  const handleSingleSelectChange = (value, key) => {
    const updatedFilterValues = {...filterValues};
    updatedFilterValues[key] = value;
    if(key === "field_of_study"){
      if((filterValues["order_by"] === "num_references") && isCuratedField(value)){
        updatedFilterValues["order_by"] = "stargazers_count";
      }
      for(let filteredKey of ["language_group", "license_group"]){
        updatedFilterValues[filteredKey] = "All";
      }
    }
    handleFilterUpdate(updatedFilterValues);
  };

  const getFOSOptions = () => {
    const options = [{"header": <span>Display projects <em>related to</em></span>}].concat(customTopics);
    options.push({"header": <span>Display projects <em>used for research into</em></span>});
    const autoFields = fields.filter(f => !isCuratedField(f)).sort().map(f => ({"text": f, "val": f}));
    return options.concat(autoFields);
  };

  const updateToggle = (name) => {
    const [state, setter] = toggleToState[name];
    const urlParams = new URLSearchParams(window.location.search);
    const newState = !state;
    if(newState) {
      urlParams.set(name, newState)
    } else {
      urlParams.delete(name);
    }
    const params = urlParams.toString().length > 0 ? "?" + urlParams.toString() : "";
    window.history.replaceState(null, null, window.location.pathname + params);
    setter(newState);
    if(name === SHOW_SUMMARY){
      mkRepoData({...filterValues}, newState);
    }
  };

  return (
    <div style={{backgroundColor: "white"}} id={"dashboard"} ref={contentContainer}>
      <div>
        <div css={styles.topPanel}>
          <div css={styles.switchContainer}>
            List <StyledSwitch checked={showSummary} onChange={() => updateToggle(SHOW_SUMMARY)}/> Comparison
          </div>
          <div>
            <div css={styles.dropdownContainer}>
              <Dropdown
                selected={filterValues["field_of_study"]}
                setSelected={(val) => handleSingleSelectChange(val, "field_of_study")}
                inputLabel={"Application Topic"}
                options={getFOSOptions()}
              />
            </div>
            {moreFilters && !showSummary && <>
              <div css={styles.dropdownContainer}>
                <Dropdown
                  selected={filterValues["language_group"]}
                  setSelected={(val) => handleSingleSelectChange(val, "language_group")}
                  inputLabel={"Top programming language"}
                  options={getFilterOptions("language_group").map(lang => ({"text": lang, "val": lang}))}
                />
              </div>
              <div css={styles.dropdownContainer}>
                <Dropdown
                  selected={filterValues["license_group"]}
                  setSelected={(val) => handleSingleSelectChange(val, "license_group")}
                  inputLabel={"License"}
                  options={getFilterOptions("license_group").map(lang => ({"text": lang, "val": lang}))}
                />
              </div>
            </>}
            {!showSummary &&
            <>
              <ButtonStyled css={styles.moreFilters} onClick={() => updateToggle(MORE_FILTERS)}>
                {moreFilters ? "Hide" : "Show"} Detail Filters
              </ButtonStyled>
              <ButtonStyled css={styles.moreFilters} onClick={() => handleFilterUpdate({...defaultFilterValues})}>
                Reset
              </ButtonStyled>
            </>
            }
          </div>
          {!showSummary &&
          <div>
            <div css={styles.dropdownContainer}>
              <Dropdown
                selected={filterValues["order_by"]}
                setSelected={(val) => handleSingleSelectChange(val, "order_by")}
                inputLabel={"Order by"}
                options={sortOptions}
              />
            </div>
            <div css={styles.dropdownContainer}>
              <Dropdown
                selected={filterValues["compare_graph"]}
                setSelected={(val) => handleSingleSelectChange(val, "compare_graph")}
                inputLabel={"Compare"}
                options={compareOptions}
              />
            </div>
          </div>
          }
        </div>
        <div css={styles.bottomPanel}>
          {(repoData.length > 0) && (
            showSummary ?
              <Summary data={repoData}
                            field={filterValues["field_of_study"]}
                            isCurated={isCuratedField(filterValues["field_of_study"])}
                            sortOptions={sortOptions}/> :
            <div>
              {repoData.slice((currPage-1)*PAGE_SIZE, currPage*PAGE_SIZE).map(repo => (
                <ProjectCard key={getRepoName(repoData)}
                             data={repo}
                             field={filterValues["field_of_study"]}
                             graph_key={filterValues["compare_graph"]}
                             graph_title={keyToTitle[filterValues["compare_graph"]]}
                             isCurated={isCuratedField(filterValues["field_of_study"])}/>
              ))}
              <div>
              <div css={styles.paginationContainer}>
                <StyledPagination page={currPage}
                                  onChange={(_, page) => {setCurrPage(page);contentContainer.current.scrollIntoView()}}
                                  count={Math.ceil(repoData.length/PAGE_SIZE)}/>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
};

export default Dashboard;
