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
import { generateTimeRangeHTML } from "./chartHooks/useChartUpdater";

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
  dispatch: AppDispatch,
  isLoading: boolean,
  fetchMeasurementsIfNeeded: (start: number, end: number) => Promise<void>,
  streamId: number | null,
  onDayClick?: (date: Date | null) => void,
  rangeDisplayRef?: React.RefObject<HTMLDivElement>
): Highcharts.XAxisOptions => {
  let fetchTimeout: NodeJS.Timeout | null = null;
  let isInitialLoad = true;
  const MAX_GAP_SIZE = MILLISECONDS_IN_A_DAY;

  const updateRangeDisplayDOM = (
    element: HTMLDivElement,
    content: string,
    shouldReplace = false
  ) => {
    if (shouldReplace) {
      element.innerHTML = content;
    }
  };

  const handleSetExtremes = debounce(
    async (
      e: Highcharts.AxisSetExtremesEventObject,
      chart: Highcharts.Chart & {
        rangeSelector?: {
          clickButton: (index: number, redraw?: boolean) => void;
        };
      }
    ) => {
      console.log("handleSetExtremes called with:", {
        min: e.min,
        max: e.max,
        trigger: e.trigger,
        isLoading,
        isInitialLoad,
      });

      if (!isLoading && e.min !== undefined && e.max !== undefined) {
        console.log("Processing extremes update", {
          min: new Date(e.min).toISOString(),
          max: new Date(e.max).toISOString(),
        });

        await fetchMeasurementsIfNeeded(e.min, e.max);

        if (rangeDisplayRef?.current) {
          const htmlContent = generateTimeRangeHTML(e.min, e.max);
          console.log("Updating range display with:", htmlContent);
          updateRangeDisplayDOM(rangeDisplayRef.current, htmlContent, true);
        }

        if (fixedSessionTypeSelected && streamId !== null) {
          console.log(
            "Updating fixed measurement extremes for stream:",
            streamId
          );
          dispatch(
            updateFixedMeasurementExtremes({
              streamId,
              min: e.min,
              max: e.max,
            })
          );
        } else {
          console.log("Updating mobile measurement extremes");
          dispatch(
            updateMobileMeasurementExtremes({
              min: e.min,
              max: e.max,
            })
          );
        }

        const { dataMin, dataMax } = chart.xAxis[0].getExtremes();
        console.log("Current data range:", {
          dataMin: new Date(dataMin).toISOString(),
          dataMax: new Date(dataMax).toISOString(),
        });

        const buffer = (e.max - e.min) * 0.1;

        const visiblePoints = chart.series[0].points.filter(
          (point) => point.x >= e.min && point.x <= e.max
        );
        console.log("Visible points in range:", visiblePoints.length);

        if (visiblePoints.length > 1) {
          let lastTimestamp = visiblePoints[0].x;
          for (let i = 1; i < visiblePoints.length; i++) {
            const currentTimestamp = visiblePoints[i].x;
            const gap = currentTimestamp - lastTimestamp;

            if (gap > MAX_GAP_SIZE) {
              await fetchMeasurementsIfNeeded(lastTimestamp, currentTimestamp);
            }

            lastTimestamp = currentTimestamp;
          }
        }

        if (e.min <= dataMin + buffer) {
          const newStart = Math.max(e.min - MILLISECONDS_IN_A_MONTH, 0);
          await fetchMeasurementsIfNeeded(newStart, e.min);
        }
        if (e.max >= dataMax - buffer) {
          const newEnd = e.max + MILLISECONDS_IN_A_MONTH;
          await fetchMeasurementsIfNeeded(e.max, newEnd);
        }
      } else {
        console.log("Skipping extremes update:", {
          isLoading,
          hasMin: e.min !== undefined,
          hasMax: e.max !== undefined,
        });
      }
    },
    100
  );

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
        console.log("afterSetExtremes triggered:", {
          trigger: e.trigger,
          min: e.min ? new Date(e.min).toISOString() : null,
          max: e.max ? new Date(e.max).toISOString() : null,
        });

        const extremes = this.chart.xAxis[0].getExtremes();
        console.log("Current chart extremes:", {
          dataMin: new Date(extremes.dataMin).toISOString(),
          dataMax: new Date(extremes.dataMax).toISOString(),
          min: new Date(extremes.min).toISOString(),
          max: new Date(extremes.max).toISOString(),
        });

        // Validate extremes and ensure they are numbers
        const min = typeof e.min === "number" ? e.min : extremes.min;
        const max = typeof e.max === "number" ? e.max : extremes.max;

        if (!min || !max || min >= max) {
          console.warn("Invalid extremes:", { min, max });
          return;
        }

        // Clear any existing timeout
        if (fetchTimeout) {
          clearTimeout(fetchTimeout);
          fetchTimeout = null;
        }

        // Only process if we have valid extremes and not loading
        if (!isLoading) {
          try {
            const requestedHours = (max - min) / (1000 * 60 * 60);
            const buffer = (max - min) * 0.1;

            // For calendar day clicks, ensure we get a 24-hour range
            if (!e.trigger && requestedHours < 24) {
              try {
                const startOfDay = new Date(min);
                startOfDay.setUTCHours(0, 0, 0, 0);
                const endOfDay = new Date(startOfDay);
                endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

                const newMin = startOfDay.getTime();
                const newMax = endOfDay.getTime();

                // Check if this is first or last day in data range
                const isFirstDay =
                  Math.abs(newMin - extremes.dataMin) < MILLISECONDS_IN_A_DAY;
                const isLastDay =
                  Math.abs(newMax - extremes.dataMax) < MILLISECONDS_IN_A_DAY;

                // For first/last days, use actual data range instead of full day
                const finalMin = isFirstDay ? extremes.dataMin : newMin;
                const finalMax = isLastDay ? extremes.dataMax : newMax;

                // Get visible points to determine actual data range
                const dayPoints = this.chart.series[0].points.filter(
                  (point) => point.x >= newMin && point.x <= newMax
                );

                // If we have points, use their range for first/last day
                if (dayPoints.length > 0 && (isFirstDay || isLastDay)) {
                  const actualMin = isFirstDay
                    ? Math.min(...dayPoints.map((p) => p.x))
                    : newMin;
                  const actualMax = isLastDay
                    ? Math.max(...dayPoints.map((p) => p.x))
                    : newMax;

                  // Add small buffer (5 minutes) for better visualization
                  const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
                  const displayMin = Math.max(actualMin - buffer, 0);
                  const displayMax = actualMax + buffer;

                  // Update display first to ensure UI consistency
                  if (rangeDisplayRef?.current) {
                    const htmlContent = generateTimeRangeHTML(
                      displayMin,
                      displayMax
                    );
                    updateRangeDisplayDOM(
                      rangeDisplayRef.current,
                      htmlContent,
                      true
                    );
                  }

                  // Then update chart without animation and redraw
                  this.chart.xAxis[0].update(
                    {
                      min: displayMin,
                      max: displayMax,
                    },
                    false
                  );
                  this.chart.redraw(false);

                  // Finally fetch new data if needed
                  if (displayMax - displayMin <= MAX_GAP_SIZE) {
                    fetchTimeout = setTimeout(() => {
                      handleSetExtremes(
                        { ...e, min: displayMin, max: displayMax },
                        this.chart
                      );
                    }, 250);
                  }
                  return;
                }

                // For scrollbar and other navigation
                if (e.trigger === "scrollbar" || e.trigger === "navigator") {
                  console.log("Scrollbar/Navigator triggered", { min, max });
                  // Check if we're near the edges and need to fetch more data
                  if (min <= extremes.dataMin + buffer) {
                    const newStart = Math.max(min - MILLISECONDS_IN_A_MONTH, 0);
                    console.log("Fetching data near start", { newStart, min });
                    await fetchMeasurementsIfNeeded(newStart, min);
                  }
                  if (max >= extremes.dataMax - buffer) {
                    const newEnd = max + MILLISECONDS_IN_A_MONTH;
                    console.log("Fetching data near end", { max, newEnd });
                    await fetchMeasurementsIfNeeded(max, newEnd);
                  }
                }

                // Always check for gaps in visible data, regardless of trigger
                const visiblePoints = this.chart.series[0].points.filter(
                  (point) => point.x >= min && point.x <= max
                );
                console.log("Checking for gaps in visible points", {
                  pointsCount: visiblePoints.length,
                  timeRange: {
                    start: new Date(min).toISOString(),
                    end: new Date(max).toISOString(),
                  },
                });

                // If there are no points in the visible range, fetch the entire range
                if (visiblePoints.length === 0) {
                  console.log("No points in visible range, fetching data", {
                    start: new Date(min).toISOString(),
                    end: new Date(max).toISOString(),
                  });
                  await fetchMeasurementsIfNeeded(min, max);
                }
                // If we have points, check for gaps
                else if (visiblePoints.length > 1) {
                  let lastTimestamp = visiblePoints[0].x;
                  for (let i = 1; i < visiblePoints.length; i++) {
                    const currentTimestamp = visiblePoints[i].x;
                    const gap = currentTimestamp - lastTimestamp;

                    if (gap > MILLISECONDS_IN_A_DAY) {
                      console.log("Found gap, fetching data", {
                        gap: gap / MILLISECONDS_IN_A_DAY + " days",
                        start: new Date(lastTimestamp).toISOString(),
                        end: new Date(currentTimestamp).toISOString(),
                      });
                      await fetchMeasurementsIfNeeded(
                        lastTimestamp,
                        currentTimestamp
                      );
                    }

                    lastTimestamp = currentTimestamp;
                  }
                }

                // For other cases, update normally
                if (rangeDisplayRef?.current) {
                  console.log("Updating range display");
                  const htmlContent = generateTimeRangeHTML(min, max);
                  updateRangeDisplayDOM(
                    rangeDisplayRef.current,
                    htmlContent,
                    true
                  );
                }

                // Always fetch data for the current range
                fetchTimeout = setTimeout(() => {
                  handleSetExtremes({ ...e, min, max }, this.chart);
                }, 250);

                // Only reset day click state for range selector
                if (e.trigger === "rangeSelectorButton") {
                  onDayClick?.(null);
                }
              } catch (error) {
                console.error("Error handling day click:", error);
              }
            }

            try {
              // For scrollbar and other navigation
              if (e.trigger === "scrollbar" || e.trigger === "navigator") {
                console.log("Scrollbar/Navigator triggered", { min, max });
                // Check if we're near the edges and need to fetch more data
                if (min <= extremes.dataMin + buffer) {
                  const newStart = Math.max(min - MILLISECONDS_IN_A_MONTH, 0);
                  console.log("Fetching data near start", { newStart, min });
                  await fetchMeasurementsIfNeeded(newStart, min);
                }
                if (max >= extremes.dataMax - buffer) {
                  const newEnd = max + MILLISECONDS_IN_A_MONTH;
                  console.log("Fetching data near end", { max, newEnd });
                  await fetchMeasurementsIfNeeded(max, newEnd);
                }
              }

              // Always check for gaps in visible data, regardless of trigger
              const visiblePoints = this.chart.series[0].points.filter(
                (point) => point.x >= min && point.x <= max
              );
              console.log("Checking for gaps in visible points", {
                pointsCount: visiblePoints.length,
                timeRange: {
                  start: new Date(min).toISOString(),
                  end: new Date(max).toISOString(),
                },
              });

              // If there are no points in the visible range, fetch the entire range
              if (visiblePoints.length === 0) {
                console.log("No points in visible range, fetching data", {
                  start: new Date(min).toISOString(),
                  end: new Date(max).toISOString(),
                });
                await fetchMeasurementsIfNeeded(min, max);
              }
              // If we have points, check for gaps
              else if (visiblePoints.length > 1) {
                let lastTimestamp = visiblePoints[0].x;
                for (let i = 1; i < visiblePoints.length; i++) {
                  const currentTimestamp = visiblePoints[i].x;
                  const gap = currentTimestamp - lastTimestamp;

                  if (gap > MILLISECONDS_IN_A_DAY) {
                    console.log("Found gap, fetching data", {
                      gap: gap / MILLISECONDS_IN_A_DAY + " days",
                      start: new Date(lastTimestamp).toISOString(),
                      end: new Date(currentTimestamp).toISOString(),
                    });
                    await fetchMeasurementsIfNeeded(
                      lastTimestamp,
                      currentTimestamp
                    );
                  }

                  lastTimestamp = currentTimestamp;
                }
              }

              // For other cases, update normally
              if (rangeDisplayRef?.current) {
                console.log("Updating range display");
                const htmlContent = generateTimeRangeHTML(min, max);
                updateRangeDisplayDOM(
                  rangeDisplayRef.current,
                  htmlContent,
                  true
                );
              }

              // Always fetch data for the current range
              fetchTimeout = setTimeout(() => {
                handleSetExtremes({ ...e, min, max }, this.chart);
              }, 250);

              // Only reset day click state for range selector
              if (e.trigger === "rangeSelectorButton") {
                onDayClick?.(null);
              }
            } catch (error) {
              console.error("Error handling extremes update:", error);
            }
          } catch (error) {
            console.error("Error handling extremes update:", error);
          }
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
