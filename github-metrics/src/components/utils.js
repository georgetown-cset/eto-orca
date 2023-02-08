/*
Miscellaneous utilities and shared functionality
 */
const sortMapping = {
  "stargazers_count": "Stars",
  "subscribers_count": "Watchers",
  "num_contributors": "Contributors",
  "created_at": "Created",
  "pushed_at": "Last Commit",
  "open_issues": "Open Issues",
  "num_references": "References"
};

const metaMapping = {...sortMapping};
metaMapping["license"] = "License";
metaMapping["language"] = "Top Programming Language";

const keyToTitle = {
  "star_dates": "Stars over time",
  "push_dates": "Commits over time",
  "issue_dates": "Issues over time",
  "commit_dates": "New vs returning contributors over time",
  "contrib_counts": "Contribution percentages by ranked contributor",
  "downloads": "PyPI downloads over time"
};

// returns data traces for country comparison graphs
const getCountryTraces = (graphData) => {
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
const getBarTraces = (key, data) => {
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

const getX = (ary) => {
  return ary.map(elt => elt[0])
};

const getY = (ary) => {
  return ary.map(elt => elt[1])
};

export {sortMapping, metaMapping, keyToTitle, getCountryTraces, getBarTraces, getX, getY};
