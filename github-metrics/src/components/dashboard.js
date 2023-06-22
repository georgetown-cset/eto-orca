/*
The container component for the list view and summary view
 */
import React, {useEffect} from "react";
import {css} from "@emotion/react";
import Pagination from "@mui/material/Pagination";
import {styled} from "@mui/material/styles";
import { ButtonStyled, Dropdown } from "@eto/eto-ui-components";
import FilterAltIcon from "@mui/icons-material/FilterAlt";

import "core-js/features/url";
import "core-js/features/url-search-params";

import ProjectCard from "./project_card";
import Summary from "./summary";
import StyledSwitch from "./styled_switch";
import id_to_repo from "../data/id_to_repo";
import field_to_repos from "../data/field_to_repos";
import fields from "../data/fields";
import level0to1 from "../data/level0to1";
import {
  sortMapping,
  keyToTitle,
  getRepoName,
  customTopics,
  sortByKey,
  cleanFieldKey,
  cleanFieldName,
  FIELD_DELIMITER,
  FIELD_KEYS
} from "./utils";

const setFields = new Set(fields);

const narrowScreenThreshold = 800;

const styles = {
  topPanel: css`
    text-align: left;
    padding: 20px;
    display: block;
    vertical-align: top;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    background-color: var(--bright-blue-lightest);
    @media (min-width: ${narrowScreenThreshold}px){
      position: sticky;
      top: 0;
      z-index: 200;
    }
  `,
  bottomPanel: css`
    display: block;
    margin: 0px auto;
    max-width: 1300px;
  `,
  filterContainer: css`
    display: block;
    width: 100%;
    @media (min-width: ${narrowScreenThreshold}px){
      display: inline-block;
      width: 58%;
    }
  `,
  dropdownContainer: css`
    display: inline-block;
  `,
  switchContainer: css`
    display: inline-block;
    vertical-align: bottom;
    margin: 0 0 5px 5px;
  `,
  topicContainer: css`
    margin: 0 5px 5px 0;
  `,
  moreFilters: css`
    vertical-align: bottom;
    margin: 0px 5px 8px 5px;
  `,
  paginationContainer: css`
    margin: 10px auto 30px auto;
    display: flex;
    justify-content: center;
  `,
  filterIcon: css`
    height: 20px;
    vertical-align: bottom;
  `,
  filterDescriptionContainer: css`
    width: 100%;
    display: block;
    margin-top: 10px;
    text-align: left;
    @media (min-width: ${narrowScreenThreshold}px){
      display: inline-block;
      width: 40%;
      vertical-align: bottom;
      margin-top: 0px;
      text-align: right;
    }
  `,
  buttonContainer: css`
    display: inline-block;
    vertical-align: bottom;
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
    setShowList(urlParams.has(SHOW_LIST) && urlParams.get(SHOW_LIST));
    mkRepoData(updatedFilterValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaultFilterValues = {
    "field_of_study": `Computer science${FIELD_DELIMITER}Artificial intelligence`,
    "order_by": "relevance",
    "compare_graph": "push_dates",
    "language_group": "All",
    "license_group": "All"
  };

  const PAGE_SIZE = 10;
  const MORE_FILTERS = "more_filters";
  const SHOW_LIST = "show_list";

  const [filterValues, setFilterValues] = React.useState({...defaultFilterValues});
  const [repoData, setRepoData] = React.useState([]);
  const [moreFilters, setMoreFilters] = React.useState(false);
  const [showList, setShowList] = React.useState(false);
  const [currPage, setCurrPage] = React.useState(1);

  const toggleToState = {
    [MORE_FILTERS]: [moreFilters, setMoreFilters],
    [SHOW_LIST]: [showList, setShowList]
  };

  const contentContainer = React.createRef();

  const compareOptions = Object.entries(keyToTitle).map(e => ({"val": e[0], "text": e[1]}));

  const getSelectedRepos = (filters, ignoreFilter = null) => {
    const field = cleanFieldKey(filters["field_of_study"]);
    const relKeys = field_to_repos[field];
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

  const mkRepoData = (filters, currShowList=showList) => {
    let relevantFilters = filters;
    // if we're currently showing the summary, only filter by the field
    if(!currShowList){
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
    obj => (!isCuratedField(filterValues["field_of_study"]) || !FIELD_KEYS.includes(obj["val"])));

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
      if(FIELD_KEYS.includes(filterValues["order_by"]) && isCuratedField(value)){
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
    const level0Fields = [...Object.keys(level0to1)];
    level0Fields.sort();
    for(let level0 of level0Fields){
      options.push({"header": level0});
      const level1Fields = level0to1[level0];
      level1Fields.sort();
      for(let level1 of level1Fields){
        if(!isCuratedField(level1) && setFields.has(level1)){
          options.push({"text": level1, "val": `${level0}${FIELD_DELIMITER}${level1}`})
        }
      }
    }
    return options;
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
    if(name === SHOW_LIST){
      mkRepoData({...filterValues}, newState);
    }
  };

  const getFilterSummary = () => {
    const language = filterValues["language_group"];
    const license = filterValues["license_group"];
    const languageFiltered = language !== "All";
    const licenseFiltered = license !== "All";
    let suffix = (languageFiltered || licenseFiltered) ? " " : "";
    if(languageFiltered){
      let languageBlurb = `written in ${language}`;
      if(language.toLowerCase() === "other"){
        languageBlurb = "written in an uncommon programming language";
      }
      if(language.toLowerCase() === "no language detected"){
        languageBlurb = "where no programming language was successfully detected";
      }
      suffix += languageBlurb;
    }
    if(licenseFiltered){
      let licenseBlurb = `${languageFiltered ? " and" : "that are"} ${license} licensed`;
      if(license.toLowerCase() === "other"){
        licenseBlurb = " that have an uncommon license";
      }
      if(license.toLowerCase() === "no license detected"){
        licenseBlurb = ` where no license was successfully detected`;
      }
      suffix += licenseBlurb;
    }
    return (<div>
      <FilterAltIcon css={styles.filterIcon}/> Showing {repoData.length} repositories referenced in {cleanFieldName(filterValues["field_of_study"])} articles{suffix}.
    </div>)
  };

  return (
    <div style={{backgroundColor: "white"}} id={"dashboard"} ref={contentContainer}>
      <div>
        <div css={styles.topPanel}>
          <div css={styles.filterContainer}>
            <div>
              <div css={[styles.dropdownContainer, styles.topicContainer]}>
                <Dropdown
                  selected={filterValues["field_of_study"]}
                  setSelected={(val) => handleSingleSelectChange(val, "field_of_study")}
                  inputLabel={"Application Topic"}
                  options={getFOSOptions()}
                />
              </div>
              <div css={styles.switchContainer}>
                Summary <StyledSwitch checked={showList} onChange={() => updateToggle(SHOW_LIST)}/> List
              </div>
            </div>
            <div>
              {moreFilters && showList && <>
                <div css={styles.dropdownContainer}>
                  <Dropdown
                    selected={filterValues["language_group"]}
                    setSelected={(val) => handleSingleSelectChange(val, "language_group")}
                    inputLabel={"Filter by top programming language"}
                    options={getFilterOptions("language_group").map(lang => ({"text": lang, "val": lang}))}
                  />
                </div>
                <div css={styles.dropdownContainer}>
                  <Dropdown
                    selected={filterValues["license_group"]}
                    setSelected={(val) => handleSingleSelectChange(val, "license_group")}
                    inputLabel={"Filter by license"}
                    options={getFilterOptions("license_group").map(lang => ({"text": lang, "val": lang}))}
                  />
                </div>
              </>}
              {showList &&
              <div css={styles.buttonContainer}>
                <ButtonStyled css={styles.moreFilters} onClick={() => updateToggle(MORE_FILTERS)}>
                  {moreFilters ? "Hide" : "Show"} Detail Filters
                </ButtonStyled>
                <ButtonStyled css={styles.moreFilters} onClick={() => handleFilterUpdate({...defaultFilterValues})}>
                  Reset
                </ButtonStyled>
              </div>
              }
            </div>
            {showList &&
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
                  inputLabel={"Compare by"}
                  options={compareOptions}
                />
              </div>
            </div>
            }
          </div>
          {showList && <div css={styles.filterDescriptionContainer}>{getFilterSummary()}</div>}
        </div>
        <div css={styles.bottomPanel}>
          {(repoData.length > 0) && (
            !showList ?
              <Summary key={`summary-${filterValues["field_of_study"]}`} data={repoData}
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
