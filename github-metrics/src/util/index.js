/*
Miscellaneous utilities and shared functionality
 */
import React from "react";
import {ExternalLink, HelpTooltip} from "@eto/eto-ui-components";

const tooltips = {
  "relevance": "Sort projects by how relevant they are to the selected research field, according to our scoring method.",
  "relevance_list": "An ETO-generated score for how relevant the project is to the selected research field.",
  "research_field": "Select a field to view related open-source software projects.",
  "mentions": "Sort projects by how often they mention or are mentioned by articles in the selected research field.",
  "criticality": "Sort projects by their OpenSSF criticality scores, which measure overall influence and importance in the OSS ecosystem.",
  "criticality_list": "OpenSSF criticality scores, which measure overall influence and importance in the OSS ecosystem.",
  "field_references": "Fields most often linked to this project. Based on mentions in articles from the field and references in project README files.",
  "number_of_mentions": "Each of the listed repositories is associated with at least one #SUBJECT article in ORCA's dataset."
};

const tooltipLinks = {
  "relevance": "https://eto.tech/tool-docs/orca/#relevance-to-different-research-fields",
  "relevance_list": "https://eto.tech/tool-docs/orca/#relevance-to-different-research-fields",
  "mentions": "https://eto.tech/tool-docs/orca/#detecting-links-to-oss-projects",
  "criticality": "https://eto.tech/tool-docs/orca/#openssf-criticality-scores",
  "criticality_list": "https://eto.tech/tool-docs/orca/#openssf-criticality-scores",
  "field_references": "https://eto.tech/tool-docs/orca/#the-automated-process",
  "number_of_mentions": "https://eto.tech/tool-docs/orca/#detecting-links-to-oss-projects"
};

export const getTooltip = (key, replFrom=null, replTo=null) => {
  let ttText = tooltips[key];
  if(replFrom !== null){
    ttText = ttText.replace(replFrom, replTo);
  }
  return <span>{ttText}{key in tooltipLinks && <span> <ExternalLink href={tooltipLinks[key]}>Read more &gt;&gt;</ExternalLink></span>}</span>;
};

export const helpStyle = {verticalAlign: "middle", marginBottom: "2px"};
export const sortMapping = {
  "stargazers_count": "Stars",
  "subscribers_count": "Watchers",
  "criticality_score": <span>Criticality score<HelpTooltip iconStyle={helpStyle} text={getTooltip("criticality")}/></span>,
  "num_contributors": "Contributors",
  "created_at": "Date created",
  "pushed_at": "Last commit date",
  "open_issues": "Open issues and PRs",
  "num_references": <span>Mentions in research<HelpTooltip iconStyle={helpStyle} text={getTooltip("mentions")}/></span>,
  "relevance": <span>Relevance<HelpTooltip iconStyle={helpStyle} text={getTooltip("relevance")}/></span>
};
export const sortMappingBlurb = {
  "stargazers_count": "Stars",
  "subscribers_count": "Watchers",
  "criticality_score": "Criticality score",
  "num_contributors": "Contributors",
  "created_at": "Date created",
  "pushed_at": "Last commit date",
  "open_issues": "Open issues and PRs"
};
sortMappingBlurb["num_references"] = "Mentions in research";
sortMappingBlurb["relevance"] = "Relevance";
sortMappingBlurb["criticality_score"] = "Criticality score";

export const metaMapping = {...sortMapping};
metaMapping["license"] = "License";
metaMapping["language"] = "Top Programming Language";
metaMapping["criticality_score"] = <span>Criticality score<HelpTooltip iconStyle={helpStyle} text={getTooltip("criticality_list")}/></span>;

export const keyToTitle = {
  "star_dates": "Stars over time",
  "push_dates": "Commits over time",
  "issue_dates": "Issues and pull requests over time",
  "commit_dates": "New vs returning contributors over time",
  "contrib_counts": "Contributor distribution",
  "downloads": "PyPI downloads over time/by country"
};

