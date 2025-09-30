import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highcharts";
import HighchartsAccessibility from "highcharts/modules/accessibility";
import NoDataToDisplay from "highcharts/modules/no-data-to-display";
import stock from "highcharts/modules/stock";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { white } from "../../../assets/styles/colors";
import { selectIsLoading, type RootState } from "../../../store";
import {
  selectFixedStreamShortInfo,
  selectLastSelectedFixedTimeRange,
  selectStreamMeasurements,
} from "../../../store/fixedStreamSelectors";
import {
  setLastSelectedTimeRange,
  updateFixedMeasurementExtremes,
} from "../../../store/fixedStreamSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  selectMobileStreamPoints,
  selectMobileStreamShortInfo,
} from "../../../store/mobileStreamSelectors";
import {
  selectLastSelectedMobileTimeRange,
  setLastSelectedMobileTimeRange,
  updateMobileMeasurementExtremes,
} from "../../../store/mobileStreamSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../../types/filters";
import { GraphData } from "../../../types/graph";
import { SensorPrefix } from "../../../types/sensors";
import { FixedTimeRange, MobileTimeRange } from "../../../types/timeRange";
import { parseDateString } from "../../../utils/dateParser";
import { getSelectedRangeIndex } from "../../../utils/getTimeRange";
import { useMapParams } from "../../../utils/mapParamsHandler";
import {
  MILLISECONDS_IN_A_5_MINUTES,
  MILLISECONDS_IN_A_DAY,
  MILLISECONDS_IN_A_MONTH,
  MILLISECONDS_IN_A_SECOND,
  MILLISECONDS_IN_A_WEEK,
  MILLISECONDS_IN_AN_HOUR,
} from "../../../utils/timeRanges";
import useMobileDetection from "../../../utils/useScreenSizeDetection";
import { handleLoad } from "./chartEvents";
import {
  createFixedSeriesData,
  createMobileSeriesData,
} from "./chartHooks/createGraphData";
import { updateRangeDisplay } from "./chartHooks/updateRangeDisplay";
import { useChartUpdater } from "./chartHooks/useChartUpdater";
import { useMeasurementsFetcher } from "./chartHooks/useMeasurementsFetcher";
import * as S from "./Graph.style";
import {
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
} from "./graphConfig";

// Initialize the stock module
stock(Highcharts);
// Initialize No-Data and Accessibility modules.
NoDataToDisplay(Highcharts);
HighchartsAccessibility(Highcharts);

interface GraphProps {
  sessionType: SessionType;
  streamId: number | null;
  isCalendarPage: boolean;
  rangeDisplayRef?: React.RefObject<HTMLDivElement>;
  selectedTimestamp: number | null;
  onDayClick?: (timestamp: number | null) => void;
}

