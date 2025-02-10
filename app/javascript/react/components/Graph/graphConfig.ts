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
  green100,
  orange100,
  red100,
  white,
  yellow100,
} from "../../assets/styles/colors";
import {
  resetLastSelectedTimeRange,
  updateFixedMeasurementExtremes,
} from "../../store/fixedStreamSlice";
import { setHoverPosition, setHoverStreamId } from "../../store/mapSlice";
import {
  resetLastSelectedMobileTimeRange,
  updateMobileMeasurementExtremes,
} from "../../store/mobileStreamSlice";
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

type ChartWithRangeSelector = Highcharts.Chart & {
  rangeSelector?: {
    clickButton: (index: number, redraw?: boolean) => void;
  };
};

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

const TOLERANCE_UPPER = 60000; // 60 seconds tolerance

const getXAxisOptions = (
  isMobile: boolean,
  fixedSessionTypeSelected: boolean,
  dispatch: any,
  isLoading: boolean,
  fetchMeasurementsIfNeeded: (start: number, end: number) => Promise<void>,
  streamId: number | null,
  initialFetchedRangeRef: React.MutableRefObject<{
    start: number;
    end: number;
  } | null>,
  initialLoadRef: React.MutableRefObject<boolean>,
  onDayClick?: (date: Date | null) => void,
  rangeDisplayRef?: React.RefObject<HTMLDivElement>
): Highcharts.XAxisOptions => {
  let fetchTimeout: NodeJS.Timeout | null = null;

  const updateRangeDisplay = (min: number, max: number) => {
    if (!rangeDisplayRef?.current) return;

    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp);
      return {
        date: date.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
        time: date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      };
    };

    const minFormatted = formatDate(min);
    const maxFormatted = formatDate(max);

    const htmlContent = `
      <div class="time-container">
        <span class="date">${minFormatted.date}</span>
        <span class="time">${minFormatted.time}</span>
      </div>
      <span>-</span>
      <div class="time-container">
        <span class="date">${maxFormatted.date}</span>
        <span class="time">${maxFormatted.time}</span>
      </div>
    `;

    rangeDisplayRef.current.innerHTML = htmlContent;
  };

  const handleSetExtremes = debounce(
    async (
      e: Highcharts.AxisSetExtremesEventObject,
      chart: ChartWithRangeSelector
    ) => {
      if (e.min !== undefined && e.max !== undefined) {
        // Add padding to fetch more data than visible range
        const visibleRange = e.max - e.min;
        const padding = visibleRange * 0.5;
        const fetchStart = Math.max(0, e.min - padding);
        const fetchEnd = e.max + padding;

        if (e.trigger === "scrollbar" || e.trigger === "navigator") {
          // Reset any existing range selection and deselect day
          if (fixedSessionTypeSelected) {
            dispatch(resetLastSelectedTimeRange());
          } else {
            dispatch(resetLastSelectedMobileTimeRange());
          }
          onDayClick?.(null);

          try {
            await fetchMeasurementsIfNeeded(fetchStart, fetchEnd);

            // Get the current extremes after data fetch
            const currentExtremes = chart.xAxis[0].getExtremes();

            // Update the range display with current visible range
            updateRangeDisplay(
              currentExtremes.min || e.min,
              currentExtremes.max || e.max
            );

            // Update extremes in Redux
            if (fixedSessionTypeSelected && streamId !== null) {
              dispatch(
                updateFixedMeasurementExtremes({
                  streamId,
                  min: currentExtremes.min || e.min,
                  max: currentExtremes.max || e.max,
                })
              );
            } else {
              dispatch(
                updateMobileMeasurementExtremes({
                  min: currentExtremes.min || e.min,
                  max: currentExtremes.max || e.max,
                })
              );
            }
          } catch (error) {
            console.error("[getXAxisOptions] Error fetching data:", error);
          }
        } else if (e.trigger === "rangeSelectorButton") {
          // Deselect day when using range selector buttons
          onDayClick?.(null);

          try {
            await fetchMeasurementsIfNeeded(fetchStart, fetchEnd);

            // Get the current extremes after data fetch
            const currentExtremes = chart.xAxis[0].getExtremes();

            // Update the range display with current visible range
            updateRangeDisplay(
              currentExtremes.min || e.min,
              currentExtremes.max || e.max
            );

            // Update extremes in Redux
            if (fixedSessionTypeSelected && streamId !== null) {
              dispatch(
                updateFixedMeasurementExtremes({
                  streamId,
                  min: currentExtremes.min || e.min,
                  max: currentExtremes.max || e.max,
                })
              );
            } else {
              dispatch(
                updateMobileMeasurementExtremes({
                  min: currentExtremes.min || e.min,
                  max: currentExtremes.max || e.max,
                })
              );
            }
          } catch (error) {
            console.error("[getXAxisOptions] Error fetching data:", error);
          }
        } else {
          // Handle day selection and other cases
          try {
            await fetchMeasurementsIfNeeded(fetchStart, fetchEnd);

            // Get the current extremes after data fetch
            const currentExtremes = chart.xAxis[0].getExtremes();
            const selectedTime = currentExtremes.min || e.min;

            // Get the selected day's start and end
            const selectedDate = new Date(selectedTime);
            selectedDate.setHours(0, 0, 0, 0);
            const nextDate = new Date(selectedDate);
            nextDate.setDate(nextDate.getDate() + 1);

            // Check if this is the first or last day of total data range
            const isFirstDay =
              selectedDate.getTime() <= currentExtremes.dataMin;
            const isLastDay = nextDate.getTime() >= currentExtremes.dataMax;

            // Set time range for the selected day
            const startTime = isFirstDay
              ? currentExtremes.dataMin // Use actual start time for first day
              : selectedDate.getTime(); // Use midnight for other days
            const endTime = isLastDay
              ? currentExtremes.dataMax // Use actual end time for last day
              : nextDate.getTime(); // Use midnight of next day for other days

            // Update the range display
            updateRangeDisplay(startTime, endTime);

            // Update extremes in Redux
            if (fixedSessionTypeSelected && streamId !== null) {
              dispatch(
                updateFixedMeasurementExtremes({
                  streamId,
                  min: startTime,
                  max: endTime,
                })
              );
            } else {
              dispatch(
                updateMobileMeasurementExtremes({
                  min: startTime,
                  max: endTime,
                })
              );
            }
          } catch (error) {
            console.error("[getXAxisOptions] Error fetching data:", error);
          }
        }
      } else {
      }
    },
    100
  );

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
    events: {
      afterSetExtremes: function (e: Highcharts.AxisSetExtremesEventObject) {
        if (fetchTimeout) {
          clearTimeout(fetchTimeout);
        }
        fetchTimeout = setTimeout(() => {
          handleSetExtremes(e, this.chart);
        }, 250);
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
