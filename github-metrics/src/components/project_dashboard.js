import React, {useEffect} from "react";

import "core-js/features/url";
import "core-js/features/url-search-params";

import {id_to_repo} from "../data/constants";
import {ExternalLink} from "@eto/eto-ui-components";
import {css} from "@emotion/react";
import {BarGraph, LineGraph} from "./graph";
import ProjectMetadata from "./project_metadata";

import {keyToTitle, getCountryTraces, getBarTraces} from "./utils";

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
      return <BarGraph traces={getBarTraces(meta[0], data)} title={keyToTitle[meta[0]]} height={"250px"}
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
         meta[1] === "bar" ? <BarGraph traces={getBarTraces(meta[0], data)} title={keyToTitle[meta[0]]} height={"250px"} /> :
            <LineGraph traces={[{x: getX(data[meta[0]]), y: getY(data[meta[0]])}]}
                       title={keyToTitle[meta[0]]} height={"250px"}/>
       ))}
     </div>
   </div>
  );
};

export default ProjectDashboard;
