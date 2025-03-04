import {
  AlignValue,
  ChartOptions,
  ChartZoomingOptions,
  NavigatorOptions,
  PlotOptions,
  RangeSelectorOptions,
  ResponsiveOptions,
  YAxisOptions,
} from "highcharts";

import Highcharts from "highcharts/highstock";
import { TFunction } from "i18next";
import {
  blue,
  disabledGraphButton,
  gray100,
  gray200,
  gray300,
  gray400,
  green100,
  orange100,
  red100,
  white,
  yellow100,
} from "../../assets/styles/colors";
import { setHoverPosition, setHoverStreamId } from "../../store/mapSlice";
import { LatLngLiteral } from "../../types/googleMaps";
import { GraphData, GraphPoint } from "../../types/graph";
import { Thresholds } from "../../types/thresholds";
import {
  MILLISECONDS_IN_A_5_MINUTES,
  MILLISECONDS_IN_A_DAY,
  MILLISECONDS_IN_A_MONTH,
  MILLISECONDS_IN_A_SECOND,
  MILLISECONDS_IN_A_WEEK,
  MILLISECONDS_IN_AN_HOUR,
} from "../../utils/timeRanges";
import { updateRangeDisplay } from "./chartHooks/updateRangeDisplay";

interface ChartWithRangeSelector extends Highcharts.Chart {
  rangeSelector?: {
    buttons?: Array<{
      setState: (state: number) => void;
      state?: number;
    }>;
    selected?: number;
  };
}

const getScrollbarOptions = (isCalendarPage: boolean, isMobile: boolean) => {
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
    rifleColor: gray200,
    zIndex: 3,
    margin: 0,
    minimumRange: MILLISECONDS_IN_A_SECOND,
  };
};

