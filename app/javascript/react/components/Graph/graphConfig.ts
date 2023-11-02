import Highcharts, {
  ChartOptions,
  CreditsOptions,
  NavigatorOptions,
  PlotLineOptions,
  PlotOptions,
  ResponsiveOptions,
  ScrollbarOptions,
  SeriesLabelOptionsObject,
} from "highcharts";

const chart: ChartOptions = {
  height: 230,
  spacingTop: 5,
  spacingBottom: 5,
  spacingRight: 0,
  spacingLeft: 0,
  marginBottom: 22,
  marginRight: 5,
  marginLeft: 5,
  // TODO Somer error here
  // zoomType: "x",
  resetZoomButton: {
    theme: {
      display: "none",
    },
  },
};

const labelsOptions: SeriesLabelOptionsObject = {
  style: {
    fontFamily: "Arial,sans-serif",
  },
};

const navigator: NavigatorOptions = {
  enabled: false,
};

export const plotOptions: PlotOptions = {
  line: {
    color: "#FFFFFF",
    turboThreshold: 9999999, //above that graph will not display,
    marker: {
      fillColor: "#00b2ef",
      lineWidth: 0,
      lineColor: "#00b2ef",
    },

    dataGrouping: {
      enabled: true,
      units: [
        ["millisecond", null],
        ["second", [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40, 50]],
        ["minute", [1, 2, 3, 4, 5]],
      ],
    },
  },
};

const credits: CreditsOptions = {
  enabled: true,
  position: { align: "right", verticalAlign: "top", x: -4, y: 32 },
};

interface RangeSelectorOptions {
  buttons: any[]; // Define a more specific type here if possible
  selected: number;
}

const rangeSelectorConfig = ({ buttons, selected }: RangeSelectorOptions) => ({
  height: 32,

  buttonSpacing: 15,
  buttonTheme: {
    fill: "none",
    width: 48,
    r: 12,
    stroke: "rgba(149, 149, 149, 0.3)",
    "stroke-width": 1,
    style: {
      fontFamily: '"PT Sans", Arial, sans-serif',
    },
    states: {
      hover: {
        fill: "#00b2ef",
        style: {
          color: "white",
        },
      },
      select: {
        fill: "#00b2ef",
        style: {
          color: "white",
          fontWeight: "bold",
        },
      },
      disabled: {
        style: {
          color: "#a3a0a4",
          cursor: "default",
        },
      },
    },
  },

  labelStyle: {
    color: "#000",
    fontWeight: "normal",
    fontFamily: '"PT Sans", Arial, sans-serif',
    textTransform: "lowercase",
  },

  buttons,
  inputEnabled: false,
  selected,
});

const scrollbar: ScrollbarOptions = {
  barBackgroundColor: "#D5D4D4",
  barBorderRadius: 7,
  barBorderWidth: 0,
  buttonArrowColor: "#333333",
  buttonBorderColor: "#cccccc",
  buttonsEnabled: true,
  buttonBackgroundColor: "#eee",
  buttonBorderWidth: 0,
  buttonBorderRadius: 7,
  height: 12,
  rifleColor: "#D5D4D4",
  trackBackgroundColor: "none",
  trackBorderWidth: 0,
  showFull: false,
  liveRedraw: false,
};

const buildXAxis = (xAxis: any) => ({
  labels: {
    style: {
      color: "#000",
      fontFamily: '"PT Sans", Arial, sans-serif',
    },
  },
  minRange: 10000,
  ordinal: false,
  events: {
    // afterSetExtremes,
  },
});

interface YAxisOptions {
  low: number;
  high: number;
  ticks: number[];
}

const buildYAxis = ({ low, high, ticks }: YAxisOptions) => ({
  min: low,
  max: high,
  startOnTick: true,
  endOnTick: true,
  plotBands: [],
  labels: {
    style: {
      color: "#000",
      fontFamily: '"PT Sans", Arial, sans-serif',
    },
  },
  gridLineWidth: 0,
  minPadding: 0,
  tickPositions: ticks,
});

interface FormatterOptions {
  measurementType: string;
  unitSymbol: string;
  onMouseOverSingle: (data: any) => void; // Define a more specific type here if possible
  onMouseOverMultiple: (start: number, end: number) => void;
}

