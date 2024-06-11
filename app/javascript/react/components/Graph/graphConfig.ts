import {
  XAxisOptions,
  YAxisOptions,
  PlotOptions,
  TitleOptions,
  LegendOptions,
  SeriesOptionsType,
  TooltipFormatterContextObject
} from 'highcharts/highstock';
import Highcharts, { RangeSelectorOptions } from 'highcharts';
import { ThresholdState } from '../../store/thresholdSlice';
import { MobileStreamShortInfo as StreamShortInfo } from "../../types/mobileStream";

import { green, orange, red, yellow, white, gray200, gray400, blue, black } from '../../assets/styles/colors';
import { updateMeasurementExtremes } from '../../store/fixedStreamSlice';
import { useAppDispatch } from '../../store/hooks';

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



const getXAxisOptions = (): XAxisOptions => {

  const dispatch = useAppDispatch();

  const handleSetExtremes = (e: Highcharts.AxisSetExtremesEventObject) => {
    console.log('Data range changed. New extremes:', e.min, e.max);
    const min = e.min;
    const max = e.max;
    dispatch(updateMeasurementExtremes({
      min,
      max,
    }));
  }

  return ({
    title: {
      text: undefined,
    },
    tickColor: gray200,
    lineColor: white,
    type: 'datetime',
    labels: {
      enabled: true,
      overflow: 'justify',
      step: 1,
      style: {
        fontSize: '1.2rem',
        fontFamily: 'Roboto',
      },
    },
    crosshair: {
      color: white,
      width: 2,
    },
    visible: true,
    minRange: 1000,
    events: {
      setExtremes: function (e) {
        handleSetExtremes(e);
      }
    },
  });
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
    endOnTick: true,
    startOnTick: true,
    tickColor: gray400,
    lineColor: white,
    opposite: true,
    tickWidth: 1,
    minorGridLineWidth: 0,
    showLastLabel: true,
    tickInterval: 50,
    labels: {
      enabled: true,
      style: {
        color: black,
        fontFamily: 'Roboto',
        fontSize: '1.2rem',
        justifyContent: 'center',
        padding: '0',
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

const credits = {
  enabled: true,
  position: { align: 'right', verticalAlign: 'top', x: -4, y: 32 },
};

const plotOptions: PlotOptions = {
  series: {
    lineWidth: 2,
    color: blue,
    marker: {
      fillColor: blue,
      lineWidth: 0,
      lineColor: blue,
      radius: 3,
    },
    states: {
      hover: {
        halo: {
          attributes: {
            fill: blue,
            'stroke-width': 2,
          },
        },
      },
    },
    dataGrouping: {
      enabled: true,
      units: [
        ["millisecond", []],
        ["second", [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40, 50]],
        ["minute", [1, 2, 3, 4, 5]],
      ],
    },
    dataLabels: {
      allowOverlap: true,
    },
  },
};

const seriesOptions = (data: number[][]): SeriesOptionsType => (
  {
    type: 'spline',
    color: white,
    data: data.sort((a, b) => a[0] - b[0]),
    tooltip: {
      valueDecimals: 2,
    },
  });

const titleOption: TitleOptions = {
  text: 'Measurement graph',
  align: 'left',
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
          inputEnabled: false,
          buttonTheme: {
            fill: 'none',
            width: 33,
            r: 10,
            stroke: 'rgba(149, 149, 149, 0.3)',
            'stroke-width': 1,
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
    const date = Highcharts.dateFormat('%m/%d/%Y', Number(this.x));
    const time = Highcharts.dateFormat('%H:%M:%S', Number(this.x));
    const pointData = this.points ? this.points[0] : this.point;
    const oneMinuteInterval = 60 * 1000; // 1 minute interval in milliseconds
    let s = `<span>${date} `;

    if (this.points && this.points.length > 1) {
      const xLess = Number(this.x);
      const xMore = xLess + oneMinuteInterval * (this.points.length - 1);
      s += Highcharts.dateFormat('%H:%M:%S', xLess) + '-';
      s += Highcharts.dateFormat('%H:%M:%S', xMore) + '</span>';
    } else {
      s += Highcharts.dateFormat('%H:%M:%S', this.x as number) + '</span>';
    }
    s +=
      '<br/>' +
      measurementType +
      ' = ' +
      Math.round(Number(pointData.y)) +
      ' ' +
      unitSymbol;
    return s;
  },
  borderWidth: 0,
  style: {
    fontSize: '1.2rem',
    fontFamily: 'Roboto',
  },
});

const rangeSelectorOptions: RangeSelectorOptions = {
  buttonSpacing: 15,
  buttons: [
    {
      type: 'hour',
      count: 24,
      text: '24h',
    },
    {
      type: 'day',
      count: 7,
      text: '1 week',
    },
    {
      type: 'month',
      count: 1,
      text: '1m',
    },
    { type: 'all', text: 'All' },
  ],
  selected: 0,
  inputEnabled: false,
};

export {
  getXAxisOptions,
  plotOptions,
  titleOption,
  legendOption,
  responsive,
  seriesOptions,
  getYAxisOptions,
  getTooltipOptions,
  scrollbarOptions,
  rangeSelectorOptions,
  credits,
};
