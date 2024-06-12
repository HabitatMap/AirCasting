import {
  XAxisOptions,
  YAxisOptions,
  PlotOptions,
  TitleOptions,
  LegendOptions,
  SeriesOptionsType,
  TooltipFormatterContextObject
} from 'highcharts/highstock';
import Highcharts, { CreditsOptions, RangeSelectorOptions } from 'highcharts';
import { ThresholdState } from '../../store/thresholdSlice';

import { green, orange, red, yellow, white, gray200, gray400, blue, black, gray100, gray300 } from '../../assets/styles/colors';
import { selectIsLoading, updateFixedMeasurementExtremes } from '../../store/fixedStreamSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateMobileMeasurementExtremes } from '../../store/mobileStreamSlice';
import { size } from 'lodash';

const scrollbarOptions = {
  barBackgroundColor: gray200,
  barBorderRadius: 7,
  barBorderWidth: 0,
  buttonBackgroundColor: gray200,
  buttonBorderColor: gray100,
  buttonArrowColor: gray300,
  buttonsEnabled: true,
  buttonBorderWidth: 4,
  buttonBorderRadius: 4,
  height: 8,
  trackBackgroundColor: gray100,
  trackBorderWidth: 0,
  showFull: false,
  enabled: true,
};

const getXAxisOptions = (fixedSessionTypeSelected: boolean): XAxisOptions => {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectIsLoading);

  const handleSetExtremes = (e: Highcharts.AxisSetExtremesEventObject) => {
    if (!isLoading) {
      const min = e.min;
      const max = e.max;
      dispatch(fixedSessionTypeSelected ? updateFixedMeasurementExtremes({ min, max }) : updateMobileMeasurementExtremes({ min, max }));
    }
  };

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

const buildTicks = (low: number, high: number) => {
  const tick =  Math.round((high - low) / 4);
  return [low, low + tick, low + 2 * tick, high - tick, high];
}

const getYAxisOptions = (thresholdsState: ThresholdState): YAxisOptions => {
  const min = Number(thresholdsState.min);
  const max = Number(thresholdsState.max);
  const low = Number(thresholdsState.low);
  const middle = Number(thresholdsState.middle);
  const high = Number(thresholdsState.high);

  ;
const ticks = buildTicks(min, max);
const tickInterval = ticks[1] - ticks[0];

  return {
    title: {
      text: undefined,
    },
    endOnTick: false,
    startOnTick: true,
    tickColor: gray200,
    lineColor: white,
    opposite: true,
    tickWidth: 1,
    tickLength: 25,
    minorGridLineWidth: 0,
    showLastLabel: true,
    tickInterval: tickInterval,
    tickPosition: "inside",
    offset: 25,
    labels: {
      enabled: true,
      style: {
        fontFamily: 'Roboto',
        fontSize: '1.2rem',
        align: 'right',
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

const credits: CreditsOptions = {
  enabled: true,
  position: { align: 'right', verticalAlign: 'top', x: -50, y: 55 },
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
    const oneMinuteInterval = 60 * 1000;
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

const getRangeSelectorOptions = (fixedSessionTypeSelected: boolean): RangeSelectorOptions => (
  fixedSessionTypeSelected ? {

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
} : {

  buttonSpacing: 15,
  buttons: [
    {
      type: 'minute',
      count: 1,
      text: '1min',
    },
    {
      type: 'minute',
      count: 5,
      text: '5min',
    },
    {
      type: 'minute',
      count: 30,
      text: '30min',
    },
    {
      type: 'hour',
      count: 1,
      text: '1h',
    },
    {
      type: 'hour',
      count: 12,
      text: '12h',
    },
    { type: 'all', text: 'All' },
  ],
  selected: 0,
  inputEnabled: false,
});

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
  getRangeSelectorOptions,
  credits,
};
