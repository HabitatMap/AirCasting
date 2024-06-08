// Refer to the docs if nedeed: https://api.highcharts.com/highcharts/plotOptions
import {
  XAxisOptions,
  YAxisOptions,
  PlotOptions,
  TitleOptions,
  LegendOptions,
  SeriesOptionsType,
  ResponsiveOptions,
  TooltipFormatterContextObject,
} from "highcharts/highstock";

import {
  green,
  orange,
  red,
  yellow,
  white,
  gray200,
  gray400,
  blue,
  black,
} from "../../assets/styles/colors";

import { ThresholdState } from "../../store/thresholdSlice";
import Highcharts from "highcharts";

const scrollbarOptions = {
  barBackgroundColor: "#D5D4D4",
  barBorderRadius: 7,
  barBorderWidth: 0,
  buttonArrowColor: "#333333",
  buttonBorderColor: "#cccccc",
  buttonsEnabled: true,
  buttonBackgroundColor: "#eee",
  buttonBorderWidth: 0,
  buttonBorderRadius: 7,
  height: 8,

  rifleColor: "#D5D4D4",
  trackBackgroundColor: "none",
  trackBorderWidth: 0,
  showFull: true,
};

const xAxisOption: XAxisOptions = {
  title: {
    text: "testtest",
  },
  tickColor: gray200,
  lineColor: white,
  // type: "datetime",
  labels: {
    enabled: true,
    overflow: "justify",
    style: {
      fontSize: "1.2rem",
      fontFamily: "Roboto",
    }
  },
  crosshair: {
    color: white,
    width: 2,
  },
  minRange: 1000,
  visible: true
};

const getYAxisOptions = (thresholdsState: ThresholdState): YAxisOptions => {

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
    labels: {
      enabled: true,
      style: {
        color: black,
        fontFamily: "Roboto",
        fontSize: "1.2rem",
      },
    },
    gridLineWidth: 0,
    minPadding: 0,
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
        to: middle,
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
    color: blue,
    marker: {
      fillColor: blue,
      lineWidth: 0,
      lineColor: blue,
      enabledThreshold: 999,
      radius: 3,
      },
    },
    series: {
      states: {
        hover: {
         halo: {
          attributes: {
            fill: blue,
            'stroke-width': 2,
        }
         }
        },
      },
    }
  };

const seriesOptions = (data: number[][]): SeriesOptionsType => ({
  type: "spline",
  color: white,
  data: data,
  tooltip: {
    valueDecimals: 2,
  },
  dataGrouping: {
    enabled: true,
    units: [
      ["millisecond", []],
      ["second", [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40, 50]],
      ["minute", [1, 2, 3, 4, 5]],
    ],
  },
});


const titleOption: TitleOptions = {
  text: "Measurement graph",
  align: "left",
};

const legendOption: LegendOptions = {
  enabled: false,
};


const responsive = {
  rules: [
    {
      condition: {
        maxWidth: 480,
      },
      chartOptions: {
        rangeSelector: {
          height: 30,
          buttonSpacing: 8,

          buttonTheme: {
            fill: "none",
            width: 33,
            r: 10,
            stroke: "rgba(149, 149, 149, 0.3)",
            "stroke-width": 1,
          },
        },
      },
    },
    {
      condition: {
        maxWidth: 550,
      },
      chartOptions: {
        chart: {
          height: 170,
        },
      },
    },
    {
      condition: {
        maxWidth: 700,
      },
    },
  ],
};


const getTooltipOptions = (measurementType: string, unitSymbol: string) => ({
  formatter: function (this: TooltipFormatterContextObject): string {
    const date = Highcharts.dateFormat("%m/%d/%Y", Number(this.x));
    const time = Highcharts.dateFormat("%H:%M:%S", Number(this.x));
    const pointData = this.points ? this.points[0] : this.point;
    const oneMinuteInterval = 60 * 1000; // 1 minute interval in milliseconds
    let s = `<span>${date} `;

    if (this.points && this.points.length > 1) {
      const xLess = Number(this.x);
      const xMore = xLess + oneMinuteInterval * (this.points.length - 1);
      s += Highcharts.dateFormat("%H:%M:%S", xLess) + "-";
      s += Highcharts.dateFormat("%H:%M:%S", xMore) + "</span>";
    } else {
      s += Highcharts.dateFormat("%H:%M:%S", this.x as number) + "</span>";
    }
    s +=
      "<br/>" +
      measurementType +
      " = " +
      Math.round(Number(pointData.y)) +
      " " +
      unitSymbol;
    return s;
  },
  borderWidth: 0,
  style: {
    fontSize: "1.2rem",
    fontFamily: "Roboto",
  },
});


export {
  xAxisOption,
  plotOptions,
  titleOption,
  legendOption,
  responsive,
  seriesOptions,
  getYAxisOptions,
  getTooltipOptions,
  scrollbarOptions,
};
