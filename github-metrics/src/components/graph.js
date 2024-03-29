/*
Line and bar graphs used in various other components
 */
import React, { Suspense, lazy, useLayoutEffect } from "react";
import {PlotlyDefaults} from "@eto/eto-ui-components";
import {css} from "@emotion/react";
import config from "../data/config.json";

const colors = [
  "rgb(126, 252, 231)",
  "rgb(255, 170, 128)",
  "rgb(234, 128, 255)",
  "rgb(128, 149, 255)",
  "rgb(252, 231, 126)"
];

const styles = {
  title: css`
    text-align: center;
    font-family: GTZirkonMedium;
    margin: 30px 0 0 0;
  `,
  noData: css`
    text-align: center;
    margin-bottom: 20px;
  `
};

const Plot = lazy(() => import('react-plotly.js'));
const isSSR = typeof window === "undefined";
const noData = <div css={styles.noData}>No graph data available</div>;

const getHoverTemplate = (maxY, numTraces) => {
  // show trace name if more than one trace
  const suffix = numTraces > 1 ? "" : "<extra></extra>";

  // scientific notation looks weird for values < 1, but checking the minimum
  // value doesn't work for graphs where values may be 0 some years and in the
  // thousands other years, so we'll use this heuristic to catch most cases
  // where we might have fractional values
  return (maxY < 10 ? "%{y:,.3f}" : "%{y:,.3s}")+suffix;
};

const cleanTraces = (x, y, displayAllYears=false) => {
  const [clean_x, clean_y] = [[], []];
  const x_to_y = {};
  for(let [idx, x_value] of x.entries()){
    x_to_y[parseInt(x_value)] = y[idx];
  }
  let seenNonzero = displayAllYears;
  for(let i = 0; i < (config.end_year+1 - config.start_year); i ++){
    const curr_year = config.start_year+i;
    const nonZero = (curr_year in x_to_y) && (x_to_y[curr_year] !== null);
    if(seenNonzero || nonZero) {
      clean_x.push(curr_year);
      clean_y.push(nonZero ? x_to_y[curr_year] : 0);
      seenNonzero = true;
    }
  }
  return [clean_x, clean_y];
};

const LineGraph = (props) => {
  const {traces, title, height, showLegend=false, normalizeTime=true, forceInteger=true, displayAllYears=false, xTitle=null, yTitle=null} = props;
  const [screenWidth, setScreenWidth] = React.useState(window.innerWidth);
  const handleSize = () => {
    setScreenWidth(window.innerWidth);
  };
  useLayoutEffect(() => {
    setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleSize);
  }, []);

  const traceMetadata = [];
  let maxY = -1;
  for(const [idx, trace] of traces.entries()) {
    const [clean_x, clean_y] = normalizeTime ? cleanTraces(trace.x, trace.y, displayAllYears) : [trace.x, trace.y];

    const traceMaxY = Math.max(...clean_y);
    if(traceMaxY > maxY){
      maxY = traceMaxY;
    }
    traceMetadata.push({
      x: clean_x,
      y: clean_y,
      name: trace.name,
      type: "scatter",
      mode: "lines",
      marker: {color: colors[idx]},
      legendgroup: trace.name,
      hovertemplate: getHoverTemplate(traceMaxY, traces.length)
    });
  }

  const plotlyDefaults = PlotlyDefaults(maxY);

  const layout = plotlyDefaults.layout;
  const legendVisible = showLegend || (traces.length > 1);
  layout.showlegend = legendVisible;
  layout.margin = {t: 10, r: 50, b: 50, l: 50, pad: 4};
  layout.xaxis.dtick = 1;
  layout.yaxis.rangemode = "tozero";
  if(xTitle !== null){
    layout.xaxis.title = xTitle;
  }
  if(yTitle !== null){
    layout.yaxis.title = yTitle;
  }
  if(!forceInteger){
    layout["yaxis"]["dtick"] = null;
  }
  if(screenWidth < 750) {
    layout.legend = {
      orientation: "h",
      xanchor: "center",
      y: 1.5,
      x: 0.5
    };
  }

  return (
    <>
      {title &&
        <div css={styles.title}>
          {title}
        </div>
      }
      { !isSSR &&
        <Suspense fallback={<div>Loading graph...</div>}>
          {((traces.length === 0) || (traces[0].x.length === 0)) ? noData :
            <Plot
              config={plotlyDefaults.config}
              data={traceMetadata}
              layout={layout}
              style={{height: height ? height : "350px", width: "100%"}}
            />
          }
        </Suspense>
      }
    </>
  );
};

const BarGraph = (props) => {
  const {traces, title, height, normalizeTime=true} = props;

  const traceMetadata = [];
  let maxY = -1;
  for(const [idx, trace] of traces.entries()) {
    const [clean_x, clean_y] = normalizeTime ? cleanTraces(trace.x, trace.y, true) : [trace.x, trace.y];
    const traceMaxY = Math.max(...clean_y);
    if(traceMaxY > maxY){
      maxY = traceMaxY;
    }
    traceMetadata.push({
      x: clean_x,
      y: clean_y,
      name: trace.name,
      type: "bar",
      marker: {color: colors[idx]},
      legendgroup: trace.name,
      hovertemplate: getHoverTemplate(traceMaxY, traces.length)
    });
  }

  const plotlyDefaults = PlotlyDefaults(maxY);

  const layout = plotlyDefaults.layout;
  layout.showlegend = traces.length > 1;
  layout.barmode = "group";
  layout.xaxis.dtick = 1;
  layout.margin = {t: 10, r: 50, b: 50, l: 50, pad: 4};

  return (
    <>
      {title &&
        <div css={styles.title}>
          {title}
        </div>
      }
      { !isSSR &&
        <Suspense fallback={<div>Loading graph...</div>}>
          {(traces.length === 0 || traces[0].x.length === 0) ? noData :
            <Plot
              config={plotlyDefaults.config}
              data={traceMetadata}
              layout={layout}
              style={{height: height ? height : "350px", width: "100%"}}
            />
          }
        </Suspense>
      }
    </>
  );
};

export {LineGraph, BarGraph};
