/*
Component containing repo detail view
 */
import React, {useEffect} from "react";

import "core-js/features/url";
import "core-js/features/url-search-params";

import id_to_repo from "../data/id_to_repo";
import name_to_id from "../data/name_to_id";
import {Accordion, ExternalLink} from "@eto/eto-ui-components";
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
    padding-left: 0px;
  `,
  graphHeader: css`
    margin: 20px 20px 10px 20px;
  `,
  fieldListElt: css`
    line-height: 1.5;
    list-style-type: none;
  `
};

const ProjectDetails = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get("name") !== null){
      const project_name = urlParams.get("name");
      const project_id = name_to_id[project_name];
      setData(id_to_repo[project_id]);
    }
  }, []);

  const [data, setData] = React.useState({});
  const [expanded, setExpanded] = React.useState(["push_dates"]);
  const repo_name = getRepoName(data);

  const getGraphs = (meta) => {
    if(meta[1] === "bar"){
      return <BarGraph traces={getBarTraces(meta[0], data)} title={keyToTitle[meta[0]]}
                                        normalizeTime={meta[0] !== "contrib_counts"}/>
    } else if(meta[1] === "line") {
      return <LineGraph traces={[{x: getX(data[meta[0]]), y: getY(data[meta[0]])}]}
                 title={keyToTitle[meta[0]]} />
    }
    return <LineGraph traces={getCountryTraces(data[meta[0]])}
                      showLegend={true} title={"PyPI downloads over time"}/>;
  };

  const graphConfig = [
    ["push_dates", "line", <span>This graph shows the number of commits made to the main branch of the repository each year.</span>],
    ["downloads", "multi-line", <span>
      This graph shows the number of package downloads from PyPI per year, with country affiliations as reported in
      the BigQuery dataset bigquery-public-data.pypi.file_downloads. Note that automated downloads may inflate these counts.
    </span>],
    ["issue_dates", "bar", <span>
      This graph compares the number of issues opened per year to the number of issues closed. A high ratio of new
      issues opened to issues closed might indicate the project needs more maintenance capacity.
    </span>],
    ["commit_dates", "bar", <span>
      This graph compares the number of contributors who made a commit for the first time in a given year to
      the number of contributors that had made a commit in a previous year.
    </span>],
    ["contrib_counts", "bar", <span>This graph shows the percentage of commits authored by each of the top 20 contributors to the project.</span>],
    ["star_dates", "line", <span>This graph shows the number of new star events that occurred during each year we track.</span>],
  ];

  const accordionDetails = graphConfig.filter(cfg => (cfg[0] in data) && (data[cfg[0]].length > 0)).map(cfg => (
    {
      "id": cfg[0],
      "name": keyToTitle[cfg[0]],
      "content" : <div>
        <div css={styles.graphHeader}>{cfg[2]}</div>
        {getGraphs(cfg)}
      </div>
    }
  ));

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
               ).slice(0, 5).map(field => <li css={styles.fieldListElt}>
                 {field} ({data["num_references"][field]} citation{data["num_references"][field] === 1 ? "" : "s"})
               </li>)}
             </ul>
           </HighlightBox>
           }
         </div>
       </div>
     </div>
     <Accordion
       key={JSON.stringify(expanded)}
       panels={accordionDetails}
       expanded={expanded}
       setExpanded={(newExpanded) => setExpanded(newExpanded)} headingVariant={"h6"}
     />
   </div>
  );
};

export default ProjectDetails;
