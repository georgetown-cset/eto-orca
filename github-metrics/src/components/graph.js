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

const LineGraph = (props) => {
  const {traces, title, height} = props;

  const offset = -1;

  const traceMetadata = [];
  let maxY = -1;
  for(const [idx, trace] of traces.entries()) {
    const traceMaxY = Math.max(...trace.y);
    if(traceMaxY > maxY){
      maxY = traceMaxY;
    }
    traceMetadata.push({
      x: trace.x.slice(0, offset),
      y: trace.y.slice(0, offset),
      name: trace.name,
      type: "scatter",
      mode: "lines",
      marker: {color: colors[idx]},
      legendgroup: trace.name
    });
    traceMetadata.push({
      x: trace.x.slice(offset-1),
      y: trace.y.slice(offset-1),
      name: trace.name,
      type: "scatter",
      mode: "lines",
      marker: {color: colors[idx]},
      showlegend: false,
      line: {dash: "dash"},
      legendgroup: trace.name
    });
  }

  const plotlyDefaults = PlotlyDefaults(maxY);

  const layout = plotlyDefaults.layout;
  layout.showlegend = traces.length > 1;
  layout.margin = {t: 50, r: 50, b: 50, l: 50, pad: 4};
  if(title) {
    layout.title = title;
  }

  return (
    <>
      { !isSSR &&
        <Suspense fallback={<div>Loading graph...</div>}>
          <Plot
            config={plotlyDefaults.config}
            data={traceMetadata}
            layout={layout}
            style={{height: height ? height : "450px", width: "100%"}}
          />
        </Suspense>
      }
    </>
  );
};

export {LineGraph};