const getXAxisOptions = (
  isMobile: boolean,
  fixedSessionTypeSelected: boolean,
  dispatch: any,
  isLoading: boolean,
  fetchMeasurementsIfNeeded: (
    start: number,
    end: number,
    isEdgeFetch?: boolean,
    isDaySelection?: boolean,
    trigger?: string
  ) => Promise<void>,
  streamId: number | null,
  lastTriggerRef: React.MutableRefObject<string | null>,
  lastUpdateTimeRef: React.MutableRefObject<number>,
  onDayClick?: (timestamp: number | null) => void,
  rangeDisplayRef?: React.RefObject<HTMLDivElement>,
  sessionStartTime?: number,
  sessionEndTime?: number,
  isCalendarDaySelectedRef?: React.MutableRefObject<boolean>
): Highcharts.XAxisOptions => {
  let lastNavigatorEvent: Highcharts.AxisSetExtremesEventObject | null = null;
  let navigatorMouseUpHandler: ((event: MouseEvent) => void) | null = null;
  let touchEndHandler: ((event: TouchEvent) => void) | null = null;
  let cleanupTimeout: NodeJS.Timeout | null = null;
  let handled = false;
  let isHandlingCalendarDay = false;
  let mouseWheelTimeout: NodeJS.Timeout | null = null;
  let lastMouseWheelEvent: Highcharts.AxisSetExtremesEventObject | null = null;

  const removeEventHandlers = () => {
    if (navigatorMouseUpHandler) {
      window.removeEventListener("mouseup", navigatorMouseUpHandler, true);
      navigatorMouseUpHandler = null;
    }
    if (touchEndHandler) {
      window.removeEventListener("touchend", touchEndHandler, true);
      touchEndHandler = null;
    }
    if (cleanupTimeout) {
      clearTimeout(cleanupTimeout);
      cleanupTimeout = null;
    }
    lastNavigatorEvent = null;
  };

  const handleSetExtremes = async (
    e: Highcharts.AxisSetExtremesEventObject,
    chart: ChartWithRangeSelector
  ) => {
    const effectiveTrigger =
      e.trigger !== "none" ? e.trigger : lastTriggerRef.current || "none";

    if (isHandlingCalendarDay && effectiveTrigger !== "calendarDay") {
      return;
    }

    if (effectiveTrigger === "calendarDay") {
      isHandlingCalendarDay = true;
      setTimeout(() => {
        isHandlingCalendarDay = false;
      }, 500);

      lastTriggerRef.current = effectiveTrigger;
      lastUpdateTimeRef.current = Date.now();

      if (
        e.min !== undefined &&
        e.max !== undefined &&
        !isNaN(e.min) &&
        !isNaN(e.max)
      ) {
        updateRangeDisplay(rangeDisplayRef, e.min, e.max, true);
      }

      return;
    }

    if (effectiveTrigger === "mousewheel") {
      lastMouseWheelEvent = e;

      if (isCalendarDaySelectedRef?.current) {
        isCalendarDaySelectedRef.current = false;
        if (onDayClick) {
          onDayClick(null);
        }
      }

      lastTriggerRef.current = effectiveTrigger;
      lastUpdateTimeRef.current = Date.now();

      if (
        e.min !== undefined &&
        e.max !== undefined &&
        !isNaN(e.min) &&
        !isNaN(e.max)
      ) {
        updateRangeDisplay(rangeDisplayRef, e.min, e.max, false);
      }

      if (mouseWheelTimeout) {
        clearTimeout(mouseWheelTimeout);
      }

      mouseWheelTimeout = setTimeout(() => {
        if (lastMouseWheelEvent && streamId) {
          const visibleRange =
            lastMouseWheelEvent.max - lastMouseWheelEvent.min;
          const padding = visibleRange * 0.25;
          const now = Date.now();
          const fetchStart = Math.max(
            sessionStartTime || 0,
            lastMouseWheelEvent.min - padding
          );
          const fetchEnd = Math.min(
            sessionEndTime || now,
            lastMouseWheelEvent.max + padding
          );

          fetchMeasurementsIfNeeded(
            fetchStart,
            fetchEnd,
            false,
            false,
            "mousewheel"
          );
        }
        mouseWheelTimeout = null;
        lastMouseWheelEvent = null;
      }, 300);

      return;
    }

    lastTriggerRef.current = effectiveTrigger;
    lastUpdateTimeRef.current = Date.now();

    if (
      e.min !== undefined &&
      e.max !== undefined &&
      !isNaN(e.min) &&
      !isNaN(e.max)
    ) {
      updateRangeDisplay(
        rangeDisplayRef,
        e.min,
        e.max,
        effectiveTrigger === "calendarDay"
      );
    }

    if (
      streamId &&
      (effectiveTrigger === "rangeSelectorButton" ||
        effectiveTrigger === "pan" ||
        effectiveTrigger === "zoom" ||
        effectiveTrigger === "calendarDay" ||
        effectiveTrigger === "syncExtremes" ||
        effectiveTrigger === "navigator")
    ) {
      const visibleRange = e.max - e.min;
      const padding = visibleRange * 0.25;
      const now = Date.now();
      const fetchStart = Math.max(sessionStartTime || 0, e.min - padding);
      const fetchEnd = Math.min(sessionEndTime || now, e.max + padding);

      await fetchMeasurementsIfNeeded(
        fetchStart,
        fetchEnd,
        false,
        false,
        effectiveTrigger
      );
    }
  };

  return {
    title: { text: undefined },
    showEmpty: false,
    showLastLabel: !isMobile,
    tickColor: gray200,
    lineColor: white,
    type: "datetime",
    labels: {
      enabled: true,
      overflow: "justify",
      step: 1,
      style: { fontSize: "1.2rem", fontFamily: "Roboto" },
    },
    crosshair: { color: white, width: 2 },
    visible: true,
    minRange: MILLISECONDS_IN_A_SECOND,
    ordinal: false,
    min: fixedSessionTypeSelected ? sessionStartTime : null,
    max: fixedSessionTypeSelected ? sessionEndTime : null,
    events: {
      afterSetExtremes: function (e: Highcharts.AxisSetExtremesEventObject) {
        const chart = this.chart;
        const effectiveTrigger =
          e.trigger !== "none" ? e.trigger : lastTriggerRef.current || "none";

        if (isHandlingCalendarDay && effectiveTrigger !== "calendarDay") {
          return;
        }

        const rangeSelector = (chart as ChartWithRangeSelector).rangeSelector;
        if (effectiveTrigger === "mousewheel" && rangeSelector?.buttons) {
          rangeSelector.buttons.forEach((button) => {
            button.setState(0);
          });
        }

        if (effectiveTrigger !== "navigator") {
          removeEventHandlers();
          handleSetExtremes(
            { ...e, trigger: effectiveTrigger },
            chart as ChartWithRangeSelector
          );
          return;
        }

        lastNavigatorEvent = e;
        lastTriggerRef.current = "navigator";

        if (!navigatorMouseUpHandler && !touchEndHandler) {
          handled = false;
          const handleEnd = () => {
            if (handled) return;
            handled = true;
            if (lastNavigatorEvent && !isHandlingCalendarDay) {
              handleSetExtremes(
                lastNavigatorEvent,
                chart as ChartWithRangeSelector
              );
            }
            removeEventHandlers();
          };

          removeEventHandlers();

          navigatorMouseUpHandler = handleEnd;
          touchEndHandler = handleEnd;

          window.addEventListener("mouseup", navigatorMouseUpHandler, true);
          window.addEventListener("touchend", touchEndHandler, true);

          cleanupTimeout = setTimeout(() => {
            handleEnd();
          }, 8000);
        }
      },
    },
  };
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

  const tickInterval = (max - min) / 4;

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
        color: green100,
      },
      {
        from: low,
        to: middle,
        color: yellow100,
      },
      {
        from: middle,
        to: high,
        color: orange100,
      },
      {
        from: high,
        to: max,
        color: red100,
      },
    ],
  };
};

