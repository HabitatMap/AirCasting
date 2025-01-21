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
import { debounce } from "lodash";

import Highcharts from "highcharts/highstock";
import { TFunction } from "i18next";
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
import { AppDispatch } from "../../store";
import { updateFixedMeasurementExtremes } from "../../store/fixedStreamSlice";
import { setHoverPosition, setHoverStreamId } from "../../store/mapSlice";
import { updateMobileMeasurementExtremes } from "../../store/mobileStreamSlice";
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
import {
  generateTimeRangeHTML,
  updateRangeDisplayDOM,
} from "./chartHooks/useChartUpdater";

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
  };
};
const getXAxisOptions = (
  isMobile: boolean,
  rangeDisplayRef: React.RefObject<HTMLDivElement> | undefined,
  fixedSessionTypeSelected: boolean,
  dispatch: AppDispatch,
  isLoading: boolean,
  fetchMeasurementsIfNeeded: (start: number, end: number) => Promise<void>,
  streamId: number | null,
  savedTimeRanges: Array<{ start: number; end: number }>
): Highcharts.XAxisOptions => {
  let isFetchingData = false;
  let initialDataMin: number | null = null;
  let isFirstLoad = true;

  const handleSetExtremes = debounce(
    async (e: Highcharts.AxisSetExtremesEventObject) => {
      console.log("handleSetExtremes called:", {
        min: new Date(e.min || 0),
        max: new Date(e.max || 0),
        trigger: e.trigger,
        dataMin: e.dataMin,
        dataMax: e.dataMax,
      });

      if (!isLoading && e.min !== undefined && e.max !== undefined) {
        // Check if we need to fetch data for this range
        if (
          fixedSessionTypeSelected &&
          streamId &&
          e.trigger === "rangeSelectorButton"
        ) {
          const hasData = savedTimeRanges.some(
            (range) => range.start <= e.min! && range.end >= e.max!
          );

          console.log("Checking data availability:", {
            hasData,
            min: new Date(e.min),
            max: new Date(e.max),
            savedTimeRanges: savedTimeRanges.map((range) => ({
              start: new Date(range.start),
              end: new Date(range.end),
            })),
          });

          if (!hasData && !isFetchingData) {
            console.log("Fetching data for range selector");
            isFetchingData = true;
            try {
              await fetchMeasurementsIfNeeded(e.min, e.max);
            } finally {
              isFetchingData = false;
            }
          }
        }

        if (fixedSessionTypeSelected && streamId !== null) {
          dispatch(
            updateFixedMeasurementExtremes({
              streamId,
              min: e.min,
              max: e.max,
            })
          );
        } else {
          dispatch(
            updateMobileMeasurementExtremes({
              min: e.min,
              max: e.max,
            })
          );
        }

        if (rangeDisplayRef?.current) {
          const htmlContent = generateTimeRangeHTML(e.min, e.max);
          updateRangeDisplayDOM(rangeDisplayRef.current, htmlContent, true);
        }
      }
    },
    300
  );

  const onScrollbarRelease = debounce(async (axis: Highcharts.Axis) => {
    if (isLoading || isFetchingData) return;
    const { min, max, dataMin } = axis.getExtremes();
    if (min === undefined || max === undefined || dataMin === undefined) return;

    const buffer = (max - min) * 0.02;
    const isAtDataMin = min <= dataMin + buffer;
    if (isAtDataMin) {
      isFetchingData = true;
      try {
        const newStart = min - MILLISECONDS_IN_A_MONTH;
        await fetchMeasurementsIfNeeded(newStart, min);
      } finally {
        isFetchingData = false;
      }
    }
  }, 800);

  return {
    title: {
      text: undefined,
    },
    showEmpty: false,
    showLastLabel: !isMobile,
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
    minRange: MILLISECONDS_IN_A_SECOND,
    ordinal: false,
    events: {
      afterSetExtremes: async function (
        e: Highcharts.AxisSetExtremesEventObject
      ) {
        handleSetExtremes(e);

        if (initialDataMin === null && e.dataMin !== undefined) {
          initialDataMin = e.dataMin - MILLISECONDS_IN_A_MONTH;
        }

        if (isFirstLoad && !e.trigger?.includes("scrollbar")) {
          isFirstLoad = false;
          return;
        }

        if (
          !fixedSessionTypeSelected ||
          !streamId ||
          isLoading ||
          isFetchingData
        )
          return;

        if (e.min !== undefined && e.max !== undefined) {
          const minDate = new Date(e.min);
          const maxDate = new Date(e.max);

          // Get month range
          const monthStart = new Date(
            minDate.getFullYear(),
            minDate.getMonth(),
            1,
            0,
            0,
            0,
            0
          ).getTime();

          const monthEnd = new Date(
            maxDate.getFullYear(),
            maxDate.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          ).getTime();

          // Check if we're at the data edge
          const { dataMin } = this.getExtremes();
          const isAtDataEdge = e.min <= dataMin + (e.max - e.min) * 0.1; // Within 10% of the edge

          if (isAtDataEdge) {
            // Fetch an additional month before the current view
            const prevMonthStart = new Date(
              minDate.getFullYear(),
              minDate.getMonth() - 1,
              1,
              0,
              0,
              0,
              0
            ).getTime();

            const hasData = savedTimeRanges.some(
              (range) => range.start <= prevMonthStart && range.end >= monthEnd
            );

            if (!hasData) {
              isFetchingData = true;
              try {
                await fetchMeasurementsIfNeeded(prevMonthStart, monthEnd);
              } finally {
                isFetchingData = false;
              }
            }
          } else {
            // Normal range check
            const hasData = savedTimeRanges.some(
              (range) => range.start <= monthStart && range.end >= monthEnd
            );

            if (!hasData) {
              isFetchingData = true;
              try {
                await fetchMeasurementsIfNeeded(monthStart, monthEnd);
              } finally {
                isFetchingData = false;
              }
            }
          }
        }

        // Call onScrollbarRelease after each extreme change
        onScrollbarRelease(this);
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

const seriesOptions = (data: GraphData) => ({
  type: "spline",
  color: white,
  data: data,
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
