/*
Component containing repo detail view
 */
import React, {useEffect} from "react";

import "core-js/features/url";
import "core-js/features/url-search-params";

import id_to_repo from "../data/id_to_repo";
import name_to_id from "../data/name_to_id";
import {Accordion, ExternalLink, HelpTooltip} from "@eto/eto-ui-components";
import {css} from "@emotion/react";
import LaunchIcon from "@mui/icons-material/Launch";
import {BarGraph, LineGraph} from "./graph";
import ProjectMetadata from "./project_metadata";

import {keyToTitle, getCountryTraces, getBarTraces, getX, getY, getRepoName, tooltips} from "./utils";
import HighlightBox from "./highlight_box";
import githubLogo from "../images/github-mark.png";

const styles = {
  dashboardContainer: css`
    margin: 20px auto;
    max-width: 1300px;
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
  `,
  metadataWrapper: css`
    margin-bottom: 20px;
  `,
  headerContainer: css`
    padding: 0px 20px;
  `,
  githubLogo: css`
    height: 25px;
    vertical-align: bottom;
    margin: 0 4px 2px 0;
  `,
  noData: css`
    text-align: center;
    margin: 20px;
  `,
  repoIcon: css`
    height: 22px;
    vertical-align: bottom;
    display: inline-block;
    padding-left: 3px;
  `,
  depsIcon: css`
    height: 13px;
    vertical-align: bottom;
  `,
  article: css`
    margin: 20px 40px;
  `,
  articleMeta: css`
    font-style: italic;
  `
};

