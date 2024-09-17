import Highcharts, {
  AlignValue,
  chart,
  ChartZoomingOptions,
  RangeSelectorOptions,
  ResponsiveOptions,
} from "highcharts";
import {
  LegendOptions,
  PlotOptions,
  SeriesOptionsType,
  TitleOptions,
  XAxisOptions,
  YAxisOptions,
} from "highcharts/highstock";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";

import {
  blue,
  disabledGraphButton,
  gray100,
  gray200,
  gray300,
  gray400,
  green,
  orange,
  red,
  white,
  yellow,
} from "../../assets/styles/colors";
import {
  selectIsLoading,
  updateFixedMeasurementExtremes,
} from "../../store/fixedStreamSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setHoverPosition, setHoverStreamId } from "../../store/mapSlice";
import { LatLngLiteral } from "../../types/googleMaps";
import { GraphData, GraphPoint } from "../../types/graph";
import { Thresholds } from "../../types/thresholds";
import {
  MILLISECONDS_IN_A_5_MINUTES,
  MILLISECONDS_IN_A_DAY,
  MILLISECONDS_IN_A_MONTH,
  MILLISECONDS_IN_A_WEEK,
  MILLISECONDS_IN_AN_HOUR,
} from "../../utils/timeRanges";

import { RefObject } from "react";
import { TRUE } from "../../const/booleans";
import { updateMobileMeasurementExtremes } from "../../store/mobileStreamSlice";
import { useMapParams } from "../../utils/mapParamsHandler";
import { formatTimeExtremes } from "../../utils/measurementsCalc";
import useMobileDetection from "../../utils/useScreenSizeDetection";

const getScrollbarOptions = (isCalendarPage: boolean) => {
  const isMobile = useMobileDetection();
  return {
    barBackgroundColor: gray200,
    barBorderWidth: 0,
    button: {
      enabled: false,
    },
    height: isMobile ? 16 : 8,
    trackBackgroundColor: gray100,
    trackBorderWidth: 0,
    autoHide: false,
    showFull: true,
    enabled: isMobile && isCalendarPage ? true : !isMobile,
    liveRedraw: true,
    minWidth: isMobile ? 30 : 8,
  };
};

const getXAxisOptions = (
  isMobile: boolean = false,
  rangeDisplayRef: RefObject<HTMLDivElement> | undefined,
  fixedSessionTypeSelected: boolean
): XAxisOptions => {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectIsLoading);

  const handleSetExtremes = debounce(
    (e: Highcharts.AxisSetExtremesEventObject) => {
      const { isIndoor } = useMapParams();
      if (isIndoor === TRUE) {
        if (!chart || Object.keys(chart).length === 0) return;
      }
      if (!isLoading && e.min && e.max) {
        dispatch(
          fixedSessionTypeSelected
            ? updateFixedMeasurementExtremes({ min: e.min, max: e.max })
            : updateMobileMeasurementExtremes({ min: e.min, max: e.max })
        );

        const { formattedMinTime, formattedMaxTime } = formatTimeExtremes(
          e.min,
          e.max
        );

        // Dirty workaround to update timerange display in the graph
        if (rangeDisplayRef?.current) {
          rangeDisplayRef.current.innerHTML = `
              <div class="time-container">
                <span class="date">${formattedMinTime.date ?? ""}</span>
                <span class="time">${formattedMinTime.time ?? ""}</span>
              </div>
              <span>-</span>
              <div class="time-container">
                <span class="date">${formattedMaxTime.date ?? ""}</span>
                <span class="time">${formattedMaxTime.time ?? ""}</span>
              </div>
          `;
        }
      }
    },
    100
  );

  return {
    title: {
      text: undefined,
    },
    showLastLabel: isMobile ? false : true,
    tickColor: gray200,
    lineColor: white,
    type: "datetime",
    labels: {
      enabled: true,
      overflow: "justify",
      step: 1,
      style: {
        fontSize: "1.2rem",
        fontFamily: "Roboto",
      },
    },
    crosshair: {
      color: white,
      width: 2,
    },
    visible: true,
    minRange: 10000,
    ordinal: false,
    events: {
      afterSetExtremes: function (e) {
        handleSetExtremes(e);
      },
    },
  };
};

