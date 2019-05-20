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
  height: 23,
  buttonSpacing: 5,
  buttonTheme: {
    width: 50,
    height: 15,
    stroke: "#999999",
    "stroke-width": 1,
    style: {
      fontFamily: "Arial, sans-serif",
      marginTop: 100
    },

    states: {
      select: {
        fill: "#D5E9FF"
      }
    }
  },

  labelStyle: {
    fontWeight: "normal",
    fontFamily: "Arial, sans-serif"
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
      fontFamily: "Arial, sans-serif"
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
      fontFamily: "Arial, sans-serif"
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
    const tooltipY = point.plotY - labelHeight - 10;

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
