/*
Miscellaneous utilities and shared functionality
 */
export const sortMapping = {
  "stargazers_count": "Stars",
  "subscribers_count": "Watchers",
  "num_contributors": "Contributors",
  "created_at": "Date created",
  "pushed_at": "Last commit date",
  "open_issues": "Open issues",
  "num_references": "References in research",
  "relevance": "Relevance"
};

export const metaMapping = {...sortMapping};
metaMapping["license"] = "License";
metaMapping["language"] = "Top Programming Language";

export const keyToTitle = {
  "star_dates": "Stars over time",
  "push_dates": "Commits over time",
  "issue_dates": "Issues over time",
  "commit_dates": "New vs returning contributors over time",
  "contrib_counts": "Contribution percentages by ranked contributor",
  "downloads": "PyPI downloads over time"
};

export const customTopics = [
  {"val": "ai_safety", "text": "AI Safety"},
  {"val": "asr", "text": "Speech Recognition"},
  {"val": "riscv", "text": "RISC-V"}
];
const customTopicMap = {};
for(let topic of customTopics){
  customTopicMap[topic["val"]] = topic["text"];
}

export const FIELD_DELIMITER = "---";

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
  "contrib_counts": ["Num Contributions"]
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
    const cleanField = cleanFieldKey(field);
    sorted.sort((r1, r2) => r2[key][cleanField] - r1[key][cleanField]).filter(r => !r[key][cleanField]);
  } else if(["created_at", "pushed_at"].includes(key)){
    sorted.sort((r1, r2) => new Date(r2[key]) - new Date(r1[key]));
  } else {
    sorted.sort((r1, r2) => r2[key] - r1[key]);
  }
  return sorted;
};

export const cleanFieldName = (field) => {
  let clean = field;
  if(field in customTopicMap){
    clean = customTopicMap[field];
  }
  clean = clean.toLowerCase();
  for(let [patt, capitalized] of [[/(\b)ai(\b)/, "$1AI$2"], [/risc-v/, "RISC-V"]]){
    clean = clean.replace(patt, capitalized);
  }
  return cleanFieldKey(clean);
};

export const cleanFieldKey = (rawField) => {
  return rawField.includes(FIELD_DELIMITER) ? rawField.split(FIELD_DELIMITER)[1] : rawField;
};