const getPlotOptions = (
  fixedSessionTypeSelected: boolean,
  streamId: number | null,
  dispatch: any,
  isIndoorParameterInUrl: boolean,
  isGovData: boolean
): PlotOptions => {
  const handleMouseOver = function (this: Highcharts.Point) {
    if (!isIndoorParameterInUrl) {
      const position: LatLngLiteral = (this as GraphPoint).position;
      if (fixedSessionTypeSelected) {
        dispatch(setHoverStreamId(streamId));
      } else {
        dispatch(setHoverPosition(position));
      }
    }
  };

  const handleMouseOut = () => {
    if (!isIndoorParameterInUrl) {
      dispatch(setHoverStreamId(null));
      dispatch(setHoverPosition({ lat: 0, lng: 0 }));
    }
  };

  return {
    series: {
      lineWidth: 2,
      color: blue,
      turboThreshold: 9999999,

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
        units: isGovData
          ? [
              ["hour", [1, 2, 3, 4, 6, 8, 12]],
              ["day", [1]],
            ]
          : [
              ["millisecond", []],
              ["second", [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40, 50]],
              ["minute", [1, 2, 3, 4, 5]],
            ],
        approximation: "average",
      },

      point: {
        events: {
          mouseOver: handleMouseOver,
          mouseOut: handleMouseOut,
        },
      },
    },
  };
};

const seriesOptions = (data: GraphData): Highcharts.SeriesSplineOptions => ({
  type: "spline",
  color: white,
  data: data as Array<[number, number]>,
});

const legendOption = {
  enabled: false,
};

const getResponsiveOptions = (
  thresholdsState: Thresholds,
  isMobile: boolean
): ResponsiveOptions => {
  return {
    rules: [
      {
        condition: {
          maxWidth: 1024,
        },
        chartOptions: {
          yAxis: getYAxisOptions(thresholdsState, isMobile),
          credits: {
            enabled: false,
          },
        },
      },
    ],
  };
};
const getTooltipOptions = (
  measurementType: string,
  unitSymbol: string
): Highcharts.TooltipOptions => ({
  enabled: true,
  formatter: function (this: Highcharts.TooltipFormatterContextObject): string {
    const dateStr = Highcharts.dateFormat("%m/%d/%Y", Number(this.x));
    let s = `<span>${dateStr} `;

    const pointData = this.points ? this.points[0] : this.point;
    const point = pointData as any;
    const series = point.series;

    if (series.hasGroupedData && series.currentDataGrouping) {
      if (series.currentDataGrouping.count === 1) {
        s += Highcharts.dateFormat("%H:%M:%S", point.x) + "</span>";
      } else {
        const groupingInfo = series.currentDataGrouping;
        const groupingDiff = groupingInfo.totalRange;
        const xLess = point.x;
        const xMore = point.x + groupingDiff;
        s += Highcharts.dateFormat("%H:%M:%S", xLess) + "-";
        s += Highcharts.dateFormat("%H:%M:%S", xMore - 1000) + "</span>";
      }
    } else {
      s += Highcharts.dateFormat("%H:%M:%S", point.x) + "</span>";
    }

    s +=
      "<br/>" +
      measurementType +
      " = " +
      Math.round(pointData.y || 0) +
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
  isMobile: boolean,
  fixedSessionTypeSelected: boolean,
  totalDuration: number,
  selectedRange: number,
  isCalendarPage: boolean,
  t: TFunction<"translation", undefined>
): RangeSelectorOptions => {
  const baseMobileCalendarOptions: RangeSelectorOptions = {
    enabled: true,
    buttonPosition: {
      align: "center" as AlignValue,
      y: -85,
    },
    buttonTheme: {
      fill: "none",
      width: 80,
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
          totalDuration < MILLISECONDS_IN_A_DAY
            ? { type: "all", text: t("graph.24Hours") }
            : { type: "hour", count: 24 - 0, text: t("graph.24Hours") },
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

const getChartOptions = (
  isCalendarPage: boolean,
  isMobile: boolean
): ChartOptions => {
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

const getNavigatorOptions = (): NavigatorOptions => {
  return {
    enabled: true,
    height: 0,
  };
};

export {
  getChartOptions,
  getNavigatorOptions,
  getPlotOptions,
  getRangeSelectorOptions,
  getResponsiveOptions,
  getScrollbarOptions,
  getTooltipOptions,
  getXAxisOptions,
  getYAxisOptions,
  legendOption,
  seriesOptions,
};
