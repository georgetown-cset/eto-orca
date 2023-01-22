import React, {useEffect} from "react";

import "core-js/features/url";
import "core-js/features/url-search-params";

import {id_to_repo} from "../data/constants";
import {ExternalLink} from "@eto/eto-ui-components";
import {css} from "@emotion/react";
import {BarGraph, LineGraph} from "./graph";
import ProjectMetadata from "./project_metadata";

const ProjectDashboard = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get("project_id") !== null){
      const project_id = urlParams.get("project_id");
      setProject(project_id);
      setData(id_to_repo[project_id]);
    }
  }, []);

  const [project, setProject] = React.useState();
  const [data, setData] = React.useState({});
  const repo_name = data["owner_name"]+"/"+data["current_name"];

  const getX = (ary) => {
    return ary.map(elt => elt[0])
  };

  const getY = (ary) => {
    return ary.map(elt => elt[1])
  };

  const getBarTraces = (key) => {
    const barData = data[key];
    const traceData = [];
    const yTrans = y => key !== "contrib_counts" ? y : 100*y/data["num_prs"];
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
  const barTraceNames = {
    "issue_dates": ["Opened", "Closed"],
    "pr_dates": ["New", "Returning"],
    "contrib_counts": ["Num Contributions"]
  };
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

  const keyToTitle = {
    "star_dates": "Stars over time",
    "push_dates": "Push events over time",
    "issue_dates": "Issues over time",
    "pr_dates": "New vs returning contributors over time",
    "contrib_counts": "Contribution percentage counts",
    "country_contributions": "Code contributions by top five countries (incomplete data)",
    "org_contributions": "Code contributions by top five contributor organizations (incomplete data)"
  };

  const contribGraphs = [
    ["push_dates", "line"],
    ["issue_dates", "bar"],
    ["pr_dates", "bar"],
    ["contrib_counts", "bar"],
    ["country_contributions", "multi-line"],
    ["org_contributions", "multi-line"]
  ];
  const userGraphs = [
    ["star_dates", "line"]
  ];

  const getContributorGraph = (meta) => {
    if(meta[1] === "bar"){
      return <BarGraph traces={getBarTraces(meta[0])} title={keyToTitle[meta[0]]} height={"250px"}
                                        normalizeTime={meta[0] !== "contrib_counts"}/>
    } else if(meta[1] === "line") {
      return <LineGraph traces={[{x: getX(data[meta[0]]), y: getY(data[meta[0]])}]}
                 title={keyToTitle[meta[0]]} height={"250px"} />
    }
    return <LineGraph traces={getCountryTraces(data[meta[0]])} title={keyToTitle[meta[0]]} height={"250px"}
                      showLegend={true}/>;
  };

  return (
   <div style={{margin: "20px auto", maxWidth: "1000px"}} id={"project-dashboard"}>
     <div style={{textAlign: "right"}}>
      <a href={"/"}>Back to summary page</a>
     </div>
     <div>
       <h2 style={{display: "inline-block", marginRight: "10px"}}>
         <ExternalLink href={"https://github.com/"+repo_name}>{repo_name}</ExternalLink>
       </h2>
        {data["has_deps_dev"] &&
        <span style={{display: "inline-block", fontSize: "80%"}}>
          <ExternalLink href={"https://deps.dev/project/github/" + data["owner_name"] + "%2F" + data["current_name"]}>
            [deps.dev]
          </ExternalLink>
        </span>
        }
       <div>
         <div style={{display: "inline-block", width: "50%", verticalAlign: "top"}}>
           <div>
             {data["description"]}
           </div>
         </div>
         <div style={{display: "inline-block", width: "50%"}}>
          <ProjectMetadata data={data}/>
         </div>
       </div>
     </div>
     <div>
       <h3>Contributor activity</h3>
       {Object.keys(data).length > 0 && contribGraphs.map(meta =>
         getContributorGraph(meta)
       )}
     </div>
     <div>
       <h3>User activity</h3>
       {Object.keys(data).length > 0 && userGraphs.map(meta => (
         meta[1] === "bar" ? <BarGraph traces={getBarTraces(meta[0])} title={keyToTitle[meta[0]]} height={"250px"} /> :
            <LineGraph traces={[{x: getX(data[meta[0]]), y: getY(data[meta[0]])}]}
                       title={keyToTitle[meta[0]]} height={"250px"}/>
       ))}
     </div>
   </div>
  );
};

export default ProjectDashboard;
