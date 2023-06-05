/*
Line and bar graphs used in various other components
 */
import React, { Suspense, lazy } from "react";
import {PlotlyDefaults} from "@eto/eto-ui-components";
import config from "../data/config.json";

const colors = [
  "rgb(126, 252, 231)",
  "rgb(255, 170, 128)",
  "rgb(234, 128, 255)",
  "rgb(128, 149, 255)",
  "rgb(252, 231, 126)"
];

const Plot = lazy(() => import('react-plotly.js'));
const isSSR = typeof window === "undefined";
const noData = <div style={{textAlign: "center"}}>No graph data available</div>;

const cleanTraces = (x, y) => {
  const [clean_x, clean_y] = [[], []];
  const x_to_y = {};
  for(let [idx, x_value] of x.entries()){
    x_to_y[parseInt(x_value)] = y[idx];
  }
  for(let i = 0; i < (config.end_year+1 - config.start_year); i ++){
    const curr_year = config.start_year+i;
    clean_x.push(curr_year);
    clean_y.push((curr_year in x_to_y) && (x_to_y[curr_year] !== null) ? x_to_y[curr_year]: 0)
  }
  return [clean_x, clean_y];
};

const LineGraph = (props) => {
  const {traces, title, height, showLegend=false, normalizeTime=true, forceInteger=true} = props;

  const traceMetadata = [];
  let maxY = -1;
  for(const [idx, trace] of traces.entries()) {
    const [clean_x, clean_y] = normalizeTime ? cleanTraces(trace.x, trace.y) : [trace.x, trace.y];

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
      legendgroup: trace.name
    });
  }

  const plotlyDefaults = PlotlyDefaults(maxY);

  const layout = plotlyDefaults.layout;
  const legendVisible = showLegend || (traces.length > 1);
  layout.showlegend = legendVisible;
  layout.margin = {t: traces.length === 1 ? 50: 80, r: 50, b: 50, l: 50, pad: 4};
  layout.xaxis.dtick = 1;
  if(title) {
    layout.title = title;
  }
  if(!forceInteger){
    layout["yaxis"]["dtick"] = null;
  }

  return (
    <>
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
    const [clean_x, clean_y] = normalizeTime ? cleanTraces(trace.x, trace.y) : [trace.x, trace.y];
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
      legendgroup: trace.name
    });
  }

  const plotlyDefaults = PlotlyDefaults(maxY);

  const layout = plotlyDefaults.layout;
  layout.showlegend = traces.length > 1;
  layout.barmode = "group";
  layout.margin = {t: traces.length === 1 ? 50 : 80, r: 50, b: 50, l: 50, pad: 4};
  if(title) {
    layout.title = title;
  }

  return (
    <>
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
