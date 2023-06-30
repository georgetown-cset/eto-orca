/*
Miscellaneous utilities and shared functionality
 */
import React from "react";
import {ExternalLink, HelpTooltip} from "@eto/eto-ui-components";

export const tooltips = {
  "relevance": "Relevance is a TIFIDF-based metric we use to rank repositories by their salience to the field, where terms are repository mentions and documents are fields - i.e. we calculate (number of articles mentioning a repository within a field) * log(number of total fields / (number of fields mentioning the repository + 1)).",
  "research_field": "Select a research field to view relevant repositories, as determined by human curation or by automatic assignment based on article field of study tags.",
  "mentions": "Selecting 'mentions' will order by the list by the number of mentions each repository received in the current research field. We say that an article mentions a repository if we find a mention of that repository in the article's title, abstract, or fulltext (where available), if the article is affiliated with the repository in Papers with Code, or if we find a link to the article's DOI in the repository's README, for articles that are part of The Stack.",
  "criticality": <span>An <ExternalLink href={"https://github.com/ossf/criticality_score"}>OpenSSF measure</ExternalLink> of the project's overall influence and importance. We currently do not adjust this metric for importance to a particular field.</span>,
  "field_references": "Number of mentions in articles that were automatically assigned to a field of study.",
  "number_of_mentions": <span>We <ExternalLink href={"https://aclanthology.org/2022.sdp-1.12/"}>automatically assign</ExternalLink> papers to research fields, then count the number of repository mentions within papers in that field.</span>
};

export const helpStyle = {height: "20px", verticalAlign: "middle"};
export const sortMapping = {
  "stargazers_count": "Stars",
  "subscribers_count": "Watchers",
  "criticality_score": "Criticality score",
  "num_contributors": "Contributors",
  "created_at": "Date created",
  "pushed_at": "Last commit date",
  "open_issues": "Open issues",
  "num_references": <span>Mentions in research<HelpTooltip iconStyle={helpStyle} text={tooltips.mentions}/></span>,
  "relevance": <span>Relevance<HelpTooltip iconStyle={helpStyle} text={tooltips.relevance}/></span>
};
export const sortMappingBlurb = {
  "stargazers_count": "Stars",
  "subscribers_count": "Watchers",
  "criticality_score": "Criticality score",
  "num_contributors": "Contributors",
  "created_at": "Date created",
  "pushed_at": "Last commit date",
  "open_issues": "Open issues"
};
sortMappingBlurb["num_references"] = "Mention in research";
sortMappingBlurb["relevance"] = "Relevance";

export const metaMapping = {...sortMapping};
metaMapping["license"] = "License";
metaMapping["language"] = "Top Programming Language";

export const keyToTitle = {
  "star_dates": "Stars over time",
  "push_dates": "Commits over time",
  "issue_dates": "Issues over time",
  "commit_dates": "New vs returning contributors over time",
  "contrib_counts": "Contribution rankings",
  "downloads": "PyPI downloads over time"
};

export const customTopics = [
  {"val": "ai_safety", "text": "AI Safety"},
  {"val": "riscv", "text": "RISC-V"}
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
    sorted.sort((r1, r2) => r2[key] - r1[key]);
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

export const sources = {
  "riscv": "CSET curation",
  "ai_safety": "CSET curation"
};
