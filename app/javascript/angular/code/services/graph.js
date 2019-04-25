import Highcharts from "highcharts/highstock";
import { buildOptions } from "./buildGraphOptions";
import * as graphHighlight from "./google/graph_highlight";
import * as http from "./http";

let measurementsByTime = {};
let chart = null;
const RENDER_TO_ID = "graph";

export const getInitialData = (selectedSensor, heat, singleFixedSession) => {
  var end_date = new Date(singleFixedSession.endTime()).getTime();
  var start_date = end_date - 24 * 60 * 60 * 1000;

  http
    .get("/api/realtime/stream_measurements.json", {
      stream_ids: singleFixedSession.selectedStream().id,
      start_date,
      end_date
    })
    .then(xs => {
      draw(
        singleFixedSession.measurementsToTime(xs),
        singleFixedSession.isFixed(),
        selectedSensor,
        heat,
        singleFixedSession
      );
    });
};

export const draw = (
  data,
  isFixed,
  selectedSensor,
  heat,
  singleFixedSession
) => {
  var sensor = selectedSensor;
  var low = heat.getValue("lowest");
  var high = heat.getValue("highest");
  var tick = Math.round((high - low) / 4);
  var ticks = [low, low + tick, low + 2 * tick, high - tick, high];

  var min1 = { count: 1, type: "minute", text: "1min" };
  var min5 = { count: 5, type: "minute", text: "5min" };
  var min30 = { count: 30, type: "minute", text: "30min" };
  var hr1 = { count: 1, type: "hour", text: "1hr" };
  var hrs12 = { count: 12, type: "hour", text: "12hrs" };
  var hrs24 = { count: 24, type: "hour", text: "24hrs" };
  var wk1 = { count: 1, type: "week", text: "1wk" };
  var mth1 = { count: 1, type: "month", text: "1mth" };
  var all = { type: "all", text: "All" };

  const buttons = isFixed
    ? [hr1, hrs12, hrs24, wk1, mth1, all]
    : [min1, min5, min30, hr1, hrs12, all];
  const selectedButton = isFixed ? 2 : 4;

  const scrollbar = isFixed ? { liveRedraw: false } : {};

  const xAxis = isFixed
    ? {
        events: {
          afterSetExtremes: afterSetExtremes(singleFixedSession)
        },
        ordinal: false
      }
    : {};

  const series = [
    {
      name: sensor.measurement_type,
      data: _(data).values()
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
    measurementType: sensor.measurement_type,
    unitSymbol: sensor.unit_symbol,
    onMouseOverSingle,
    onMouseOverMultiple
  });

  _(heat.toLevels()).each(function(level) {
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

const afterSetExtremes = singleFixedSession => e => {
  var final_point = {};
  var end_time = new Date(singleFixedSession.endTime()).getTime();
  final_point[end_time + ""] = {
    x: end_time,
    y: null,
    latitude: null,
    longitude: null
  };
  chart.showLoading("Loading data from server...");

  http
    .get("/api/realtime/stream_measurements.json", {
      stream_ids: singleFixedSession.selectedStream().id,
      start_date: Math.round(e.min),
      // winter time fix
      end_date: Math.round(e.max)
    })
    .then(data => {
      data = _.extend(singleFixedSession.measurementsToTime(data), final_point);
      measurementsByTime = data;
      chart.series[0].setData(_(data).values(), false);
    })
    .then(() => {
      chart.redraw();
      chart.hideLoading();
    });
};
