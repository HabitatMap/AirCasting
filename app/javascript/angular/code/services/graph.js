import Highcharts from "highcharts/highstock";
import { buildOptions } from "./buildGraphOptions";
import * as graphHighlight from "./google/graph_highlight";
import * as http from "./http";
import {
  measurementsToTime,
  measurementsToTimeWithExtremes
} from "./singleSession";

let measurementsByTime = {};
let chart = null;
const RENDER_TO_ID = "graph";

export const fetchAndDrawFixed = ({ sensor, heat, times, streamId }) => {
  const pageStartTime = times.end - 24 * 60 * 60 * 1000;

  http
    .get("/api/measurements.json", {
      stream_id: streamId,
      start_time: pageStartTime,
      end_time: times.end
    })
    .then(xs => {
      drawFixed({
        measurements: measurementsToTimeWithExtremes({
          measurements: xs,
          times
        }),
        sensor,
        heat,
        afterSetExtremes: afterSetExtremes({ streamId, times })
      });
    });
};

export const fetchAndDrawMobile = ({ sensor, heat, times, streamId }) => {
  http
    .get("/api/measurements.json", {
      stream_id: streamId
    })
    .then(xs => {
      drawMobile({ measurements: measurementsToTime(xs), sensor, heat });
    });
};

const onMouseOverSingle = point => graphHighlight.show([point]);

const onMouseOverMultiple = (start, end) => {
  var startSec = start;
  var endSec = end;
  var points = [];
  var point;
  for (var i = startSec; i <= endSec; i = i + 1000) {
    point = measurementsByTime[i + ""];
    if (point) points.push(point);
  }
  var pointNum = Math.floor(points.length / 2);
  graphHighlight.show([points[pointNum]]);
};

const afterSetExtremes = ({ streamId, times }) => e => {
  chart.showLoading("Loading data from server...");

  http
    .get("/api/measurements.json", {
      stream_id: streamId,
      start_time: Math.round(e.min),
      end_time: Math.round(e.max)
    })
    .then(measurements => {
      const dataByTime = measurementsToTimeWithExtremes({
        measurements,
        startTime: times.start,
        endTime: times.end
      });
      measurementsByTime = dataByTime;
      chart.series[0].setData(Object.values(dataByTime), false);
      chart.redraw();
      chart.hideLoading();
    });
};

const min1 = { count: 1, type: "minute", text: "1min" };
const min5 = { count: 5, type: "minute", text: "5min" };
const min30 = { count: 30, type: "minute", text: "30min" };
const hr1 = { count: 1, type: "hour", text: "1hr" };
const hrs12 = { count: 12, type: "hour", text: "12hrs" };
const hrs24 = { count: 24, type: "hour", text: "24hrs" };
const wk1 = { count: 1, type: "week", text: "1wk" };
const mth1 = { count: 1, type: "month", text: "1mth" };
const all = { type: "all", text: "All" };

const fixedButtons = [[hr1, hrs12, hrs24, wk1, mth1, all], 2];

const mobileButtons = [[min1, min5, min30, hr1, hrs12, all], 4];

export const drawMobile = ({ measurements, sensor, heat }) => {
  const [buttons, selectedButton] = mobileButtons;
  const scrollbar = {};
  const xAxis = {};
  draw({
    buttons,
    selectedButton,
    scrollbar,
    xAxis,
    measurements,
    sensor,
    heat
  });
};

const drawFixed = ({ measurements, sensor, heat, afterSetExtremes }) => {
  const [buttons, selectedButton] = fixedButtons;
  const scrollbar = { liveRedraw: false };

  const xAxis = {
    events: {
      afterSetExtremes
    },
    ordinal: false
  };

  draw({
    buttons,
    selectedButton,
    scrollbar,
    xAxis,
    measurements,
    sensor,
    heat
  });
};

const draw = ({
  buttons,
  selectedButton,
  scrollbar,
  xAxis,
  measurements,
  sensor,
  heat
}) => {
  const low = heat.threshold1;
  const high = heat.threshold5;
  const tick = Math.round((high - low) / 4);
  const ticks = [low, low + tick, low + 2 * tick, high - tick, high];

  const series = [
    {
      name: sensor.parameter,
      data: Object.values(measurements)
    }
  ];

  const options = buildOptions({
    renderTo: RENDER_TO_ID,
    buttons,
    selectedButton,
    series,
    xAxis,
    low,
    high,
    ticks,
    scrollbar,
    measurementType: sensor.parameter,
    unitSymbol: sensor.unit,
    onMouseOverSingle,
    onMouseOverMultiple
  });

  heat.levels.forEach(level => {
    options.yAxis.plotBands.push({
      from: level.from,
      to: level.to,
      color: level.color
    });
  });
  //TODO:
  //to speed up graph provide data as array not object
  chart ? chart.destroy() : null;
  chart = new Highcharts.StockChart(options);
  measurementsByTime = measurements;
};
