/*
Component containing repo detail view
 */
import React, {useEffect} from "react";

import "core-js/features/url";
import "core-js/features/url-search-params";

import {id_to_repo} from "../data/constants";
import {ExternalLink} from "@eto/eto-ui-components";
import {css} from "@emotion/react";
import {BarGraph, LineGraph} from "./graph";
import ProjectMetadata from "./project_metadata";

import {keyToTitle, getCountryTraces, getBarTraces, getX, getY, getRepoName} from "./utils";
import HighlightBox from "./highlight_box";

const styles = {
  dashboardContainer: css`
    margin: 20px auto;
    max-width: 1000px;
  `,
  backLink: css`
    text-align: right;
  `,
  ghLink: css`
    display: inline-block;
    margin-right: 10px;
  `,
  depsLink: css`
    display: inline-block;
    font-size: 80%;
  `,
  description: css`
    vertical-align: top;
    padding-right: 5px;
  `,
  introStats: css`
    text-align: center;
    margin: 10px 0px;
  `,
  fieldList: css`
    margin: 0;
  `
};

const ProjectDetails = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get("project_id") !== null){
      const project_id = urlParams.get("project_id");
      setData(id_to_repo[project_id]);
    }
  }, []);

  const [data, setData] = React.useState({});
  const repo_name = getRepoName(data);

  const contribGraphs = [
    ["push_dates", "line"],
    ["issue_dates", "bar"],
    ["commit_dates", "bar"],
    ["contrib_counts", "bar"],
  ];
  const userGraphs = [
    ["star_dates", "line"],
    ["downloads", "multi-line"]
  ];

  const getGraphs = (meta) => {
    if(meta[1] === "bar"){
      return <BarGraph traces={getBarTraces(meta[0], data)} title={keyToTitle[meta[0]]}
                                        normalizeTime={meta[0] !== "contrib_counts"}/>
    } else if(meta[1] === "line") {
      return <LineGraph traces={[{x: getX(data[meta[0]]), y: getY(data[meta[0]])}]}
                 title={keyToTitle[meta[0]]} />
    }
    return <LineGraph traces={getCountryTraces(data[meta[0]])} title={keyToTitle[meta[0]]}
                      showLegend={true}/>;
  };

  return (
   <div css={styles.dashboardContainer} id={"project-dashboard"}>
     <div css={styles.backLink}>
      <a href={"/"}>Back to listing page</a>
     </div>
     <div>
       <h2 css={styles.ghLink}>
         <ExternalLink href={"https://github.com/"+repo_name}>{repo_name}</ExternalLink>
       </h2>
        {data["has_deps_dev"] &&
        <span css={styles.depsLink}>
          <ExternalLink href={"https://deps.dev/project/github/" + data["owner_name"] + "%2F" + data["current_name"]}>
            [deps.dev]
          </ExternalLink>
        </span>
        }
       <div>
         <div css={styles.description}>
           <div>
             {data["description"]}
           </div>
         </div>
         <div css={styles.introStats}>
           <HighlightBox title={"Basic Statistics"}>
             <ProjectMetadata data={data}/>
           </HighlightBox>
           {"num_references" in data &&
           <HighlightBox title={"Most Frequently Citing Fields"}>
             <ul css={styles.fieldList}>
               {Object.keys(data["num_references"]).sort((a, b) =>
                 data["num_references"][b] - data["num_references"][a]
               ).slice(0, 5).map(field => <li>
                 {field} ({data["num_references"][field]} citation{data["num_references"][field] === 1 ? "" : "s"})
               </li>)}
             </ul>
           </HighlightBox>
           }
         </div>
       </div>
     </div>
     <div>
       <h3>Contributor activity</h3>
       {Object.keys(data).length > 0 && contribGraphs.map(meta =>
         getGraphs(meta)
       )}
     </div>
     <div>
       <h3>User activity</h3>
       {Object.keys(data).length > 0 && userGraphs.map(meta =>
         getGraphs(meta)
       )}
     </div>
   </div>
  );
};

export default ProjectDetails;
