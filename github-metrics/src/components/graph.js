import React, { Suspense, lazy } from "react";
import {PlotlyDefaults} from "@eto/eto-ui-components";

const colors = [
  "#7AC4A5",
  "#F17F4C",
  "#15AFD0",
  "#B42025",
  "#839DC5",
  "#E5BF21",
  "#3C8786",
  "#7C336F",
  "#003DA6",
  "#B53A6D",
];

const Plot = lazy(() => import('react-plotly.js'));
const isSSR = typeof window === "undefined";
const noData = <div style={{textAlign: "center"}}>No graph data available</div>;

const LineGraph = (props) => {
  const {traces, title, height} = props;

  const traceMetadata = [];
  let maxY = -1;
  for(const [idx, trace] of traces.entries()) {
    const traceMaxY = Math.max(...trace.y);
    if(traceMaxY > maxY){
      maxY = traceMaxY;
    }
    traceMetadata.push({
      x: trace.x,
      y: trace.y,
      name: trace.name,
      type: "scatter",
      mode: "lines",
      marker: {color: colors[idx]},
      legendgroup: trace.name
    });
  }

  const plotlyDefaults = PlotlyDefaults(maxY);

  const layout = plotlyDefaults.layout;
  layout.showlegend = traces.length > 1;
  layout.margin = {t: traces.length == 1 ? 50 : 100, r: 50, b: 50, l: 50, pad: 4};
  layout.xaxis.dtick = 1;
  if(title) {
    layout.title = title;
  }

  return (
    <>
      { !isSSR &&
        <Suspense fallback={<div>Loading graph...</div>}>
          {traces[0].x.length === 0 ? noData :
            <Plot
              config={plotlyDefaults.config}
              data={traceMetadata}
              layout={layout}
              style={{height: height ? height : "450px", width: "100%"}}
            />
          }
        </Suspense>
      }
    </>
  );
};

const BarGraph = (props) => {
  const {traces, title, height} = props;

  const traceMetadata = [];
  let maxY = -1;
  for(const [idx, trace] of traces.entries()) {
    const traceMaxY = Math.max(...trace.y);
    if(traceMaxY > maxY){
      maxY = traceMaxY;
    }
    traceMetadata.push({
      x: trace.x,
      y: trace.y,
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
  layout.margin = {t: 50, r: 50, b: 50, l: 50, pad: 4};
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
              style={{height: height ? height : "450px", width: "100%"}}
            />
          }
        </Suspense>
      }
    </>
  );
};

export {LineGraph, BarGraph};
