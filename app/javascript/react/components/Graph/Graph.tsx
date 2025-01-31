import HighchartsReact from "highcharts-react-official";
import Highcharts, { type Chart } from "highcharts/highstock";
import NoDataToDisplay from "highcharts/modules/no-data-to-display";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { white } from "../../assets/styles/colors";
import type { RootState } from "../../store";
import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import {
  resetLastSelectedTimeRange,
  resetTimeRange,
  selectIsLoading,
  selectLastSelectedFixedTimeRange,
  selectStreamMeasurements,
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
import { type SessionType, SessionTypes } from "../../types/filters";
import type { FixedStreamShortInfo } from "../../types/fixedStream";
import type { GraphData } from "../../types/graph";
import type { MobileStreamShortInfo } from "../../types/mobileStream";
import { FixedTimeRange, MobileTimeRange } from "../../types/timeRange";
import { parseDateString } from "../../utils/dateParser";
import {
  getSelectedRangeIndex,
  mapIndexToTimeRange,
} from "../../utils/getTimeRange";
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

const Graph: React.FC<GraphProps> = React.memo(
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

    // Mobile vs fixed stream info
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
    const startTime = React.useMemo(
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
    const endTime = React.useMemo(
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

    // Pull measurements from Redux
    const measurements = useAppSelector((state: RootState) =>
      selectStreamMeasurements(state, streamId)
    );

    // Generate chart series data
    const seriesData = React.useMemo(() => {
      return fixedSessionTypeSelected
        ? createFixedSeriesData(measurements)
        : createMobileSeriesData(mobileGraphData, true);
    }, [fixedSessionTypeSelected, measurements, mobileGraphData]);

    const chartData: GraphData = seriesData as GraphData;

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

    // ----------------------------------------------------------------------------
    //  STEP 1: Decide which rangeSelector button (if any) is currently highlighted
    //
    //  - If `selectedDate` is not null => we're showing a custom day => highlight none (-1)
    //  - Else => map Redux range to a button index
    // ----------------------------------------------------------------------------
    const computedSelectedRangeIndex = React.useMemo(() => {
      if (selectedDate) {
        // No built-in button is active when user picks a custom day
        return -1; // Highcharts uses -1 to indicate no selected button
      }
      // Otherwise, highlight whichever range is in our Redux state
      return getSelectedRangeIndex(
        lastSelectedTimeRange,
        fixedSessionTypeSelected
      );
    }, [selectedDate, lastSelectedTimeRange, fixedSessionTypeSelected]);

    // Modify the selectedDate effect
    useEffect(() => {
      if (!chartComponentRef.current?.chart || !selectedDate) return;

      const chart = chartComponentRef.current.chart;

      // Set exact 24-hour range from start of selected date
      const startOfDay = new Date(selectedDate);
      startOfDay.setUTCHours(0, 0, 0, 0); // Set to 00:00:00.000 UTC

      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1); // Add exactly one day in UTC

      // Reset any existing range selection in Redux
      if (fixedSessionTypeSelected) {
        dispatch(resetLastSelectedTimeRange());
      } else {
        dispatch(resetLastSelectedMobileTimeRange());
      }

      // Update chart in a single operation
      chart.update(
        {
          rangeSelector: {
            selected: -1, // -1 means no button selected
          },
        },
        false
      );

      const startTime = startOfDay.getTime();
      const endTime = endOfDay.getTime();

      chart.xAxis[0].setExtremes(startTime, endTime);
      fetchMeasurementsIfNeeded(startTime, endTime);
    }, [
      selectedDate,
      fetchMeasurementsIfNeeded,
      dispatch,
      fixedSessionTypeSelected,
    ]);

    const handleRangeSelectorClick = useCallback(
      (selectedButton: number) => {
        onDayClick?.(null);

        const timeRange = mapIndexToTimeRange(
          selectedButton,
          fixedSessionTypeSelected
        );

        // Update Redux state
        if (fixedSessionTypeSelected) {
          dispatch(setLastSelectedTimeRange(timeRange as FixedTimeRange));
        } else {
          dispatch(
            setLastSelectedMobileTimeRange(timeRange as MobileTimeRange)
          );
        }

        // Update chart extremes
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

          // First update the range selector button state
          chart.update(
            {
              rangeSelector: {
                selected: selectedButton,
              },
            },
            false
          );

          // Then set the extremes and fetch data
          chart.xAxis[0].setExtremes(startTime, endTime, true); // true triggers redraw
          fetchMeasurementsIfNeeded(startTime, endTime);
        }
      },
      [
        fixedSessionTypeSelected,
        dispatch,
        onDayClick,
        fetchMeasurementsIfNeeded,
      ]
    );

    const handleChartLoad = useCallback(
      function (this: Chart) {
        handleLoad.call(this, isCalendarPage, isMobile);
        setIsFirstLoad(false);
      },
      [isCalendarPage, isMobile]
    );

    const chartOptions = React.useMemo(
      () => getChartOptions(isCalendarPage, isMobile),
      [isCalendarPage, isMobile]
    );

    // Full Highcharts config object
    const options = React.useMemo<Highcharts.Options>(() => {
      return {
        chart: {
          ...chartOptions,
          events: {
            load: handleChartLoad,
          },
        },
        xAxis: getXAxisOptions(
          isMobile,
          rangeDisplayRef,
          fixedSessionTypeSelected,
          dispatch,
          isLoading,
          fetchMeasurementsIfNeeded,
          streamId,
          onDayClick
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
          selected: computedSelectedRangeIndex,
        },
        scrollbar: {
          ...getScrollbarOptions(isCalendarPage, isMobile),
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
      onDayClick,
      isMobile,
      isCalendarPage,
      dispatch,
      handleChartLoad,
    ]);

    // Reset time range in Redux on mount (optional)
    useEffect(() => {
      dispatch(resetTimeRange());
    }, [dispatch]);

    // Show/hide loading indicator
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

    // If no data, fetch the last 30 days (optional logic)
    useEffect(() => {
      if (
        fixedSessionTypeSelected &&
        streamId &&
        (!measurements || measurements.length === 0) &&
        !isFirstLoad
      ) {
        const now = Date.now();
        const oneMonthAgo = now - MILLISECONDS_IN_A_MONTH;
        fetchMeasurementsIfNeeded(oneMonthAgo, now);
      }
    }, [
      fixedSessionTypeSelected,
      streamId,
      measurements,
      fetchMeasurementsIfNeeded,
      isFirstLoad,
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
