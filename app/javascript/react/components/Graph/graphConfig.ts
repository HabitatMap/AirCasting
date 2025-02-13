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
import { updateFixedMeasurementExtremes } from "../../store/fixedStreamSlice";
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
    isEdgeFetch?: boolean
  ) => Promise<void>,
  streamId: number | null,
  lastTriggerRef: React.MutableRefObject<string | null>,
  lastUpdateTimeRef: React.MutableRefObject<number>,
  onDayClick?: (date: Date | null) => void,
  rangeDisplayRef?: React.RefObject<HTMLDivElement>,
  sessionStartTime?: number,
  sessionEndTime?: number
): Highcharts.XAxisOptions => {
  let isFetching = false;
  let lastNavigatorEvent: Highcharts.AxisSetExtremesEventObject | null = null;
  let navigatorMouseUpHandler: ((event: MouseEvent) => void) | null = null;

  // Persist a timestamp and flag for rangeSelector clicks.
  let rangeSelectorActive = false;
  const lastRangeSelectorTimeRef = { current: 0 };
  const THRESHOLD = 1000; // 1000ms threshold

  const removeNavigatorMouseUpHandler = () => {
    if (navigatorMouseUpHandler) {
      document.removeEventListener("mouseup", navigatorMouseUpHandler);
      navigatorMouseUpHandler = null;
    }
    lastNavigatorEvent = null;
    console.log("[removeNavigatorMouseUpHandler] Cleared navigator handler.");
  };

  const handleSetExtremes = async (
    e: Highcharts.AxisSetExtremesEventObject,
    chart: Highcharts.Chart
  ) => {
    console.log("[handleSetExtremes] Received event:", e);

    // Compute effective trigger.
    let effectiveTrigger = e.trigger || lastTriggerRef.current || "";

    // If this event comes explicitly from a rangeSelectorButton, mark it active.
    if (e.trigger === "rangeSelectorButton") {
      lastRangeSelectorTimeRef.current = Date.now();
      rangeSelectorActive = true;
      effectiveTrigger = "rangeSelectorButton";
      lastTriggerRef.current = "rangeSelectorButton";
      console.log(
        "[handleSetExtremes] RangeSelectorButton click detected. Flag set."
      );
    }
    // If this event is a calendar day selection, process it as such.
    else if (e.trigger === "calendarDay") {
      // Clear any rangeSelectorActive flag.
      rangeSelectorActive = false;
      effectiveTrigger = "calendarDay";
      lastTriggerRef.current = "calendarDay";
      console.log("[handleSetExtremes] CalendarDay event detected.");
    }
    // For navigator (or empty) events, if a rangeSelector click occurred very recently and last trigger wasn't calendarDay, force the trigger.
    else if ((e.trigger === "navigator" || !e.trigger) && rangeSelectorActive) {
      const elapsed = Date.now() - lastRangeSelectorTimeRef.current;
      if (elapsed < THRESHOLD) {
        // Only force if the last explicit trigger wasn’t calendarDay.
        if (lastTriggerRef.current !== "calendarDay") {
          effectiveTrigger = "rangeSelectorButton";
          console.log(
            "[handleSetExtremes] Forcing effective trigger to 'rangeSelectorButton' (elapsed:",
            elapsed,
            "ms)"
          );
        }
      } else {
        rangeSelectorActive = false;
        console.log(
          "[handleSetExtremes] Clearing rangeSelectorActive (elapsed:",
          elapsed,
          "ms)"
        );
      }
    } else if (e.trigger) {
      lastTriggerRef.current = e.trigger;
    }

    console.log("[handleSetExtremes] Effective trigger:", effectiveTrigger);
    lastUpdateTimeRef.current = Date.now();
    console.log(
      "[handleSetExtremes] Updated lastUpdateTimeRef:",
      lastUpdateTimeRef.current
    );

    // For pan/zoom/navigator/rangeSelector events, clear any selected day.
    if (
      effectiveTrigger === "pan" ||
      effectiveTrigger === "zoom" ||
      effectiveTrigger === "navigator" ||
      effectiveTrigger === "rangeSelectorButton"
    ) {
      console.log(
        "[handleSetExtremes] Clearing day selection due to trigger:",
        effectiveTrigger
      );
      onDayClick?.(null);
    }

    // If a rangeSelectorButton event is missing extremes, use the current ones.
    if (
      (e.min === undefined ||
        e.max === undefined ||
        isNaN(e.min) ||
        isNaN(e.max)) &&
      effectiveTrigger === "rangeSelectorButton"
    ) {
      const currentExtremes = chart.xAxis[0].getExtremes();
      console.log(
        "[handleSetExtremes] Missing min/max; using current extremes:",
        currentExtremes
      );
      e.min = currentExtremes.min;
      e.max = currentExtremes.max;
    }

    if (
      e.min === undefined ||
      e.max === undefined ||
      isNaN(e.min) ||
      isNaN(e.max)
    ) {
      console.log("[handleSetExtremes] Invalid extremes; exiting.");
      return;
    }

    console.log(
      "[handleSetExtremes] Updating range display with min:",
      e.min,
      "max:",
      e.max
    );
    updateRangeDisplay(rangeDisplayRef, e.min, e.max, e.trigger === undefined);

    if (streamId) {
      console.log(
        "[handleSetExtremes] Dispatching updateFixedMeasurementExtremes with:",
        {
          streamId,
          min: e.min,
          max: e.max,
        }
      );
      dispatch(
        updateFixedMeasurementExtremes({
          streamId,
          min: e.min,
          max: e.max,
        })
      );
    }

    if (
      streamId &&
      fixedSessionTypeSelected &&
      (effectiveTrigger === "rangeSelectorButton" ||
        effectiveTrigger === "navigator" ||
        effectiveTrigger === "pan" ||
        effectiveTrigger === "zoom" ||
        effectiveTrigger === "calendarDay")
    ) {
      dispatch(
        updateFixedMeasurementExtremes({
          streamId,
          min: e.min,
          max: e.max,
        })
      );

      const visibleRange = e.max - e.min;
      const padding = visibleRange * 0.25;
      const now = Date.now();
      const fetchStart = Math.max(sessionStartTime || 0, e.min - padding);
      const fetchEnd = Math.min(sessionEndTime || now, e.max + padding);

      console.log("[handleSetExtremes] Fetch parameters calculated:", {
        fetchStart,
        fetchEnd,
        sessionStartTime,
        sessionEndTime,
        padding,
      });

      isFetching = true;
      try {
        console.log("[handleSetExtremes] Fetching data...");
        await fetchMeasurementsIfNeeded(fetchStart, fetchEnd);
        console.log("[handleSetExtremes] Data fetched successfully.");
      } catch (error) {
        console.error("[handleSetExtremes] Error during data fetch:", error);
      } finally {
        isFetching = false;
        console.log("[handleSetExtremes] isFetching set to false.");
      }
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
    min: sessionStartTime,
    max: sessionEndTime,
    events: {
      afterSetExtremes: function (e: Highcharts.AxisSetExtremesEventObject) {
        const chart = this.chart;
        console.log("[afterSetExtremes] Event received:", e);
        if (e.trigger !== "navigator") {
          console.log(
            "[afterSetExtremes] Non-navigator event. Processing immediately."
          );
          removeNavigatorMouseUpHandler();
          handleSetExtremes(e, chart);
          return;
        }
        console.log(
          "[afterSetExtremes] Navigator event received; storing event and setting mouseup handler."
        );
        lastNavigatorEvent = e;
        if (!navigatorMouseUpHandler) {
          navigatorMouseUpHandler = (event: MouseEvent) => {
            console.log("[navigatorMouseUpHandler] Mouse up event:", event);
            if (lastNavigatorEvent && !isFetching) {
              console.log(
                "[navigatorMouseUpHandler] Processing stored navigator event."
              );
              handleSetExtremes(lastNavigatorEvent, chart);
            }
            removeNavigatorMouseUpHandler();
          };
          document.addEventListener("mouseup", navigatorMouseUpHandler);
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
  isIndoorParameterInUrl: boolean
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
      turboThreshold: 9999999, // above that graph will not display

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
        approximation: "average",
        groupPixelWidth: 5,
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
  tooltip: {
    valueDecimals: 2,
  },
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
    const date = Highcharts.dateFormat("%m/%d/%Y", Number(this.x));
    const time = Highcharts.dateFormat("%H:%M:%S", Number(this.x));
    const pointData = this.points ? this.points[0] : this.point;
    let s = `<span>${date} `;
    s += Highcharts.dateFormat("%H:%M:%S", this.x as number) + "</span>";
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
  isMobile: boolean,
  fixedSessionTypeSelected: boolean,
  totalDuration: number,
  selectedRange: number,
  isCalendarPage: boolean,
  t: TFunction<"translation", undefined>
): RangeSelectorOptions => {
  console.log("[getRangeSelectorOptions] Config:", {
    isMobile,
    fixedSessionTypeSelected,
    totalDuration,
    selectedRange,
    isCalendarPage,
  });

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
  // The navigator is not visible in the graph component.
  // However it is important to keep it to make sure that scrollbar will not disapear forever while fetching data.
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
