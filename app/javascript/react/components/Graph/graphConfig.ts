// Refer to the docs if nedeed: https://api.highcharts.com/highcharts/plotOptions
import {
  XAxisOptions,
  YAxisOptions,
  PlotOptions,
  TitleOptions,
  LegendOptions,
  SeriesOptionsType,
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

const yAxisOption: YAxisOptions = {
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
  plotBands: [
    {
      from: 0,
      to: 100,
      color: green,
    },
    {
      from: 100,
      to: 130,
      color: yellow,
    },
    {
      from: 130,
      to: 150,
      color: orange,
    },
    {
      from: 150,
      to: 210,
      color: red,
    },
  ],
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

export {
  xAxisOption,
  yAxisOption,
  plotOptions,
  titleOption,
  legendOption,
  seriesOption,
};
