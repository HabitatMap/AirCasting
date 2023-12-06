import {
  XAxisOptions,
  YAxisOptions,
  PlotOptions,
  TitleOptions,
  LegendOptions,
  SeriesOptionsType,
} from "highcharts/highstock";
import {
  graphGreen,
  graphOrange,
  graphRed,
  graphYellow,
  white,
  tickDarkGray,
  tickLightGray,
} from "../../assets/styles/colors";

const xAxisOption: XAxisOptions = {
  title: {
    text: undefined,
  },
  tickColor: tickLightGray,
  lineColor: white,
  type: "datetime",
  labels: {
    overflow: "justify",
  },
};

const yAxisOption: YAxisOptions = {
  title: {
    text: undefined,
  },
  endOnTick: false,
  startOnTick: false,
  tickColor: tickDarkGray,
  lineColor: white,
  opposite: true,
  tickWidth: 1,
  minorGridLineWidth: 0,
  gridLineWidth: 0,
  plotBands: [
    {
      from: 0,
      to: 100,
      color: graphGreen,
    },
    {
      from: 100,
      to: 130,
      color: graphYellow,
    },
    {
      from: 130,
      to: 150,
      color: graphOrange,
    },
    {
      from: 150,
      to: 210,
      color: graphRed,
    },
  ],
};

const plotOption: PlotOptions = {
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
  plotOption,
  titleOption,
  legendOption,
  seriesOption,
};
