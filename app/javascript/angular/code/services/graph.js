import Highcharts from "highcharts/highstock";
import { buildOptions } from "./buildGraphOptions";
import * as graphHighlight from "./google/graph_highlight";
import * as http from "./http";

let measurementsByTime = {};
let chart = null;
const RENDER_TO_ID = "graph";

export const fetchAndDrawFixed = (selectedSensor, heat, singleFixedSession) => {
  const endDate = new Date(singleFixedSession.endTime()).getTime();
  const startDate = endDate - 24 * 60 * 60 * 1000;
  const streamId = singleFixedSession.selectedStream().id;

  http
    .get("/api/realtime/stream_measurements.json", {
      stream_ids: streamId,
      start_date: startDate,
      end_date: endDate
    })
    .then(xs => {
      drawFixed(
        singleFixedSession.measurementsToTime(xs),
        selectedSensor,
        heat,
        afterSetExtremes({
          streamId,
          endDate,
          measurementsToTime: xs => singleFixedSession.measurementsToTime(xs)
        })
      );
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

const afterSetExtremes = ({ streamId, endDate, measurementsToTime }) => e => {
  var finalPoint = {
    [endDate]: {
      x: endDate,
      y: null,
      latitude: null,
      longitude: null
    }
  };
  chart.showLoading("Loading data from server...");

  http
    .get("/api/realtime/stream_measurements.json", {
      stream_ids: streamId,
      start_date: Math.round(e.min),
      // winter time fix
      end_date: Math.round(e.max)
    })
    .then(data => {
      dataWithFinalPoint = { ...measurementsToTime(data), ...finalPoint };
      measurementsByTime = dataWithFinalPoint;
      chart.series[0].setData(Object.values(dataWithFinalPoint), false);
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

export const drawMobile = (data, selectedSensor, heat) => {
  const [buttons, selectedButton] = mobileButtons;
  const scrollbar = {};
  const xAxis = {};
  draw(buttons, selectedButton, scrollbar, xAxis, data, selectedSensor, heat);
};

const drawFixed = (data, selectedSensor, heat, afterSetExtremes) => {
  const [buttons, selectedButton] = fixedButtons;
  const scrollbar = { liveRedraw: false };

  const xAxis = {
    events: {
      afterSetExtremes
    },
    ordinal: false
  };

  draw(buttons, selectedButton, scrollbar, xAxis, data, selectedSensor, heat);
};

const draw = (
  buttons,
  selectedButton,
  scrollbar,
  xAxis,
  data,
  selectedSensor,
  heat
) => {
  const low = heat.getValue("lowest");
  const high = heat.getValue("highest");
  const tick = Math.round((high - low) / 4);
  const ticks = [low, low + tick, low + 2 * tick, high - tick, high];

  const series = [
    {
      name: selectedSensor.measurement_type,
      data: Object.values(data)
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
    measurementType: selectedSensor.measurement_type,
    unitSymbol: selectedSensor.unit_symbol,
    onMouseOverSingle,
    onMouseOverMultiple
  });

  heat.toLevels().forEach(level => {
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
  measurementsByTime = data;
};
