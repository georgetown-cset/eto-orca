/*
The container component for the list view and summary view
 */
import React, {useEffect} from "react";
import {css} from "@emotion/react";
import Pagination from "@mui/material/Pagination";
import {styled} from "@mui/material/styles";
import { Autocomplete, ButtonStyled, Dropdown, ExternalLink, HelpTooltip, breakpoints } from "@eto/eto-ui-components";
import FilterAltIcon from "@mui/icons-material/FilterAlt";

import "core-js/features/url";
import "core-js/features/url-search-params";

import ProjectCard from "./project_card";
import Summary from "./summary";
import StyledSwitch from "./styled_switch";
import id_to_repo from "../data/id_to_repo";
import field_to_repos from "../data/field_to_repos";
import fields from "../data/fields";
import {
  sortMapping,
  keyToTitle,
  getRepoName,
  customTopics,
  sortByKey,
  cleanFieldName,
  FIELD_KEYS,
  sources,
  getTooltip
} from "../util";

const setFields = new Set(fields);

const styles = {
  topPanel: css`
    text-align: left;
    padding: 20px;
    display: block;
    vertical-align: top;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    background-color: var(--bright-blue-lightest);
    ${breakpoints.tablet_small} {
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
    ${breakpoints.tablet_small} {
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
    margin: 0 15px 5px 5px;
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
    vertical-align: middle;
  `,
  filterDescriptionContainer: css`
    width: 100%;
    display: block;
    margin-top: 10px;
    ${breakpoints.tablet_small} {
      display: inline-block;
      width: 40%;
      vertical-align: bottom;
      margin-top: 0px;
    }
  `,
  filterDescription: css`
    ${breakpoints.tablet_small} {
      float: right;
    }
  `,
  buttonContainer: css`
    display: inline-block;
    vertical-align: bottom;
  `,
  nowrap: css`
    white-space: nowrap;
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
      if (urlParams.has(key) && (urlParams.get(key) !== null) && (urlParams.get(key) !== "null")) {
        updatedFilterValues[key] = urlParams.get(key)
      }
    }
    setFilterValues(updatedFilterValues);
    if (window.plausible) {
      window.plausible("Set filters", {props: {
        "filters": JSON.stringify(updatedFilterValues)
      }});
    }
    setMoreFilters(urlParams.has(MORE_FILTERS) && urlParams.get(MORE_FILTERS));
    const urlShowList = urlParams.has(SHOW_LIST) && (urlParams.get(SHOW_LIST).toLowerCase() === "true");
    setShowList(urlShowList);
    mkRepoData(updatedFilterValues, urlShowList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaultFilterValues = {
    "field_of_study": `Artificial intelligence`,
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

  const compareOptions = Object.entries(keyToTitle).filter(e => e[0] !== "downloads").map(e => ({"val": e[0], "text": e[1]}));

  const getSelectedRepos = (filters, ignoreFilter = null) => {
    const field = filters["field_of_study"];
    if(field === null){
      return [];
    }
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
    if (window.plausible) {
      window.plausible("Set filters", {props: {
        "filters": JSON.stringify(updated)
      }});
    }
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
    const options = [...customTopics.filter(t => t.val !== "weto")];
    for(let field of fields){
      if(!isCuratedField(field) && setFields.has(field)){
        options.push({"text": field, "val": field})
      }
    }
    options.sort((a, b) => a.text.localeCompare(b.text));
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
    if (window.plausible) {
      window.plausible("Toggle updated", {props: {
        "toggle": name,
        "value": newState
      }});
    }
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
    const cleanField = cleanFieldName(filterValues["field_of_study"]);
    return (
      <div css={styles.filterDescription}>
        <FilterAltIcon css={styles.filterIcon}/> Showing {repoData.length} repositories {
        isCuratedField(filterValues["field_of_study"]) ? <span>related to {cleanField}{suffix}.<HelpTooltip text={<span>This list is based on {sources[filterValues["field_of_study"]]}. <ExternalLink href={'https://eto.tech/tool-docs/orca/#manually-compiled-fields'}>Read more &gt;&gt;</ExternalLink></span>}/></span> :
          <span>mentioned in {cleanField} articles in our dataset{suffix}<span css={styles.nowrap}>.<HelpTooltip text={getTooltip("number_of_mentions", "#SUBJECT", cleanField)}/></span></span>
          }
      </div>
    )
  };

  return (
    <div style={{backgroundColor: "white"}} id={"dashboard"} ref={contentContainer}>
      <div>
        <div css={styles.topPanel} data-testid="top-panel">
          <div css={styles.filterContainer}>
            <div>
              <div css={[styles.dropdownContainer, styles.topicContainer]} data-testid="research-field-wrapper">
                <Autocomplete
                  selected={filterValues["field_of_study"]}
                  setSelected={(val) => handleSingleSelectChange(val, "field_of_study")}
                  id={"research-field"}
                  inputLabel={<div>Research field<HelpTooltip text={getTooltip("research_field")}/></div>}
                  options={getFOSOptions()}
                />
              </div>
              <div css={styles.switchContainer}>
                Summary <StyledSwitch checked={showList} onChange={() => updateToggle(SHOW_LIST)}/> List
              </div>
              {showList &&
              <div css={styles.buttonContainer}>
                <ButtonStyled css={styles.moreFilters} onClick={() => updateToggle(MORE_FILTERS)}>
                  {moreFilters ? "Hide" : "Show"} Filters
                </ButtonStyled>
                <ButtonStyled css={styles.moreFilters} onClick={() => handleFilterUpdate({...defaultFilterValues})}>
                  Reset
                </ButtonStyled>
              </div>
              }
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
            </div>
            {showList &&
            <div>
              <div css={styles.dropdownContainer}>
                <Dropdown
                  selected={filterValues["order_by"]}
                  setSelected={(val) => handleSingleSelectChange(val, "order_by")}
                  inputLabel={"Sort by"}
                  options={sortOptions}
                />
              </div>
              <div css={styles.dropdownContainer}>
                <Dropdown
                  selected={filterValues["compare_graph"]}
                  setSelected={(val) => handleSingleSelectChange(val, "compare_graph")}
                  inputLabel={"Show graphs for"}
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
              <Summary
                data={repoData}
                field={filterValues["field_of_study"]}
                isCurated={isCuratedField(filterValues["field_of_study"])}
                key={`summary-${filterValues["field_of_study"]}`}
                sortOptions={sortOptions}
              />
            :
              <div>
                {repoData.slice((currPage-1)*PAGE_SIZE, currPage*PAGE_SIZE).map(repo => (
                  <ProjectCard
                    data={repo}
                    field={filterValues["field_of_study"]}
                    graph_key={filterValues["compare_graph"]}
                    graph_title={keyToTitle[filterValues["compare_graph"]]}
                    isCurated={isCuratedField(filterValues["field_of_study"])}
                    key={getRepoName(repo)}
                  />
                ))}
                <div css={styles.paginationContainer}>
                  <StyledPagination
                    count={Math.ceil(repoData.length/PAGE_SIZE)}
                    onChange={(_, page) => {
                      setCurrPage(page);
                      contentContainer.current.scrollIntoView();
                    }}
                    page={currPage}
                  />
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  )
};

export default Dashboard;
