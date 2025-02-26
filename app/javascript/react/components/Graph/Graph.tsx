import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import HighchartsAccessibility from "highcharts/modules/accessibility";
import NoDataToDisplay from "highcharts/modules/no-data-to-display";
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
import { GraphData } from "../../types/graph";
import { SensorPrefix } from "../../types/sensors";
import { FixedTimeRange, MobileTimeRange } from "../../types/timeRange";
import { parseDateString } from "../../utils/dateParser";
import { getSelectedRangeIndex } from "../../utils/getTimeRange";
import { useMapParams } from "../../utils/mapParamsHandler";
import {
  MILLISECONDS_IN_A_5_MINUTES,
  MILLISECONDS_IN_A_DAY,
  MILLISECONDS_IN_A_MONTH,
  MILLISECONDS_IN_A_SECOND,
  MILLISECONDS_IN_A_WEEK,
  MILLISECONDS_IN_AN_HOUR,
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
  getXAxisOptions,
  getYAxisOptions,
  legendOption,
  seriesOptions,
} from "./graphConfig";

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

    // Hooks to fetch & update chart data.
    const { fetchMeasurementsIfNeeded } = useMeasurementsFetcher(
      streamId,
      startTime,
      endTime,
      chartComponentRef,
      rangeDisplayRef
    );
    const { updateChartData, lastTriggerRef } = useChartUpdater({
      chartComponentRef,
      seriesData,
      isLoading,
      lastSelectedTimeRange,
      fixedSessionTypeSelected,
      streamId,
      rangeDisplayRef,
    });

    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const lastRangeSelectorTriggerRef = useRef<string | null>(null);
    const lastUpdateTimeRef = useRef<number>(0);

    const computedSelectedRangeIndex = useMemo(() => {
      if (selectedTimestamp) {
        return -1;
      }
      return getSelectedRangeIndex(
        lastSelectedTimeRange,
        fixedSessionTypeSelected
      );
    }, [selectedTimestamp, lastSelectedTimeRange, fixedSessionTypeSelected]);

    const [selectedRangeIndex, setSelectedRangeIndex] = useState<number>(
      computedSelectedRangeIndex
    );

    useEffect(() => {
      setSelectedRangeIndex(computedSelectedRangeIndex);
    }, [computedSelectedRangeIndex]);

    // Ref to track if a custom (calendar) day is selected.
    const isCalendarDaySelectedRef = useRef(!!selectedTimestamp);

    // When a calendar day is selected, mark the flag and fetch data.
    useEffect(() => {
      if (!chartComponentRef.current?.chart || !selectedTimestamp) return;

      isCalendarDaySelectedRef.current = true;

      const selectedDayStart = selectedTimestamp;
      let selectedDayEnd =
        selectedDayStart + MILLISECONDS_IN_A_DAY - MILLISECONDS_IN_A_SECOND;

      const isFirstDay = selectedDayStart <= startTime;
      const isLastDay = selectedDayEnd >= endTime;

      let finalRangeStart = selectedDayStart;
      let finalRangeEnd = selectedDayEnd;

      if (isFirstDay) {
        finalRangeStart = startTime;
      }
      if (isLastDay) {
        finalRangeEnd = endTime;
      }

      finalRangeStart = Math.max(finalRangeStart, startTime);
      finalRangeEnd = Math.min(finalRangeEnd, endTime);

      updateRangeDisplay(rangeDisplayRef, finalRangeStart, finalRangeEnd, true);

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

          const currentExtremes = chart.xAxis[0].getExtremes();
          const viewEnd = Math.min(currentExtremes.max || endTime, endTime);
          let rangeStart = viewEnd;

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
            case MobileTimeRange.All:
            default:
              rangeStart = startTime;
              break;
          }

          rangeStart = Math.max(rangeStart, startTime);
          const rangeEnd = viewEnd;
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

          chart.xAxis[0].setExtremes(rangeStart, rangeEnd, true, false);
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
      ]
    );

    const handleChartLoad = useCallback(
      function (this: Highcharts.Chart) {
        handleLoad.call(this, isCalendarPage, isMobile);
        const chart = this;
        const twoDaysAgo = endTime - 2 * MILLISECONDS_IN_A_DAY;
        chart.xAxis[0].setExtremes(twoDaysAgo, endTime, true, false);
        setIsFirstLoad(false);
      },
      [isCalendarPage, isMobile, endTime]
    );

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
          isLoading,
          fetchMeasurementsIfNeeded,
          streamId,
          lastTriggerRef,
          lastUpdateTimeRef,
          onDayClick,
          rangeDisplayRef,
          startTime,
          endTime,
          isCalendarDaySelectedRef
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
        // Updated Range Selector: if lastTriggerRef.current equals "mousewheel", no button is selected.
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
          selected:
            selectedTimestamp || lastTriggerRef.current === "mousewheel"
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
      dispatch(resetTimeRange());
    }, [dispatch]);

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

    useEffect(() => {
      if (fixedSessionTypeSelected) {
        dispatch(resetLastSelectedTimeRange());
      } else {
        dispatch(resetLastSelectedMobileTimeRange());
      }
    }, [fixedSessionTypeSelected, dispatch]);

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