export const customTopics = [
  {"val": "ai_safety", "text": "AI Safety"},
  {"val": "riscv", "text": "RISC-V"},
  {"val": "weto", "text": "Wind Energy Technology Office software"},
  {"val": "Emissions", "text": "Emissions"},
  {"val": "Earth Systems", "text": "Earth systems"},
  {"val": "Energy Storage", "text": "Energy storage"},
  {"val": "Sustainable Development", "text": "Sustainable development"},
  {"val": "Climate and Earth Science", "text": "Climate and earth science"},
  {"val": "Industrial Ecology", "text": "Industrial ecology"},
  {"val": "Renewable Energy", "text": "Renewable energy"},
  {"val": "Natural Resources", "text": "Natural resources"},
  {"val": "Consumption of Energy and Resources", "text": "Energy and resource consumption"},
  {"val": "Energy Systems", "text": "Energy systems"}
];
const customTopicMap = {};
for(let topic of customTopics){
  customTopicMap[topic["val"]] = topic["text"];
}

export const FIELD_KEYS = ["num_references", "relevance"];

// returns data traces for country comparison graphs
export const getCountryTraces = (graphData) => {
  const nameToYearToCounts = {};
  const countryCounts = {};
  for(let elt of graphData){
    const [year, country, count] = elt;
    if(!(country in countryCounts)){
      countryCounts[country] = 0
    }
    countryCounts[country] += parseInt(count);
    if(!(country in nameToYearToCounts)){
      nameToYearToCounts[country] = {};
    }
    nameToYearToCounts[country][year] = count;
  }
  const topCountries = [...Object.keys(countryCounts)];
  topCountries.sort((a, b) => countryCounts[b] - countryCounts[a]);
  const traces = [];
  for(let name of topCountries.slice(0, 5)){
    const years = [...Object.keys(nameToYearToCounts[name])];
    years.sort();
    traces.push({
      x: years,
      y: years.map(y => nameToYearToCounts[name][y]),
      name: name
    })
  }
  return traces;
};

const barTraceNames = {
  "issue_dates": ["Opened", "Closed"],
  "commit_dates": ["New", "Returning"],
  "contrib_counts": ["Num Contributions"],
  "push_dates": ["Num Commits"],
  "star_dates": ["Num Stars"]
};

// returns bar graph traces
export const getBarTraces = (key, data) => {
  const barData = data[key];
  const traceData = [];
  const yTrans = y => key !== "contrib_counts" ? y : 100*y/data["num_commits"];
  if(barData.length === 0){
    return [];
  }
  for(let i = 0; i < barData[0].length - 1; i ++){
    traceData.push({
      x: barData.map(elt => elt[0]),
      y: barData.map(elt => yTrans(elt[i+1])),
      name: barTraceNames[key][i]
    })
  }
  return traceData;
};

export const getX = (ary) => {
  return ary.map(elt => elt[0])
};

export const getY = (ary) => {
  return ary.map(elt => elt[1])
};

export const getRepoName = (row) => {
  return row["owner_name"]+"/"+row["current_name"];
};

export const sortByKey = (toSort, key, field=null) => {
  const sorted = [...toSort];
  if(FIELD_KEYS.includes(key)){
    sorted.sort((r1, r2) => r2[key][field] - r1[key][field]).filter(r => !r[key][field]);
  } else if(["created_at", "pushed_at"].includes(key)){
    sorted.sort((r1, r2) => new Date(r2[key]) - new Date(r1[key]));
  } else {
    sorted.sort((r1, r2) => (key in r2 ? r2[key] : 0) - (key in r1 ? r1[key] : 0));
  }
  return sorted;
};

export const cleanFieldName = (field) => {
  if(field === null){
    return null;
  }
  let clean = field;
  if(field in customTopicMap){
    clean = customTopicMap[field];
  }
  clean = clean.toLowerCase();
  for(let [patt, capitalized] of [[/(\b)ai(\b)/, "$1AI$2"], [/risc-v/, "RISC-V"]]){
    clean = clean.replace(patt, capitalized);
  }
  return clean;
};

const ostLink = <ExternalLink href={"https://github.com/protontypes/open-sustainable-technology"}>Open Sustainable Technology</ExternalLink>;
const wetoLink = <ExternalLink href={"http://www.rafmudaf.com/WETOStack/software_list.html#weto-software"}>WETOStack</ExternalLink>;

export const sources = {
  "riscv": "CSET curation",
  "ai_safety": "CSET curation",
  "weto": wetoLink,
  "Emissions": ostLink,
  "Earth Systems": ostLink,
  "Energy Storage": ostLink,
  "Sustainable Development": ostLink,
  "Climate and Earth Science": ostLink,
  "Industrial Ecology": ostLink,
  "Renewable Energy": <span>{ostLink} and {wetoLink}</span>,
  "Natural Resources": ostLink,
  "Consumption of Energy and Resources": ostLink,
  "Energy Systems": ostLink
};
