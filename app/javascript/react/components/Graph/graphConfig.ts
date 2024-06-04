// Refer to the docs if nedeed: https://api.highcharts.com/highcharts/plotOptions
import {
  XAxisOptions,
  YAxisOptions,
  PlotOptions,
  TitleOptions,
  LegendOptions,
  SeriesOptionsType,
  ResponsiveOptions,
} from "highcharts/highstock";

import {
  green,
  orange,
  red,
  yellow,
  white,
  gray200,
  gray400,
} from "../../assets/styles/colors";

import { ThresholdState } from "../../store/thresholdSlice"

const xAxisOption: XAxisOptions = {
  title: {
    text: undefined,
  },
  tickColor: gray200,
  lineColor: white,
  type: "datetime",
  labels: {
    overflow: "justify",
  },
  crosshair: {
    color: white,
    width: 2,
  },
};

const getYAxisOption = (thresholdsState: ThresholdState): YAxisOptions => {
console.log(thresholdsState.max)
const min = Number(thresholdsState.min);
const max = Number(thresholdsState.max);
const low = Number(thresholdsState.low);
const middle = Number(thresholdsState.middle);
const high = Number(thresholdsState.high);


  return {
    title: {
      text: undefined,
    },
    endOnTick: false,
    startOnTick: false,
    tickColor: gray400,
    lineColor: white,
    opposite: true,
    tickWidth: 1,
    minorGridLineWidth: 0,
    gridLineWidth: 0,
    min: min,
    max: max,
    plotBands: [
      {
        from: min,
        to: low,
        color: green,
      },
      {
        from: low,
        to:middle,
        color: yellow,
      },
      {
        from: middle,
        to: high,
        color: orange,
      },
      {
        from: high,
        to: max,
        color: red,
      },
    ],
  };
};


const plotOptions: PlotOptions = {
  spline: {
    lineWidth: 3,
    marker: {
      enabled: false,
    },
  },
};

const seriesOption = (data: number[][]): SeriesOptionsType => ({
  type: "spline",
  color: white,
  data: data,
  tooltip: {
    valueDecimals: 2,
  },
});

const titleOption: TitleOptions = {
  text: "Measurement graph",
  align: "left",
};

const legendOption: LegendOptions = {
  enabled: false,
};


const responsive: ResponsiveOptions = {
  rules: [{
      condition: {
          maxHeight: 200
      },
    }]
  };

export {
  xAxisOption,
  plotOptions,
  titleOption,
  legendOption,
  seriesOption,
  getYAxisOption,
  responsive,
};
