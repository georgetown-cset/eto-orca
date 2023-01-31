const sortMapping = {
  "stargazers_count": "Stars",
  "subscribers_count": "Watchers",
  "num_contributors": "Contributors",
  "created_at": "Created Date",
  "pushed_at": "Last Push Date",
  "open_issues": "Open Issues",
  "num_references": "References"
};

const metaMapping = {...sortMapping};
metaMapping["license"] = "License";
metaMapping["language"] = "Top Programming Language";

export {sortMapping, metaMapping};
