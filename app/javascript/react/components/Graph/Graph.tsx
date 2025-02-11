import HighchartsReact from "highcharts-react-official";
import Highcharts, { Chart } from "highcharts/highstock";
import NoDataToDisplay from "highcharts/modules/no-data-to-display";
import moment from "moment";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { white } from "../../assets/styles/colors";
import { selectIsLoading, type RootState } from "../../store";
import {
  selectFixedStreamShortInfo,
  selectLastSelectedFixedTimeRange,
  selectStreamMeasurements,
} from "../../store/fixedStreamSelectors";
import {
  resetLastSelectedTimeRange,
  resetTimeRange,
  setLastSelectedTimeRange,
} from "../../store/fixedStreamSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectMobileStreamPoints,
  selectMobileStreamShortInfo,
} from "../../store/mobileStreamSelectors";
import {
  resetLastSelectedMobileTimeRange,
  selectLastSelectedMobileTimeRange,
} from "../../store/mobileStreamSlice";
import { selectThresholds } from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import { FixedStreamShortInfo } from "../../types/fixedStream";
import { GraphData } from "../../types/graph";
import { MobileStreamShortInfo } from "../../types/mobileStream";
import { FixedTimeRange, MobileTimeRange } from "../../types/timeRange";
import { parseDateString } from "../../utils/dateParser";
import { getSelectedRangeIndex } from "../../utils/getTimeRange";
import { useMapParams } from "../../utils/mapParamsHandler";
import {
  MILLISECONDS_IN_A_DAY,
  MILLISECONDS_IN_A_MONTH,
  MILLISECONDS_IN_A_WEEK,
} from "../../utils/timeRanges";
import useMobileDetection from "../../utils/useScreenSizeDetection";
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
  getXAxisOptions, // This function now also accepts session boundaries.
  getYAxisOptions,
  legendOption,
  seriesOptions,
} from "./graphConfig";

// Initialize the No-Data module
NoDataToDisplay(Highcharts);

interface GraphProps {
  sessionType: SessionType;
  streamId: number | null;
  isCalendarPage: boolean;
  rangeDisplayRef?: React.RefObject<HTMLDivElement>;
  selectedDate: Date | null;
  onDayClick?: (date: Date | null) => void;
}