const Graph: React.FC<GraphProps> = memo(
  ({
    streamId,
    sessionType,
    isCalendarPage,
    rangeDisplayRef,
    selectedTimestamp,
    onDayClick,
  }) => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const graphRef = useRef<HTMLDivElement>(null);
    const chartComponentRef = useRef<HighchartsReact.RefObject>(null);

    const isMobile = useMobileDetection();
    const fixedSessionTypeSelected = sessionType === SessionTypes.FIXED;

    const thresholdsState = useAppSelector(selectThresholds);
    const isLoading = useAppSelector(selectIsLoading);

    // Mobile vs. fixed stream info
    const mobileGraphData = useAppSelector(selectMobileStreamPoints);
    const mobileStreamShortInfo = useAppSelector(selectMobileStreamShortInfo);
    const fixedStreamShortInfo = useAppSelector(selectFixedStreamShortInfo);

    // Last selected time range from Redux
    const fixedLastSelectedTimeRange = useAppSelector(
      selectLastSelectedFixedTimeRange
    );
    const mobileLastSelectedTimeRange = useAppSelector(
      selectLastSelectedMobileTimeRange
    );

    const { unitSymbol, measurementType, isIndoor, sensorName } =
      useMapParams();
    const isIndoorParameterInUrl = isIndoor === "true";

    const lastSelectedTimeRange = fixedSessionTypeSelected
      ? fixedLastSelectedTimeRange
      : mobileLastSelectedTimeRange || MobileTimeRange.All;

    const startTime = useMemo(
      () =>
        fixedSessionTypeSelected
          ? parseDateString(fixedStreamShortInfo.startTime)
          : parseDateString(mobileStreamShortInfo.startTime),
      [
        fixedSessionTypeSelected,
        fixedStreamShortInfo.startTime,
        mobileStreamShortInfo.startTime,
      ]
    );
    const endTime = useMemo(
      () =>
        fixedSessionTypeSelected
          ? fixedStreamShortInfo.endTime
            ? parseDateString(fixedStreamShortInfo.endTime)
            : Date.now()
          : mobileStreamShortInfo.endTime
          ? parseDateString(mobileStreamShortInfo.endTime)
          : Date.now(),
      [
        fixedSessionTypeSelected,
        fixedStreamShortInfo.endTime,
        mobileStreamShortInfo.endTime,
      ]
    );

    const totalDuration = useMemo(
      () => endTime - startTime,
      [startTime, endTime]
    );

    const measurements = useAppSelector((state: RootState) =>
      selectStreamMeasurements(state, streamId)
    );

    const isGovData = sensorName?.includes(SensorPrefix.GOVERNMENT);

    // Generate chart series data.
    const seriesData = useMemo(() => {
      return fixedSessionTypeSelected
        ? createFixedSeriesData(measurements)
        : createMobileSeriesData(mobileGraphData, true);
    }, [fixedSessionTypeSelected, measurements, mobileGraphData]);

    const chartData: GraphData = seriesData as GraphData;

    // Local override flag – when true, force computed selected index to -1.
    const [overrideRangeSelector, setOverrideRangeSelector] =
      useState<boolean>(false);

    // Hooks to fetch & update chart data.
    const { fetchMeasurementsIfNeeded } = useMeasurementsFetcher(
      streamId,
      startTime,
      endTime,
      chartComponentRef,
      fixedSessionTypeSelected,
      rangeDisplayRef
    );
    const { updateChartData, lastTriggerRef } = useChartUpdater({
      chartComponentRef,
      seriesData,
      isLoading,
      fixedSessionTypeSelected,
      streamId,
    });

    const isFirstLoadRef = useRef(true);
    const lastRangeSelectorTriggerRef = useRef<string | null>(null);
    const lastUpdateTimeRef = useRef<number>(0);

    // If the last trigger was a mousewheel event—or if the override flag is true—we force the computed index to -1.
    const computedSelectedRangeIndex = useMemo(() => {
      if (selectedTimestamp) return -1;
      if (overrideRangeSelector) return -1;
      // So we combine it with our override flag.
      if (lastTriggerRef.current === "mousewheel") return -1;
      return getSelectedRangeIndex(
        lastSelectedTimeRange,
        fixedSessionTypeSelected
      );
    }, [
      selectedTimestamp,
      overrideRangeSelector,
      lastSelectedTimeRange,
      fixedSessionTypeSelected,
    ]);

    const [selectedRangeIndex, setSelectedRangeIndex] = useState<number>(
      computedSelectedRangeIndex
    );

    useEffect(() => {
      setSelectedRangeIndex(computedSelectedRangeIndex);
    }, [computedSelectedRangeIndex]);

    // Ref to track if a custom (calendar) day is selected.
    const isCalendarDaySelectedRef = useRef(!!selectedTimestamp);
    const lastProcessedTimestampRef = useRef<number | null>(null);

    // When a calendar day is selected, mark the flag and fetch data.
    useEffect(() => {
      if (!chartComponentRef.current?.chart || !selectedTimestamp) return;
      if (lastProcessedTimestampRef.current === selectedTimestamp) return;
      lastProcessedTimestampRef.current = selectedTimestamp;
      isCalendarDaySelectedRef.current = true;
      const selectedDayStart = selectedTimestamp;
      let selectedDayEnd =
        selectedDayStart + MILLISECONDS_IN_A_DAY - MILLISECONDS_IN_A_SECOND;
      const isFirstDay = selectedDayStart <= startTime;
      const isLastDay = selectedDayEnd >= endTime;
      let finalRangeStart = selectedDayStart;
      let finalRangeEnd = selectedDayEnd;
      if (isFirstDay) finalRangeStart = startTime;
      if (isLastDay) finalRangeEnd = endTime;
      finalRangeStart = Math.max(finalRangeStart, startTime);
      finalRangeEnd = Math.min(finalRangeEnd, endTime);
      updateRangeDisplay(rangeDisplayRef, finalRangeStart, finalRangeEnd, true);

      if (chartComponentRef.current?.chart) {
        const chart = chartComponentRef.current.chart;
        if (chart.xAxis && chart.xAxis[0]) {
          chart.xAxis[0].setExtremes(
            finalRangeStart,
            finalRangeEnd,
            true,
            false,
            { trigger: "calendarDay" }
          );
        }
      }
      if (fixedSessionTypeSelected) {
        fetchMeasurementsIfNeeded(
          finalRangeStart,
          finalRangeEnd,
          false,
          true,
          "calendarDay"
        );
      }
    }, [
      selectedTimestamp,
      fetchMeasurementsIfNeeded,
      rangeDisplayRef,
      startTime,
      endTime,
      fixedSessionTypeSelected,
    ]);

    const handleRangeSelectorClick = useCallback(
      (selectedButton: number) => {
        if (selectedButton === 0) {
          setSelectedRangeIndex(-1);
        } else {
          setSelectedRangeIndex(selectedButton);
        }
        lastRangeSelectorTriggerRef.current = selectedButton.toString();
        if (chartComponentRef.current?.chart) {
          const chart = chartComponentRef.current.chart;
          let timeRange;
          if (fixedSessionTypeSelected) {
            switch (selectedButton) {
              case 0:
                timeRange = FixedTimeRange.Day;
                break;
              case 1:
                timeRange = FixedTimeRange.Week;
                break;
              case 2:
                timeRange = FixedTimeRange.Month;
                break;
              default:
                timeRange = FixedTimeRange.Day;
            }
            dispatch(setLastSelectedTimeRange(timeRange));
          } else {
            switch (selectedButton) {
              case 0:
                timeRange = MobileTimeRange.FiveMinutes;
                break;
              case 1:
                timeRange = MobileTimeRange.Hour;
                break;
              case 2:
                timeRange = MobileTimeRange.All;
                break;
              default:
                timeRange = MobileTimeRange.All;
            }
            dispatch(setLastSelectedMobileTimeRange(timeRange));
          }
          if (!chart.xAxis || !chart.xAxis[0]) return;
          const currentExtremes = chart.xAxis[0].getExtremes();
          const viewEnd = Math.min(currentExtremes.max || endTime, endTime);
          let rangeStart = viewEnd;
          let rangeEnd = viewEnd;
          if (!fixedSessionTypeSelected && timeRange === MobileTimeRange.All) {
            rangeStart = startTime;
            rangeEnd = endTime;

            // Update UI to show the full range without fetching data
            if (chartComponentRef.current?.chart) {
              const chart = chartComponentRef.current.chart;
              updateRangeDisplay(rangeDisplayRef, rangeStart, rangeEnd, false);

              if (chart.xAxis && chart.xAxis[0]) {
                chart.xAxis[0].setExtremes(rangeStart, rangeEnd, true, false, {
                  trigger: "allButtonClicked",
                });
              }
              return;
            }
          } else {
            switch (timeRange) {
              case FixedTimeRange.Month:
                rangeStart = viewEnd - MILLISECONDS_IN_A_MONTH;
                break;
              case FixedTimeRange.Week:
                rangeStart = viewEnd - MILLISECONDS_IN_A_WEEK;
                break;
              case FixedTimeRange.Day:
                rangeStart = viewEnd - MILLISECONDS_IN_A_DAY;
                break;
              case MobileTimeRange.FiveMinutes:
                rangeStart = viewEnd - MILLISECONDS_IN_A_5_MINUTES;
                break;
              case MobileTimeRange.Hour:
                rangeStart = viewEnd - MILLISECONDS_IN_AN_HOUR;
                break;
            }
          }
          rangeStart = !isMobile ? Math.max(rangeStart, startTime) : rangeStart;
          updateRangeDisplay(rangeDisplayRef, rangeStart, rangeEnd, false);

          if (fixedSessionTypeSelected) {
            fetchMeasurementsIfNeeded(
              rangeStart,
              rangeEnd,
              false,
              false,
              "rangeSelectorButton"
            );
          }
          if (chart.xAxis && chart.xAxis[0]) {
            chart.xAxis[0].setExtremes(rangeStart, rangeEnd, true, false, {
              trigger: "rangeSelectorButton",
            });
          }
        }
      },
      [
        fixedSessionTypeSelected,
        dispatch,
        onDayClick,
        rangeDisplayRef,
        startTime,
        endTime,
        fetchMeasurementsIfNeeded,
        isMobile,
      ]
    );

    useEffect(() => {
      if (
        !fixedSessionTypeSelected &&
        streamId &&
        startTime &&
        endTime &&
        mobileGraphData.length === 0 &&
        isFirstLoadRef.current
      ) {
        fetchMeasurementsIfNeeded(startTime, endTime, false, false, "initial");
      }
    }, [
      fixedSessionTypeSelected,
      streamId,
      startTime,
      endTime,
      mobileGraphData,
      fetchMeasurementsIfNeeded,
    ]);

    const handleChartLoad = useCallback(
      async function (this: Highcharts.Chart) {
        handleLoad.call(this, isCalendarPage, isMobile);
        const chart = this;
        if (chart.xAxis && chart.xAxis[0]) {
          if (fixedSessionTypeSelected) {
            const twoDaysAgo = endTime - 2 * MILLISECONDS_IN_A_DAY;
            chart.xAxis[0].setExtremes(twoDaysAgo, endTime, true, false);
          } else {
            // Mobile sessions should show the full time range by default
            chart.xAxis[0].setExtremes(startTime, endTime, true, false);
          }
        }
        isFirstLoadRef.current = false;
      },
      [isCalendarPage, isMobile, endTime, startTime, fixedSessionTypeSelected]
    );

    useEffect(() => {
      if (chartComponentRef.current?.chart) {
        const chart = chartComponentRef.current.chart;

        // Check if chart and xAxis are properly initialized before accessing
        if (!chart || !chart.xAxis || !chart.xAxis[0]) {
          return;
        }

        let lastExtremes = chart.xAxis[0].getExtremes();
        let debounceTimer: NodeJS.Timeout | null = null;

        const updateExtremesHandler = (eventType: string) => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            // Check if chart and xAxis are properly initialized
            if (!chart || !chart.xAxis || !chart.xAxis[0]) {
              return;
            }

            const currentExtremes = chart.xAxis[0].getExtremes();
            if (
              currentExtremes.min !== lastExtremes.min ||
              currentExtremes.max !== lastExtremes.max
            ) {
              lastExtremes = currentExtremes;
              updateRangeDisplay(
                rangeDisplayRef,
                currentExtremes.min,
                currentExtremes.max,
                false
              );

              // Update extremes immediately for any chart interaction
              if (streamId) {
                if (fixedSessionTypeSelected) {
                  dispatch(
                    updateFixedMeasurementExtremes({
                      streamId,
                      min: currentExtremes.min,
                      max: currentExtremes.max,
                    })
                  );
                } else {
                  dispatch(
                    updateMobileMeasurementExtremes({
                      min: currentExtremes.min,
                      max: currentExtremes.max,
                    })
                  );
                }
              }

              // Mobile sessions should not fetch data on every extremes change
              // Data is fetched once on initial load
            }
          }, 100);
        };

        // Add multiple event listeners to catch all possible interactions
        Highcharts.addEvent(chart, "redraw", () =>
          updateExtremesHandler("redraw")
        );
        Highcharts.addEvent(chart, "scrollbar", () =>
          updateExtremesHandler("scrollbar")
        );
        Highcharts.addEvent(chart, "navigator", () =>
          updateExtremesHandler("navigator")
        );

        // Also listen to xAxis events
        if (chart.xAxis && chart.xAxis[0]) {
          Highcharts.addEvent(chart.xAxis[0], "afterSetExtremes", () =>
            updateExtremesHandler("afterSetExtremes")
          );
        }

        return () => {
          Highcharts.removeEvent(chart, "redraw", () =>
            updateExtremesHandler("redraw")
          );
          Highcharts.removeEvent(chart, "scrollbar", () =>
            updateExtremesHandler("scrollbar")
          );
          Highcharts.removeEvent(chart, "navigator", () =>
            updateExtremesHandler("navigator")
          );
          if (chart.xAxis && chart.xAxis[0]) {
            Highcharts.removeEvent(chart.xAxis[0], "afterSetExtremes", () =>
              updateExtremesHandler("afterSetExtremes")
            );
          }
          if (debounceTimer) clearTimeout(debounceTimer);
        };
      }
    }, [
      chartComponentRef,
      fetchMeasurementsIfNeeded,
      rangeDisplayRef,
      streamId,
      fixedSessionTypeSelected,
      dispatch,
    ]);

    const options = useMemo<Highcharts.Options>(() => {
      return {
        chart: {
          ...getChartOptions(isCalendarPage, isMobile),
          events: { load: handleChartLoad },
        },
        xAxis: getXAxisOptions(
          isMobile,
          fixedSessionTypeSelected,
          dispatch,
          fetchMeasurementsIfNeeded,
          streamId,
          lastTriggerRef,
          lastUpdateTimeRef,
          onDayClick,
          rangeDisplayRef,
          startTime,
          endTime,
          isCalendarDaySelectedRef,
          // Pass the setter so that the mousewheel branch can hold the override longer.
          setOverrideRangeSelector
        ),
        yAxis: getYAxisOptions(thresholdsState, isMobile),
        series: [
          {
            ...seriesOptions(chartData as GraphData),
          } as Highcharts.SeriesOptionsType,
        ],
        tooltip: getTooltipOptions(measurementType, unitSymbol),
        plotOptions: getPlotOptions(
          fixedSessionTypeSelected,
          streamId,
          dispatch,
          isIndoorParameterInUrl,
          isGovData
        ),
        rangeSelector: {
          ...getRangeSelectorOptions(
            isMobile,
            fixedSessionTypeSelected,
            totalDuration,
            computedSelectedRangeIndex,
            isCalendarPage,
            t
          ),
          buttons: fixedSessionTypeSelected
            ? [
                {
                  type: "day",
                  count: 1,
                  text: t("graph.24Hours"),
                  events: {
                    click: function () {
                      onDayClick?.(null);
                      handleRangeSelectorClick(0);
                    },
                  },
                },
                {
                  type: "week",
                  count: 1,
                  text: t("graph.oneWeek"),
                  events: {
                    click: function () {
                      onDayClick?.(null);
                      handleRangeSelectorClick(1);
                    },
                  },
                },
                {
                  type: "month",
                  count: 1,
                  text: t("graph.oneMonth"),
                  events: {
                    click: function () {
                      onDayClick?.(null);
                      handleRangeSelectorClick(2);
                    },
                  },
                },
              ]
            : [
                {
                  type: "minute",
                  count: 5,
                  text: t("graph.fiveMinutes"),
                  events: {
                    click: function () {
                      handleRangeSelectorClick(0);
                    },
                  },
                },
                {
                  type: "minute",
                  count: 60,
                  text: t("graph.oneHour"),
                  events: {
                    click: function () {
                      handleRangeSelectorClick(1);
                    },
                  },
                },
                {
                  type: "all",
                  text: t("graph.all"),
                  events: {
                    click: function () {
                      handleRangeSelectorClick(2);
                    },
                  },
                },
              ],
          selected: selectedTimestamp
            ? undefined
            : lastTriggerRef.current === "mousewheel"
            ? undefined
            : selectedRangeIndex >= 0
            ? selectedRangeIndex
            : undefined,
        },
        scrollbar: getScrollbarOptions(isCalendarPage, isMobile),
        navigator: getNavigatorOptions(),
        responsive: getResponsiveOptions(thresholdsState, isMobile),
        legend: legendOption,
        noData: {
          style: { fontWeight: "bold", fontSize: "15px", color: white },
          position: { align: "center", verticalAlign: "middle" },
          useHTML: true,
          text: "No data available",
        },
      };
    }, [
      isCalendarPage,
      isMobile,
      totalDuration,
      computedSelectedRangeIndex,
      t,
      fixedSessionTypeSelected,
      dispatch,
      isLoading,
      fetchMeasurementsIfNeeded,
      streamId,
      lastTriggerRef,
      lastUpdateTimeRef,
      startTime,
      endTime,
      thresholdsState,
      chartData,
      selectedTimestamp,
      selectedRangeIndex,
      onDayClick,
      measurementType,
      unitSymbol,
      isIndoor,
    ]);

    useEffect(() => {
      const applyStyles = () => {
        const graphElement = graphRef.current;
        if (graphElement) {
          graphElement.style.touchAction = "pan-x";
          const highchartsContainer = graphElement.querySelector(
            ".highcharts-container"
          ) as HTMLDivElement | null;
          if (highchartsContainer) {
            highchartsContainer.style.overflow = "visible";
          }
          const highchartsChartContainer = graphRef.current.querySelector(
            "[data-highcharts-chart]"
          ) as HTMLDivElement | null;
          if (highchartsChartContainer) {
            highchartsChartContainer.style.overflow = "visible";
          }
        }
      };

      applyStyles();
      const observer = new MutationObserver(applyStyles);
      if (graphRef.current) {
        observer.observe(graphRef.current, { childList: true, subtree: true });
      }
      return () => {
        observer.disconnect();
      };
    }, []);

    useEffect(() => {
      if (
        chartComponentRef.current?.chart &&
        seriesData &&
        seriesData.length > 0
      ) {
        setTimeout(() => {
          if (chartComponentRef.current?.chart) {
            chartComponentRef.current.chart.reflow();
            if (isCalendarPage) {
              const container = graphRef.current;
              if (container) {
                const currentHeight = container.style.height;
                container.style.height = "auto";
                container.offsetHeight;
                container.style.height = currentHeight;
                setTimeout(() => {
                  if (chartComponentRef.current?.chart) {
                    chartComponentRef.current.chart.reflow();
                  }
                }, 100);
              }
            }
          }
        }, 200);
      }
    }, [isCalendarPage, seriesData]);

    useEffect(() => {
      if (
        isFirstLoadRef.current &&
        streamId &&
        startTime &&
        endTime &&
        endTime > startTime
      ) {
        isFirstLoadRef.current = false;
        setTimeout(() => {
          fetchMeasurementsIfNeeded(startTime, endTime, true, false, "initial");
        }, 50);
      }
    }, [
      streamId,
      fixedSessionTypeSelected,
      startTime,
      endTime,
      fetchMeasurementsIfNeeded,
    ]);

    return (
      <S.Container
        $isCalendarPage={isCalendarPage}
        $isMobile={isMobile}
        $isLoading={isLoading}
        ref={graphRef}
      >
        {seriesData && seriesData.length > 0 && (
          <HighchartsReact
            highcharts={Highcharts}
            constructorType={"stockChart"}
            options={options}
            ref={chartComponentRef}
            immutable={false}
          />
        )}
      </S.Container>
    );
  }
);

export { Graph };
