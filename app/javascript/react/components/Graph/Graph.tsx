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
import {
  getSelectedRangeIndex,
  mapIndexToTimeRange,
} from "../../utils/getTimeRange";
import { useMapParams } from "../../utils/mapParamsHandler";
import { formatTimeExtremes } from "../../utils/measurementsCalc";
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

    // Start & end time for the entire session
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
    const { fetchMeasurementsIfNeeded } = useMeasurementsFetcher(streamId);
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

    // ----------------------------------------------------------------------------
    //  Decide which rangeSelector button (if any) is currently highlighted.
    //  (If a custom day is selected, we use -1.)
    // ----------------------------------------------------------------------------
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

    // When a custom day is selected, force the range button selection to -1.
    useEffect(() => {
      if (selectedDate) {
        setSelectedRangeIndex(-1);
      }
    }, [selectedDate]);

    // Update the useEffect for selectedDate
    useEffect(() => {
      if (!chartComponentRef.current?.chart || selectedDate === undefined)
        return;

      const chart = chartComponentRef.current.chart;
      const selectedTime = selectedDate?.getTime() || 0;

      // If selectedDate is null, don't update the chart
      if (!selectedDate) return;

      const streamStartTime = parseDateString(fixedStreamShortInfo.startTime);
      const streamEndTime = fixedStreamShortInfo.endTime
        ? parseDateString(fixedStreamShortInfo.endTime)
        : Date.now();

      // Convert to UTC time zone
      const utcDate = moment.utc(selectedTime).startOf("day");
      const nextDay = moment.utc(utcDate).add(1, "day");

      const startTime = utcDate.valueOf();
      const endTime = nextDay.valueOf();

      // Check if this is the first or last day
      const isFirstDay =
        utcDate.format("YYYY-MM-DD") ===
        moment.utc(streamStartTime).format("YYYY-MM-DD");
      const isLastDay =
        utcDate.format("YYYY-MM-DD") ===
        moment.utc(streamEndTime).format("YYYY-MM-DD");

      // Reset any existing range selection in Redux
      if (fixedSessionTypeSelected) {
        dispatch(resetLastSelectedTimeRange());
      } else {
        dispatch(resetLastSelectedMobileTimeRange());
      }

      chart.update(
        {
          rangeSelector: {
            selected: -1,
          },
        },
        false
      );

      // Set the chart extremes
      chart.xAxis[0].setExtremes(startTime, endTime, true);

      // Update range display if available
      if (rangeDisplayRef?.current) {
        if (isFirstDay) {
          updateRangeDisplay(streamStartTime, endTime, false);
        } else if (isLastDay) {
          updateRangeDisplay(startTime, streamEndTime, false);
        } else {
          updateRangeDisplay(startTime, endTime, true);
        }
      }
    }, [
      selectedDate,
      fixedSessionTypeSelected,
      fixedStreamShortInfo.startTime,
      fixedStreamShortInfo.endTime,
      dispatch,
    ]);

    // --------------------------------------------------------------------------
    // Update both local state and Redux when a range selector button is clicked.
    // --------------------------------------------------------------------------
    const handleRangeSelectorClick = useCallback(
      (selectedButton: number) => {
        onDayClick?.(null);
        // Update local state immediately.
        setSelectedRangeIndex(selectedButton);
        lastRangeSelectorTriggerRef.current = selectedButton.toString();

        const timeRange = mapIndexToTimeRange(
          selectedButton,
          fixedSessionTypeSelected
        );

        // Update Redux state if needed.
        if (fixedSessionTypeSelected) {
          dispatch(setLastSelectedTimeRange(timeRange as FixedTimeRange));
        } else {
          dispatch(
            setLastSelectedMobileTimeRange(timeRange as MobileTimeRange)
          );
        }

        // Update the chart extremes accordingly.
        if (chartComponentRef.current?.chart) {
          const chart = chartComponentRef.current.chart;
          const currentExtremes = chart.xAxis[0].getExtremes();
          const currentMax = currentExtremes.max || Date.now();
          let startTime, endTime;

          switch (timeRange) {
            case FixedTimeRange.Month:
              endTime = currentMax;
              startTime = endTime - MILLISECONDS_IN_A_MONTH;
              break;
            case FixedTimeRange.Week:
              endTime = currentMax;
              startTime = endTime - MILLISECONDS_IN_A_WEEK;
              break;
            case FixedTimeRange.Day:
              endTime = currentMax;
              startTime = endTime - MILLISECONDS_IN_A_DAY;
              break;
            default:
              endTime = currentMax;
              startTime = endTime - MILLISECONDS_IN_A_DAY;
          }

          // Update range display with actual times
          if (rangeDisplayRef?.current) {
            updateRangeDisplay(startTime, endTime, false);
          }

          // Set extremes and update chart
          chart.xAxis[0].setExtremes(startTime, endTime, true);
          fetchMeasurementsIfNeeded(startTime, endTime);
        }
      },
      [
        fixedSessionTypeSelected,
        dispatch,
        fetchMeasurementsIfNeeded,
        onDayClick,
        rangeDisplayRef,
      ]
    );
    const handleChartLoad = useCallback(
      function (this: Chart) {
        handleLoad.call(this, isCalendarPage, isMobile);

        // Set the x-axis extremes to show only the recent two days.
        // (Here we use the stream's end time, which should be the most recent time.)
        const chart = this;
        const twoDaysAgo = endTime - 2 * MILLISECONDS_IN_A_DAY;

        // Set the extremes; note that the fourth parameter set to false disables animation.
        chart.xAxis[0].setExtremes(twoDaysAgo, endTime, true, false);

        // Also trigger a fetch for this two-day range.
        fetchMeasurementsIfNeeded(twoDaysAgo, endTime);

        setIsFirstLoad(false);
      },
      [isCalendarPage, isMobile, fetchMeasurementsIfNeeded, endTime]
    );

    const chartOptions = useMemo(
      () => getChartOptions(isCalendarPage, isMobile),
      [isCalendarPage, isMobile]
    );

    // Full Highcharts configuration object
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
          onDayClick,
          rangeDisplayRef
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
          buttons: [
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
          ],
          // Use the local state value so the selected button remains highlighted.
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
                  fetchMeasurementsIfNeeded(fetchStart, fetchEnd);
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
    ]);

    // Reset time range in Redux on mount
    useEffect(() => {
      dispatch(resetTimeRange());
    }, [dispatch]);

    // Show/hide loading indicator on the chart
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

    // Optionally reset last selected range on mount
    useEffect(() => {
      if (fixedSessionTypeSelected) {
        dispatch(resetLastSelectedTimeRange());
      } else {
        dispatch(resetLastSelectedMobileTimeRange());
      }
    }, [fixedSessionTypeSelected, dispatch]);

    // Apply some styling for mobile and overflow handling.
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

    // Add this helper function inside the Graph component
    const updateRangeDisplay = (
      min: number,
      max: number,
      useFullDayFormat: boolean
    ) => {
      if (!rangeDisplayRef?.current) return;

      const formattedTime = formatTimeExtremes(min, max, useFullDayFormat);

      const htmlContent = `
        <div class="time-container">
          <span class="date">${formattedTime.formattedMinTime.date}</span>
          <span class="time">${formattedTime.formattedMinTime.time}</span>
        </div>
        <span>-</span>
        <div class="time-container">
          <span class="date">${formattedTime.formattedMaxTime.date}</span>
          <span class="time">${formattedTime.formattedMaxTime.time}</span>
        </div>
      `;
      rangeDisplayRef.current.innerHTML = htmlContent;
    };

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