const Graph: React.FC<GraphProps> = memo(
  ({
    streamId,
    sessionType,
    isCalendarPage,
    rangeDisplayRef,
    selectedDate,
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
    const mobileStreamShortInfo: MobileStreamShortInfo = useAppSelector(
      selectMobileStreamShortInfo
    );
    const fixedStreamShortInfo: FixedStreamShortInfo = useAppSelector(
      selectFixedStreamShortInfo
    );

    // Last selected time range from Redux
    const fixedLastSelectedTimeRange = useAppSelector(
      selectLastSelectedFixedTimeRange
    );
    const mobileLastSelectedTimeRange = useAppSelector(
      selectLastSelectedMobileTimeRange
    );

    // Use map params
    const { unitSymbol, measurementType, isIndoor } = useMapParams();
    const isIndoorParameterInUrl = isIndoor === "true";

    const lastSelectedTimeRange = fixedSessionTypeSelected
      ? fixedLastSelectedTimeRange
      : mobileLastSelectedTimeRange || MobileTimeRange.All;

    // Session start & end times (computed from stream info)
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

    // Generate chart series data
    const seriesData = useMemo(() => {
      return fixedSessionTypeSelected
        ? createFixedSeriesData(measurements)
        : createMobileSeriesData(mobileGraphData, true);
    }, [fixedSessionTypeSelected, measurements, mobileGraphData]);

    const chartData: GraphData = seriesData as GraphData;

    const initialFetchedRangeRef = useRef<{
      start: number;
      end: number;
    } | null>(null);
    const initialLoadRef = useRef(true);

    // Hooks to fetch & update chart data
    const { fetchMeasurementsIfNeeded } = useMeasurementsFetcher(
      streamId,
      startTime,
      endTime
    );
    const { updateChartData } = useChartUpdater({
      chartComponentRef,
      seriesData,
      isLoading,
      lastSelectedTimeRange,
      fixedSessionTypeSelected,
      streamId,
      rangeDisplayRef,
    });

    // Track first load
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const lastRangeSelectorTriggerRef = useRef<string | null>(null);

    // Additional refs for debouncing extremes updates.
    const lastTriggerRef = useRef<string | null>(null);
    const lastUpdateTimeRef = useRef<number>(0);

    // Determine which rangeSelector button is highlighted.
    const computedSelectedRangeIndex = useMemo(() => {
      if (selectedDate) {
        return -1;
      }
      return getSelectedRangeIndex(
        lastSelectedTimeRange,
        fixedSessionTypeSelected
      );
    }, [selectedDate, lastSelectedTimeRange, fixedSessionTypeSelected]);

    // LOCAL STATE: Control the selected range button independently of Redux.
    const [selectedRangeIndex, setSelectedRangeIndex] = useState<number>(
      computedSelectedRangeIndex
    );

    // When a custom day is selected, force the range selector to -1.
    useEffect(() => {
      if (selectedDate) {
        setSelectedRangeIndex(-1);
      }
    }, [selectedDate]);

    // --- Updated useEffect for custom day selection ---
    useEffect(() => {
      if (!chartComponentRef.current?.chart || !selectedDate) return;

      const chart = chartComponentRef.current.chart;
      // Get the start of the selected day in UTC
      const selectedDayStart = moment.utc(selectedDate).startOf("day");
      const selectedDayStartMs = selectedDayStart.valueOf();
      const fullDayEndMs = selectedDayStartMs + MILLISECONDS_IN_A_DAY;

      // Default range: full day (midnight to midnight)
      let rangeStart = selectedDayStartMs;
      let rangeEnd = fullDayEndMs;

      // Check if this is first or last day of session
      const isFirstDay = selectedDayStart.isSame(moment.utc(startTime), "day");
      const isLastDay = selectedDayStart.isSame(moment.utc(endTime), "day");

      if (isFirstDay || isLastDay) {
        // For first/last days, show only available data range
        if (isFirstDay) {
          rangeStart = startTime;
        }
        if (isLastDay) {
          rangeEnd = endTime;
        }

        // Find available data points within this day
        const dayMeasurements = measurements.filter(
          (m) => m.time >= rangeStart && m.time <= rangeEnd
        );

        if (dayMeasurements.length > 0) {
          // If we have data points, use their actual time range
          rangeStart = Math.max(rangeStart, dayMeasurements[0].time);
          rangeEnd = Math.min(
            rangeEnd,
            dayMeasurements[dayMeasurements.length - 1].time
          );
        }
      }

      // Set the visible range to the selected day
      chart.xAxis[0].setExtremes(rangeStart, rangeEnd, true, false);

      // But fetch a wider range of data (2 days before and after)
      const fetchStart = Math.max(
        startTime,
        selectedDayStartMs - MILLISECONDS_IN_A_DAY * 2
      );
      const fetchEnd = Math.min(
        endTime,
        fullDayEndMs + MILLISECONDS_IN_A_DAY * 2
      );
      fetchMeasurementsIfNeeded(fetchStart, fetchEnd, false, true);

      // Use full day format only for complete days (not first/last days)
      const useFullDayFormat = !isFirstDay && !isLastDay;

      updateRangeDisplay(
        rangeDisplayRef,
        rangeStart,
        rangeEnd,
        useFullDayFormat
      );
    }, [
      selectedDate,
      startTime,
      endTime,
      rangeDisplayRef,
      measurements,
      fetchMeasurementsIfNeeded,
    ]);
    // --- End updated useEffect ---

    // Update both local state and Redux when a range selector button is clicked.
    const handleRangeSelectorClick = useCallback(
      (selectedButton: number) => {
        // Clear selected date and immediately update UI
        onDayClick?.(null);
        setSelectedRangeIndex(selectedButton);
        lastRangeSelectorTriggerRef.current = selectedButton.toString();

        // Ensure we process the range selection immediately
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
          }

          // Get current view's end point
          const currentExtremes = chart.xAxis[0].getExtremes();
          const viewEnd = Math.min(currentExtremes.max || endTime, endTime);
          let rangeStart;

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
            default:
              rangeStart = viewEnd - MILLISECONDS_IN_A_DAY;
          }

          // Ensure we don't go before session start
          rangeStart = Math.max(rangeStart, startTime);
          const rangeEnd = viewEnd;

          // Let the chart's afterSetExtremes handle the data fetching
          updateRangeDisplay(rangeDisplayRef, rangeStart, rangeEnd, false);
          chart.xAxis[0].setExtremes(rangeStart, rangeEnd, true);
        }
      },
      [
        fixedSessionTypeSelected,
        dispatch,
        onDayClick,
        rangeDisplayRef,
        startTime,
        endTime,
      ]
    );

    // On first load, fetch only the last two days.
    const handleChartLoad = useCallback(
      function (this: Chart) {
        handleLoad.call(this, isCalendarPage, isMobile);
        const chart = this;
        const twoDaysAgo = endTime - 2 * MILLISECONDS_IN_A_DAY;
        chart.xAxis[0].setExtremes(twoDaysAgo, endTime, true, false);
        fetchMeasurementsIfNeeded(twoDaysAgo, endTime);
        setIsFirstLoad(false);
      },
      [isCalendarPage, isMobile, fetchMeasurementsIfNeeded, endTime]
    );

    const chartOptions = useMemo(
      () => getChartOptions(isCalendarPage, isMobile),
      [isCalendarPage, isMobile]
    );

    // Pass session start/end times into getXAxisOptions.
    const options = useMemo<Highcharts.Options>(() => {
      return {
        chart: {
          ...chartOptions,
          events: {
            load: handleChartLoad,
          },
        },
        xAxis: getXAxisOptions(
          isMobile,
          fixedSessionTypeSelected,
          dispatch,
          isLoading,
          fetchMeasurementsIfNeeded,
          streamId,
          initialFetchedRangeRef,
          initialLoadRef,
          lastTriggerRef,
          lastUpdateTimeRef,
          onDayClick,
          rangeDisplayRef,
          startTime, // session start time
          endTime // session end time
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
          isIndoorParameterInUrl
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
                      handleRangeSelectorClick(2);
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
                      handleRangeSelectorClick(0);
                    },
                  },
                },
              ],
          selected: selectedRangeIndex,
        },
        scrollbar: {
          ...getScrollbarOptions(isCalendarPage, isMobile),
          events: {
            afterSetExtremes: function (
              e: Highcharts.AxisSetExtremesEventObject
            ) {
              if (e.trigger === "scrollbar" || e.trigger === "navigator") {
                const { min: newMin, max: newMax } = e;
                if (newMin && newMax) {
                  const padding = (newMax - newMin) * 0.5;
                  const fetchStart = Math.max(0, newMin - padding);
                  const fetchEnd = newMax + padding;

                  if (fixedSessionTypeSelected) {
                    dispatch(resetLastSelectedTimeRange());
                  } else {
                    dispatch(resetLastSelectedMobileTimeRange());
                  }
                  fetchMeasurementsIfNeeded(fetchStart, fetchEnd, true);
                }
              }
            },
          },
        },
        navigator: {
          ...getNavigatorOptions(),
        },
        responsive: getResponsiveOptions(thresholdsState, isMobile),
        legend: legendOption,
        noData: {
          style: {
            fontWeight: "bold",
            fontSize: "15px",
            color: white,
          },
          position: {
            align: "center",
            verticalAlign: "middle",
          },
          useHTML: true,
          text: "No data available",
        },
      };
    }, [
      chartOptions,
      computedSelectedRangeIndex,
      chartData,
      measurementType,
      unitSymbol,
      thresholdsState,
      fixedSessionTypeSelected,
      streamId,
      isIndoorParameterInUrl,
      totalDuration,
      t,
      fetchMeasurementsIfNeeded,
      isLoading,
      rangeDisplayRef,
      isMobile,
      isCalendarPage,
      dispatch,
      handleChartLoad,
      lastRangeSelectorTriggerRef,
      selectedRangeIndex,
      lastTriggerRef,
      lastUpdateTimeRef,
      startTime,
      endTime,
    ]);

    // Reset time range in Redux on mount.
    useEffect(() => {
      dispatch(resetTimeRange());
    }, [dispatch]);

    // Show/hide loading indicator.
    useEffect(() => {
      if (chartComponentRef.current?.chart) {
        const chart = chartComponentRef.current.chart;
        if (isLoading) {
          chart.showLoading("Loading data from server...");
        } else {
          chart.hideLoading();
        }
      }
    }, [isLoading]);

    // Optionally reset last selected range on mount.
    useEffect(() => {
      if (fixedSessionTypeSelected) {
        dispatch(resetLastSelectedTimeRange());
      } else {
        dispatch(resetLastSelectedMobileTimeRange());
      }
    }, [fixedSessionTypeSelected, dispatch]);

    // Apply additional styling for mobile and overflow handling.
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
          const highchartsChartContainer = graphElement.querySelector(
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

    return (
      <S.Container
        $isCalendarPage={isCalendarPage}
        $isMobile={isMobile}
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
