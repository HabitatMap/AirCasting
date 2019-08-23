import Highcharts from "highcharts/highstock";
import { buildOptions } from "./buildGraphOptions";
import * as graphHighlight from "./graph_highlight";
import * as http from "./http";
import {
  measurementsToTime,
  measurementsToTimeWithExtremes
} from "./singleSession";

let measurementsByTime = {};
let chart = null;
const RENDER_TO_ID = "graph";

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

export const drawMobile = ({ yellow, sensor, heat, showStatsCallback }) => {
  const measurements = measurementsToTime(yellow);
  const [buttons, selectedButton] = mobileButtons;
  showStatsCallback(calculateBounds(yellow, selectedButton));
  const scrollbar = {};
  const xAxis = {
    events: {
      afterSetExtremes: event => {
        showStatsCallback({
          min: Math.floor(event.min),
          max: Math.ceil(event.max)
        });
      }
    }
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

const calculateBounds = (measurements, selectedButton) => {
  const max = Math.max(...measurements.map(m => m.time));
  let min = Math.min(...measurements.map(m => m.time));

  if (selectedButton.type !== "all") {
    min = moment(max)
      .subtract(selectedButton.count, selectedButton.type)
      .valueOf();
  }
  return { max, min };
};

export const drawFixed = ({
  yellow,
  sensor,
  heat,
  times,
  showStatsCallback
}) => {
  const measurements = measurementsToTimeWithExtremes({
    measurements: yellow,
    times
  });
  const [buttons, selectedButton] = fixedButtons;
  showStatsCallback(calculateBounds(yellow, selectedButton));
  const scrollbar = { liveRedraw: false };

  const xAxis = {
    events: {
      afterSetExtremes: event => {
        showStatsCallback({
          min: Math.floor(event.min),
          max: Math.ceil(event.max)
        });
      }
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
    ticks: buildTicks(low, high),
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
      className: level.className
    });
  });
  //TODO:
  //to speed up graph provide data as array not object
  chart ? chart.destroy() : null;
  document
    .getElementById(RENDER_TO_ID)
    .removeEventListener("mouseleave", graphHighlight.hide);
  chart = new Highcharts.StockChart(options);
  measurements.length === 0
    ? chart.showLoading("Loading data from server...")
    : chart.hideLoading();
  measurementsByTime = measurements;
  document
    .getElementById(RENDER_TO_ID)
    .addEventListener("mouseleave", graphHighlight.hide);
};

export const updateYAxis = heat => {
  const min = heat.threshold1;
  const max = heat.threshold5;
  const options = {
    yAxis: {
      plotBands: heat.levels,
      min: min,
      max: max,
      tickPositions: buildTicks(min, max)
    }
  };

  if (chart) {
    chart.update(options);
  }
};

const buildTicks = (low, high) => {
  const tick = Math.round((high - low) / 4);
  return [low, low + tick, low + 2 * tick, high - tick, high];
};
