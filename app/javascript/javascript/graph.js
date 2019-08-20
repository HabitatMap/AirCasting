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

export const fetchAndDrawFixed = showStatsCallback => ({
  sensor,
  heat,
  times,
  streamIds
}) => {
  // render empty graph with loading message
  drawFixed({
    measurements: [],
    sensor,
    heat,
    afterSetExtremes: () => {}
  });

  const pageStartTime = times.end - 24 * 60 * 60 * 1000;

  http
    .get("/api/measurements.json", {
      stream_ids: streamIds,
      start_time: pageStartTime,
      end_time: times.end
    })
    .then(measurements => {
      showStatsCallback(getValues(measurements));

      drawFixed({
        measurements: measurementsToTimeWithExtremes({
          measurements,
          times
        }),
        sensor,
        heat,
        afterSetExtremes: afterSetExtremes({
          streamIds,
          times,
          showStatsCallback
        })
      });
    });
};

export const fetchAndDrawMobile = showStatsCallback => ({
  sensor,
  heat,
  times,
  streamIds
}) => {
  // render empty graph with loading message
  drawMobile({ measurements: [], sensor, heat, showStatsCallback });

  http
    .get("/api/measurements.json", {
      stream_ids: streamIds
    })
    .then(measurements => {
      measurements = measurementsToTime(measurements);

      showStatsCallback(filterMeasurements(measurements));

      drawMobile({
        measurements,
        sensor,
        heat,
        showStatsCallback
      });
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

const afterSetExtremes = ({ streamIds, times, showStatsCallback }) => e => {
  // responsive rules trigger afterSetExtremes before the chart is created, so we need to skip it:
  if (!chart || Object.keys(chart).length === 0) return;
  chart.showLoading("Loading data from server...");

  http
    .get("/api/measurements.json", {
      stream_ids: streamIds,
      start_time: Math.round(e.min),
      end_time: Math.round(e.max)
    })
    .then(measurements => {
      const dataByTime = measurementsToTimeWithExtremes({
        measurements,
        times
      });
      measurementsByTime = dataByTime;
      showStatsCallback(getValues(measurements));
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

export const drawMobile = ({
  measurements,
  sensor,
  heat,
  showStatsCallback
}) => {
  const [buttons, selectedButton] = mobileButtons;
  const scrollbar = {};
  const xAxis = {
    events: {
      afterSetExtremes: event => {
        showStatsCallback(
          getValuesInRange(Object.values(measurements), event.min, event.max)
        );
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

const getValues = data => data.map(m => m.value);

const filterMeasurements = measurementsByTime => {
  const measurements = Object.values(measurementsByTime);
  const selectedTimeRange = mobileButtons[0][mobileButtons[1]];

  if (selectedTimeRange.type === "all") {
    return measurements.map(measurement => measurement.y);
  } else {
    const max = Math.max(...measurements.map(measurement => measurement.x));
    const min = moment(max)
      .subtract(selectedTimeRange.count, selectedTimeRange.type)
      .valueOf();

    return getValuesInRange(measurements, min, max);
  }
};

const getValuesInRange = (data, min, max) =>
  data
    .filter(dataPoint => dataPoint.x >= min && dataPoint.x <= max)
    .map(dataPoint => dataPoint.y);

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
