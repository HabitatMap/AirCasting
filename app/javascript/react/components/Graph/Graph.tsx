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
  setLastSelectedMobileTimeRange,
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
  MILLISECONDS_IN_AN_HOUR,
  MILLISECONDS_IN_FIVE_MINUTES,
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
  getXAxisOptions, // This function also now accepts session boundaries.
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

    // Session start & end times (as computed from stream info)
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

    // LOCAL STATE: Control the selected range button independent of Redux.
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
    // When the user selects a day, if it is the session's first or last day,
    // override the full-day boundaries with the actual session start or end times.
    useEffect(() => {
      if (!chartComponentRef.current?.chart || !selectedDate) return;

      const chart = chartComponentRef.current.chart;
      // Compute full-day boundaries for the selected date
      const selectedDayStart = moment.utc(selectedDate).startOf("day");
      const selectedDayEnd = moment.utc(selectedDate).endOf("day");

      // By default, use the full day
      let rangeStart = selectedDayStart.valueOf();
      let rangeEnd = selectedDayEnd.valueOf();

      // If selected day is the session's first day, use actual session start time.
      if (selectedDayStart.isSame(moment.utc(startTime), "day")) {
        rangeStart = startTime;
      }
      // If selected day is the session's last day, use actual session end time.
      if (selectedDayStart.isSame(moment.utc(endTime), "day")) {
        rangeEnd = endTime;
      }

      chart.xAxis[0].setExtremes(rangeStart, rangeEnd, true, false);
      updateRangeDisplay(rangeDisplayRef, rangeStart, rangeEnd, false);
    }, [selectedDate, startTime, endTime, rangeDisplayRef]);
    // --- End updated useEffect ---

    // Update both local state and Redux when a range selector button is clicked.
    const handleRangeSelectorClick = useCallback(
      (selectedButton: number) => {
        onDayClick?.(null);
        setSelectedRangeIndex(selectedButton);
        lastRangeSelectorTriggerRef.current = selectedButton.toString();

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

        if (chartComponentRef.current?.chart) {
          const chart = chartComponentRef.current.chart;
          const currentExtremes = chart.xAxis[0].getExtremes();
          const currentMax = currentExtremes.max || Date.now();
          let rangeStart, rangeEnd;

          if (!fixedSessionTypeSelected && timeRange === MobileTimeRange.All) {
            // For "All" option in mobile sessions, show the entire range
            rangeStart = startTime;
            rangeEnd = endTime;
          } else {
            switch (timeRange) {
              case FixedTimeRange.Month:
                rangeEnd = currentMax;
                rangeStart = rangeEnd - MILLISECONDS_IN_A_MONTH;
                break;
              case FixedTimeRange.Week:
                rangeEnd = currentMax;
                rangeStart = rangeEnd - MILLISECONDS_IN_A_WEEK;
                break;
              case FixedTimeRange.Day:
                rangeEnd = currentMax;
                rangeStart = rangeEnd - MILLISECONDS_IN_A_DAY;
                break;
              case MobileTimeRange.Hour:
                rangeEnd = currentMax;
                rangeStart = rangeEnd - MILLISECONDS_IN_AN_HOUR;
                break;
              case MobileTimeRange.FiveMinutes:
                rangeEnd = currentMax;
                rangeStart = rangeEnd - MILLISECONDS_IN_FIVE_MINUTES;
                break;
              default:
                rangeEnd = currentMax;
                rangeStart = rangeEnd - MILLISECONDS_IN_A_DAY;
            }
          }

          updateRangeDisplay(rangeDisplayRef, rangeStart, rangeEnd, false);
          chart.xAxis[0].setExtremes(rangeStart, rangeEnd, true);
          fetchMeasurementsIfNeeded(rangeStart, rangeEnd);
        }
      },
      [
        fixedSessionTypeSelected,
        dispatch,
        fetchMeasurementsIfNeeded,
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