interface TooltipFormatterThisContext {
  points: any[]; // Replace any with the actual type
  x: number;
  // any other properties you access via this
}

const formatter = ({
  measurementType,
  unitSymbol,
  onMouseOverSingle,
  onMouseOverMultiple,
}: FormatterOptions) =>
  function (this: TooltipFormatterThisContext) {
    var pointData = this.points[0];
    var series = pointData.series;
    var s = "<span>" + Highcharts.dateFormat("%m/%d/%Y", this.x) + " ";
    if (series.hasGroupedData) {
      var groupingDiff = series.currentDataGrouping.totalRange;
      var xLess = this.x;
      var xMore = this.x + groupingDiff;
      s += Highcharts.dateFormat("%H:%M:%S", xLess) + "-";
      s += Highcharts.dateFormat("%H:%M:%S", xMore - 1000) + "</span>";
      onMouseOverMultiple(xLess, xMore);
    } else {
      s += Highcharts.dateFormat("%H:%M:%S", this.x) + "</span>";
      onMouseOverSingle({
        latitude: parseFloat(pointData.point.latitude),
        longitude: parseFloat(pointData.point.longitude),
      });
    }
    s +=
      "<br/>" +
      measurementType +
      " = " +
      Math.round(pointData.y) +
      " " +
      unitSymbol;
    return s;
  };

interface TooltipThisContext {
  chart: {
    plotWidth: number;
    // Other properties and methods you might access go here
  };
  // Other properties and methods you might access go here
}

const tooltipConfig = ({
  measurementType,
  unitSymbol,
  onMouseOverSingle,
  onMouseOverMultiple,
}: FormatterOptions) => ({
  style: {
    color: "#000000",
    fontFamily: "Arial,sans-serif",
  },

  borderWidth: 0,
  formatter: formatter({
    measurementType,
    unitSymbol,
    onMouseOverSingle,
    onMouseOverMultiple,
  }),
  positioner: function (
    this: TooltipThisContext,
    labelWidth: number,
    labelHeight: number,
    point: { plotX: number; plotY: number }
  ) {
    const pointerWidth = 10;
    const tooltipX = Math.min(
      Math.max(0, point.plotX - (labelWidth - pointerWidth) / 2), // (extreme left, middle)
      this.chart.plotWidth - labelWidth // extreme right
    );

    const pointerHeight = 10;
    let tooltipY = point.plotY - labelHeight - pointerHeight;
    if (tooltipY < 0) {
      // changes tooltip position at the top of the graph
      tooltipY = point.plotY + pointerHeight;
    }

    return { x: tooltipX, y: tooltipY };
  },
});

const responsive: ResponsiveOptions = {
  rules: [
    {
      condition: {
        maxWidth: 480,
      },
      chartOptions: {
        rangeSelector: {
          // TODO some error here
          // height: 30,
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
      chartOptions: {
        scrollbar: {
          enabled: false,
        },
        credits: {
          position: { align: "right", verticalAlign: "bottom", x: -4, y: -10 },
        },
      },
    },
  ],
};

// interface BuildOptionsParams {
//   renderTo: string;
//   buttons: any[]; // Define a more specific type here if possible
//   selectedButton: number;
//   series: any[]; // Define a more specific type here if possible
//   xAxis: any;
//   low: number;
//   high: number;
//   ticks: number[];
//   scrollbar: any; // Define a more specific type here if possible
//   measurementType: string;
//   unitSymbol: string;
//   onMouseOverSingle: (data: any) => void; // Define a more specific type here if possible
//   onMouseOverMultiple: (start: number, end: number) => void;
// }

export const measurementGraphConfig: Highcharts.Options = {
  // navigator,
  // plotOptions,
  // credits,
  // labelsOptions,
  // responsive,
  // chart,
  // scrollbar,
  // rangeSelector: rangeSelectorConfig({ buttons, selected: selectedButton }),
  // tooltip: tooltipConfig({
  //   measurementType,
  //   unitSymbol,
  //   onMouseOverSingle,
  //   onMouseOverMultiple,
  // }),
  // xAxis: buildXAxis(xAxis),
  // yAxis: buildYAxis({ low, high, ticks }),
  // // reconstruct or pass input config
};