const ProjectDetails = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get("name") !== null){
      const project_name = urlParams.get("name");
      if (window.plausible) {
        window.plausible("Loaded project detail", {props: {
          "project_name": project_name
        }});
      }
      if(!(project_name in name_to_id)){
        setData([])
      } else {
        const project_id = name_to_id[project_name];
        const newData = id_to_repo[project_id];
        setRepoName(getRepoName(newData));
        setData(newData);
        updateAccordionDetails(newData);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [data, setData] = React.useState({});
  const [expanded, setExpanded] = React.useState(null);
  const [accordionDetails, setAccordionDetails] = React.useState([]);
  const [repoName, setRepoName] = React.useState(null);

  const getGraphs = (meta, currData) => {
    const currName = getRepoName(currData);
    const graphTitle = `${keyToTitle[meta[0]]} in ${currName}`;
    if(meta[1] === "bar"){
      return <BarGraph traces={getBarTraces(meta[0], currData)} title={graphTitle}
                                        normalizeTime={meta[0] !== "contrib_counts"}/>
    } else if(meta[1] === "line") {
      return <LineGraph traces={[{x: getX(currData[meta[0]]), y: getY(currData[meta[0]])}]}
                 title={graphTitle} />
    }
    return <LineGraph traces={getCountryTraces(currData[meta[0]])}
                      showLegend={true} title={`PyPI downloads over time in ${currName}`}/>;
  };

  const getTopArticles = (articles) => {
    return <div>
      {articles.map(article => <div css={styles.article} key={article.title}>
        <div><strong>{article.link ? <ExternalLink href={article.link}>{article.title}<LaunchIcon css={styles.depsIcon}/></ExternalLink> : <span>{article.title}</span>}</strong></div>
        <div css={styles.articleMeta}>{article.year}{article.source ? `: ${article.source}`: ""}. {article.citations} citations.</div>
      </div>)}
    </div>
  };

  const updateAccordionDetails = (currData) => {
    const graphConfig = [
      ["push_dates", "bar", <span>This graph shows the number of commits made to any branch of the repository each year, as reported in GitHub Archive PushEvents. Within a project,
          we deduplicate commits based on their hash.</span>],
      ["downloads", "multi-line", <span>
        This graph shows the number of package downloads from PyPI per year, with country affiliations as reported in
        the BigQuery dataset bigquery-public-data.pypi.file_downloads. Note that automated downloads may inflate these counts. For further discussion,
        see the CHAOSS metric <ExternalLink href={"https://chaoss.community/kb/metric-number-of-downloads/"}>Number of Downloads</ExternalLink>.
      </span>],
      ["issue_dates", "bar", <span>
        This graph compares the number of issues and pull requests opened per year to the number of issues and pull requests closed, as reported in GitHub Archive IssuesEvents. A high ratio of new
        issues opened to issues closed might indicate the project needs more maintenance capacity. For further discussion, see
        the CHAOSS metrics <ExternalLink href={"https://chaoss.community/kb/metric-issues-new/"}>Issues New</ExternalLink> and <ExternalLink href={"https://chaoss.community/kb/metric-issues-closed/"}>Issues Closed</ExternalLink>.
      </span>],
      ["commit_dates", "bar", <span>
        This graph compares the number of contributors who made a commit for the first time in a given year to
        the number of contributors that had made a commit in a previous year, as reported in GitHub Archive PushEvents.
        We currently only identify individual contributors based on their names, which may change over time. For further discussion,
        see the CHAOSS metrics <ExternalLink href={"https://chaoss.community/kb/metric-new-contributors/"}>New Contributors</ExternalLink> and <ExternalLink href={"https://chaoss.community/kb/metric-inactive-contributors/"}>Inactive Contributors</ExternalLink>.
      </span>],
      ["contrib_counts", "bar", <span>This graph shows the percentage of commits authored by each of the top 20 contributors to the project,
        as reported in GitHub Archive PushEvents. We currently only identify individual contributors based on their names, which may change over time.
        For related discussion, see the CHAOSS metric <ExternalLink href={"https://chaoss.community/kb/metric-bus-factor/"}>Bus Factor</ExternalLink>.
    </span>],
      ["star_dates", "bar", <span>This graph shows the number of new stars added during each year we track, as reported in GitHub Archive WatchEvents.</span>],
    ];
    const newDetails = [];
    if(("top_articles" in currData) && (currData["top_articles"].length > 0)){
      newDetails.push({
        "id": "top_articles",
        "name": "Top-cited articles that mention this repository",
        "content": getTopArticles(currData["top_articles"])
      })
    }
    const metricDetails = graphConfig.filter(cfg =>
      (cfg[0] in currData) &&
      (currData[cfg[0]].length > 0) &&
      // if we have pypi downloads but the primary programming language isn't python, it's probably a spuriously
      // linked set of pypi downloads, exclude
      ((cfg[0] !== "downloads") || (data["language"] === "Python"))
    ).map(cfg => (
      {
        "id": cfg[0],
        "name": keyToTitle[cfg[0]],
        "content" : <div>
          <div css={styles.graphHeader} key={cfg[0]}>{cfg[2]}</div>
          {getGraphs(cfg, currData)}
        </div>
      }
    ));
    newDetails.push(...metricDetails);
    setAccordionDetails(newDetails);
    setAndLogExpanded([newDetails[0].id, newDetails[1].id]);
  };

  const setAndLogExpanded = (newExpanded) => {
    if (window.plausible) {
      window.plausible("Set detail accordion state", {props: {
        "expanded": JSON.stringify(newExpanded)
      }});
    }
    setExpanded(newExpanded)
  };

  return (
    (data.length === 0) ?
      <div css={styles.noData}>
        No data available for <strong>{(new URLSearchParams(window.location.search)).get("name")}</strong>. <a href={"/"}>Click to return to main page.</a>
      </div> :
      <div css={styles.dashboardContainer} id={"project-dashboard"}>
        <div css={styles.headerContainer}>
          <div css={styles.backLink}>
            <a href={"/"}>Back to main page</a>
          </div>
          <h2 css={styles.ghLink}>
            <ExternalLink href={"https://github.com/" + repoName}>
              <img src={githubLogo} css={styles.githubLogo}/>{repoName}<LaunchIcon css={styles.repoIcon}/>
            </ExternalLink>
          </h2>
          {data["has_deps_dev"] &&
          <span css={styles.depsLink}>
        <ExternalLink href={"https://deps.dev/project/github/" + data["owner_name"] + "%2F" + data["current_name"]}>
          deps.dev<LaunchIcon css={styles.depsIcon}/>
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
              <HighlightBox title={"Basic statistics"} isWide={true}>
                <div css={styles.metadataWrapper}>
                  <ProjectMetadata data={data}/>
                </div>
              </HighlightBox>
              {"num_references" in data &&
              <HighlightBox title={<span>Most frequently citing fields<HelpTooltip text={tooltips.field_references}/></span>} isWide={true}>
                <ul css={styles.fieldList}>
                  {Object.keys(data["num_references"]).length > 0 ? Object.keys(data["num_references"]).sort((a, b) =>
                    data["num_references"][b] - data["num_references"][a]
                  ).slice(0, 5).map(field => <li css={styles.fieldListElt} key={field}>
                    <a href={"/?show_list=true&field_of_study="+field}>{field}</a> (<strong>{data["num_references"][field]}</strong> citation{data["num_references"][field] === 1 ? "" : "s"})
                  </li>) : <span>No references found</span>}
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
          updateExpanded={(newExpanded) => setAndLogExpanded(newExpanded)} headingVariant={"h6"}
        />
      </div>
  );
};

export default ProjectDetails;