const buildTicks = (low: number, high: number) => {
  const tick = Math.round((high - low) / 4);
  return [low, low + tick, low + 2 * tick, high - tick, high];
};

const getYAxisOptions = (
  thresholdsState: Thresholds,
  isMobile: boolean = false
): YAxisOptions => {
  const min = Number(thresholdsState.min);
  const max = Number(thresholdsState.max);
  const low = Number(thresholdsState.low);
  const middle = Number(thresholdsState.middle);
  const high = Number(thresholdsState.high);

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
    tickLength: isMobile ? 0 : 25,
    minorGridLineWidth: 0,
    showLastLabel: true,
    tickInterval: tickInterval,
    tickPosition: "inside",
    offset: isMobile ? 0 : 25,
    labels: {
      enabled: true,
      style: {
        fontFamily: "Roboto",
        fontSize: "1.2rem",
        align: "right",
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

const getPlotOptions = (
  fixedSessionTypeSelected: boolean,
  streamId: number | null
): PlotOptions => {
  const dispatch = useAppDispatch();
  const { isIndoor } = useMapParams();

  const isIndoorParameterInUrl = isIndoor === TRUE;
  return {
    series: {
      lineWidth: 2,
      color: blue,
      turboThreshold: 9999999, //above that graph will not display,
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
              "stroke-width": 2,
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
      point: {
        events: {
          mouseOver: function (this: Highcharts.Point) {
            if (!isIndoorParameterInUrl) {
              const position: LatLngLiteral = (this as GraphPoint).position;
              if (fixedSessionTypeSelected) {
                dispatch(setHoverStreamId(streamId));
              } else {
                dispatch(setHoverPosition(position));
              }
            }
          },
          mouseOut: function () {
            if (!isIndoorParameterInUrl) {
              dispatch(setHoverStreamId(null));
              dispatch(setHoverPosition({ lat: 0, lng: 0 }));
            }
          },
        },
      },
    },
  };
};

const seriesOptions = (data: GraphData): SeriesOptionsType => ({
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

const getResponsiveOptions = (
  thresholdsState: Thresholds
): ResponsiveOptions => {
  return {
    rules: [
      {
        condition: {
          maxWidth: 1024,
        },
        chartOptions: {
          yAxis: getYAxisOptions(thresholdsState, true),
          credits: {
            enabled: false,
          },
        },
      },
    ],
  };
};

const getTooltipOptions = (measurementType: string, unitSymbol: string) => ({
  enabled: true,
  formatter: function (this: Highcharts.TooltipFormatterContextObject): string {
    const date = Highcharts.dateFormat("%m/%d/%Y", Number(this.x));
    const time = Highcharts.dateFormat("%H:%M:%S", Number(this.x));
    const pointData = this.points ? this.points[0] : this.point;
    const oneMinuteInterval = 60 * 1000;
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

const getRangeSelectorOptions = (
  fixedSessionTypeSelected: boolean,
  totalDuration: number,
  selectedRange?: number,
  isCalendarPage: boolean = false
): RangeSelectorOptions => {
  const { t } = useTranslation();
  const isMobile = useMobileDetection();

  const baseMobileCalendarOptions: RangeSelectorOptions = {
    enabled: true,
    buttonPosition: {
      align: "center" as AlignValue,
      y: -85,
    },
    buttonTheme: {
      fill: "none",
      width: 95,
      height: 34,
      r: 20,
      stroke: "none",
      "stroke-width": 1,
      style: {
        fontFamily: "Roboto, sans-serif",
        fontSize: "1.4rem",
        color: gray300,
        fontWeight: "regular",
      },

      states: {
        hover: {
          fill: blue,
          style: {
            color: white,
          },
        },

        select: {
          fill: blue,
          style: {
            color: white,
            fontWeight: "bold",
          },
        },

        disabled: {
          style: {
            color: disabledGraphButton,
            cursor: "default",
          },
        },
      },
    },
    labelStyle: {
      display: "none",
    },
    buttonSpacing: 10,
    inputEnabled: false,
  };
  const baseOptions: RangeSelectorOptions = {
    enabled: isMobile ? false : true,
    buttonPosition: {
      align: "right" as AlignValue,
      x: -32,
      y: 50,
    },
    buttonTheme: {
      fill: "rgba(255, 255, 255, 0.8)",
      width: 90,
      r: 5,
      style: {
        fontFamily: "Roboto, sans-serif",
        fontSize: "1.4rem",
        color: gray300,
        fontWeight: "regular",
      },
      states: {
        hover: {
          fill: white,
          style: {
            color: gray400,
            fontWeight: "regular",
          },
        },
        select: {
          fill: white,
          style: {
            color: gray400,
            fontWeight: "regular",
          },
        },
      },
    },
    labelStyle: {
      display: "none",
    },
    buttonSpacing: 10,
    inputEnabled: false,
  };

  if (isCalendarPage && isMobile) {
    return {
      ...baseMobileCalendarOptions,
      buttons: [
        { type: "hour", count: 24, text: t("graph.24Hours") },
        totalDuration > MILLISECONDS_IN_A_WEEK
          ? { type: "day", count: 7, text: t("graph.oneWeek") }
          : { type: "all", text: t("graph.oneWeek") },
        totalDuration > MILLISECONDS_IN_A_MONTH
          ? { type: "week", count: 4, text: t("graph.oneMonth") }
          : { type: "all", text: t("graph.oneMonth") },
      ],
      allButtonsEnabled: true,
      selected: selectedRange,
    };
  } else {
    if (fixedSessionTypeSelected) {
      return {
        ...baseOptions,
        buttons: [
          // { type: "hour", count: 24, text: t("graph.24Hours") },
          totalDuration < MILLISECONDS_IN_A_DAY
            ? { type: "all", text: t("graph.24Hours") }
            : { type: "hour", count: 24, text: t("graph.24Hours") },
          totalDuration > MILLISECONDS_IN_A_WEEK
            ? { type: "day", count: 7, text: t("graph.oneWeek") }
            : { type: "all", text: t("graph.oneWeek") },
          totalDuration > MILLISECONDS_IN_A_MONTH
            ? { type: "week", count: 4, text: t("graph.oneMonth") }
            : { type: "all", text: t("graph.oneMonth") },
        ],
        allButtonsEnabled: true,
        selected: selectedRange,
      };
    } else {
      return {
        ...baseOptions,
        buttons: [
          totalDuration < MILLISECONDS_IN_A_5_MINUTES
            ? { type: "all", text: t("graph.fiveMinutes") }
            : { type: "minute", count: 5, text: t("graph.fiveMinutes") },
          totalDuration < MILLISECONDS_IN_AN_HOUR
            ? { type: "all", text: t("graph.oneHour") }
            : { type: "minute", count: 60, text: t("graph.oneHour") },
          { type: "all", text: t("graph.all") },
        ],
        allButtonsEnabled: true,
        selected: selectedRange,
      };
    }
  }
};

const getChartOptions = (isCalendarPage: boolean): Highcharts.ChartOptions => {
  const isMobile = useMobileDetection();
  const zoomingConfig: ChartZoomingOptions = {
    type: "x",
    resetButton: { theme: { style: { display: "none" } } },
  };

  const chartHeight = isCalendarPage || !isMobile ? 300 : 150;

  const chartMargin = isMobile
    ? isCalendarPage
      ? [5, 10, 5, 0]
      : [5, 0, 5, 0]
    : isCalendarPage
    ? [0, 30, 5, 0]
    : [0, 60, 5, 0];

  const scrollablePlotAreaConfig = { minWidth: 100, scrollPositionX: 1 };

  return {
    zooming: zoomingConfig,
    height: chartHeight,
    margin: chartMargin,
    animation: false,
    scrollablePlotArea: scrollablePlotAreaConfig,
  };
};

export {
  getChartOptions,
  getPlotOptions,
  getRangeSelectorOptions,
  getResponsiveOptions,
  getScrollbarOptions,
  getTooltipOptions,
  getXAxisOptions,
  getYAxisOptions,
  legendOption,
  seriesOptions,
  titleOption,
};
