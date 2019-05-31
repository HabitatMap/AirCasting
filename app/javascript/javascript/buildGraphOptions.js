import Highcharts from "highcharts/highstock";

const buildChart = ({ renderTo }) => ({
  renderTo,
  height: 200,
  spacingTop: 5,
  spacingBottom: 5,
  spacingRight: 0,
  spacingLeft: 0,
  marginBottom: 15,
  marginRight: 5,
  marginLeft: 5,
  zoomType: "x"
});

const labels = {
  style: {
    fontFamily: "Arial,sans-serif"
  }
};

const navigator = {
  enabled: false
};

const buildRangeSelector = ({ buttons, selected }) => ({
  height: 40,
  buttonSpacing: 15,

  buttonTheme: {
    fill: "none",
    width: 63,
    padding: 2,
    stroke: "rgba(149, 149, 149, 0.3)",
    "stroke-width": 1,
    r: 12,

    style: {
      color: "#000",
      boxShadow: "1px 1px 4px 0 rgba(149, 149, 149, 0.3)",
      fontFamily: '"PT Sans", Arial, sans-serif',
      height: 20,
      width: 63
    },

    states: {
      hover: {
        fill: "none",
        style: {
          color: "#000"
        }
      },

      select: {
        fill: "#09a7f0",
        style: {
          color: "white",
          fontWeight: "bold"
        }
      },

      disabled: {
        style: {
          color: "#a3a0a4",
          cursor: "default"
        }
      }
    }
  },

  labelStyle: {
    color: "#000",
    fontWeight: "normal",
    fontFamily: '"PT Sans", Arial, sans-serif',
    textTransform: "lowercase"
  },

  buttons,
  inputEnabled: false,
  selected
});

const plotOptions = {
  line: {
    lineColor: "#FFFFFF",
    turboThreshold: 9999999, //above that graph will not display,
    marker: {
      fillColor: "#09a7f0",
      lineWidth: 0,
      lineColor: "#09a7f0"
    },

    dataGrouping: {
      enabled: true,
      units: [
        ["millisecond", []],
        ["second", [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40, 50]],
        ["minute", [1, 2, 3, 4, 5]]
      ]
    }
  }
};

const buildXAxis = xAxis => ({
  labels: {
    style: {
      color: "#000",
      fontFamily: '"PT Sans", Arial, sans-serif'
    }
  },
  minRange: 10000,
  ...xAxis
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
      fontFamily: '"PT Sans", Arial, sans-serif'
    }
  },
  gridLineWidth: 0,
  minPadding: 0,
  tickPositions: ticks
});

const formatter = ({
  measurementType,
  unitSymbol,
  onMouseOverSingle,
  onMouseOverMultiple
}) =>
  function() {
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
        longitude: parseFloat(pointData.point.longitude)
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
  onMouseOverMultiple
}) => ({
  style: {
    color: "#000000",
    fontFamily: "Arial,sans-serif"
  },

  borderWidth: 0,
  formatter: formatter({
    measurementType,
    unitSymbol,
    onMouseOverSingle,
    onMouseOverMultiple
  }),
  positioner: function(labelWidth, labelHeight, point) {
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
  }
});

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
  onMouseOverMultiple
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
    onMouseOverMultiple
  }),
  xAxis: buildXAxis(xAxis),
  yAxis: buildYAxis({ low, high, ticks }),
  scrollbar
});
