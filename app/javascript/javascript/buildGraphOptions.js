import Highcharts from "highcharts";

const buildChart = ({ renderTo }) => ({
  renderTo,
  height: 230,
  spacingTop: 5,
  spacingBottom: 5,
  spacingRight: 0,
  spacingLeft: 0,
  marginBottom: 22,
  marginRight: 5,
  marginLeft: 5,
  zoomType: "x",
  resetZoomButton: {
    theme: {
      display: "none",
    },
  },
});

const labels = {
  style: {
    fontFamily: "Arial,sans-serif",
  },
};

const navigator = {
  enabled: false,
};

const buildRangeSelector = ({ buttons, selected }) => ({
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

const plotOptions = {
  line: {
    lineColor: "#FFFFFF",
    turboThreshold: 9999999, //above that graph will not display,
    marker: {
      fillColor: "#00b2ef",
      lineWidth: 0,
      lineColor: "#00b2ef",
    },

    dataGrouping: {
      enabled: true,
      units: [
        ["millisecond", []],
        ["second", [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40, 50]],
        ["minute", [1, 2, 3, 4, 5]],
      ],
    },
  },
};

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
  height: 12,
  rifleColor: "#D5D4D4",
  trackBackgroundColor: "none",
  trackBorderWidth: 0,
  showFull: false,
};

const buildXAxis = (xAxis) => ({
  labels: {
    style: {
      color: "#000",
      fontFamily: '"PT Sans", Arial, sans-serif',
    },
  },
  minRange: 10000,
  ...xAxis,
});

const buildYAxis = ({ low, high, ticks }) => ({
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

const formatter = ({
  measurementType,
  unitSymbol,
  onMouseOverSingle,
  onMouseOverMultiple,
}) =>
  function () {
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

const buildTooltip = ({
  measurementType,
  unitSymbol,
  onMouseOverSingle,
  onMouseOverMultiple,
}) => ({
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
  positioner: function (labelWidth, labelHeight, point) {
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

const credits = {
  enabled: true,
  position: { align: "right", verticalAlign: "top", x: -4, y: 32 },
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

export const buildOptions = ({
  renderTo,
  buttons,
  selectedButton,
  series,
  xAxis,
  low,
  high,
  ticks,
  scrollbar,
  measurementType,
  unitSymbol,
  onMouseOverSingle,
  onMouseOverMultiple,
}) => ({
  chart: buildChart({ renderTo }),
  labels,
  navigator,
  rangeSelector: buildRangeSelector({ buttons, selected: selectedButton }),
  series,
  plotOptions,
  tooltip: buildTooltip({
    measurementType,
    unitSymbol,
    onMouseOverSingle,
    onMouseOverMultiple,
  }),
  xAxis: buildXAxis(xAxis),
  yAxis: buildYAxis({ low, high, ticks }),
  scrollbar: { ...scrollbar, ...scrollbarOptions },
  credits,
  responsive,
});
