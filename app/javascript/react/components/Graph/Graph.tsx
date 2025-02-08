import HighchartsReact from "highcharts-react-official";
import Highcharts, { Chart } from "highcharts/highstock";
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
import { selectIsLoading, type RootState } from "../../store";
import {
  selectFixedStreamShortInfo,
  selectLastSelectedFixedTimeRange,
  selectStreamMeasurements,
} from "../../store/fixedStreamSelectors";
import {
  resetLastSelectedTimeRange,
  resetTimeRange,
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

    // ----------------------------------------------------------------------------
    //  Decide which rangeSelector button (if any) is currently highlighted
    //
    //  - If `selectedDate` is not null => we're showing a custom day => highlight none (-1)
    //  - Else => map Redux range to a button index
    // ----------------------------------------------------------------------------
    const computedSelectedRangeIndex = React.useMemo(() => {
      if (selectedDate) {
        return -1;
      }
      return getSelectedRangeIndex(
        lastSelectedTimeRange,
        fixedSessionTypeSelected
      );
    }, [selectedDate, lastSelectedTimeRange, fixedSessionTypeSelected]);

    // Modify the selectedDate effect
    useEffect(() => {
      if (!chartComponentRef.current?.chart || !selectedDate) return;

      const chart = chartComponentRef.current.chart;

      // Get stream start and end times
      const selectedTime = selectedDate.getTime();
      const streamStartTime = parseDateString(fixedStreamShortInfo.startTime);
      const streamEndTime = fixedStreamShortInfo.endTime
        ? parseDateString(fixedStreamShortInfo.endTime)
        : Date.now();

      // Check if selected date is close to stream boundaries
      const isNearStartTime =
        Math.abs(selectedTime - streamStartTime) < MILLISECONDS_IN_A_DAY;
      const isNearEndTime =
        Math.abs(selectedTime - streamEndTime) < MILLISECONDS_IN_A_DAY;

      // Set range based on proximity to stream boundaries
      const startOfRange = isNearStartTime
        ? streamStartTime // Use actual stream start if near beginning
        : (() => {
            const startOfDay = new Date(selectedDate);
            startOfDay.setUTCHours(0, 0, 0, 0);
            return startOfDay.getTime();
          })();

      const endOfRange = isNearEndTime
        ? streamEndTime // Use actual stream end if near end
        : (() => {
            const endOfDay = new Date(selectedDate);
            endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
            return endOfDay.getTime();
          })();

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
            selected: -1,
          },
        },
        false
      );

      chart.xAxis[0].setExtremes(startOfRange, endOfRange);
      fetchMeasurementsIfNeeded(startOfRange, endOfRange);
    }, [
      selectedDate,
      fetchMeasurementsIfNeeded,
      dispatch,
      fixedSessionTypeSelected,
      fixedStreamShortInfo.startTime,
      fixedStreamShortInfo.endTime,
    ]);
    const streamStartTime = parseDateString(fixedStreamShortInfo.startTime);
    const streamEndTime = fixedStreamShortInfo.endTime
      ? parseDateString(fixedStreamShortInfo.endTime)
      : Date.now();

    const handleRangeSelectorClick = useCallback(
      (timeRange: FixedTimeRange) => {
        if (chartComponentRef.current?.chart) {
          const chart = chartComponentRef.current.chart;
          let startTime: number;
          let endTime: number;
          if (timeRange === FixedTimeRange.Day && selectedDate) {
            let startOfDay = new Date(selectedDate);
            startOfDay.setUTCHours(0, 0, 0, 0);
            let endOfDay = new Date(startOfDay);
            endOfDay.setUTCDate(startOfDay.getUTCDate() + 1);
            startTime = startOfDay.getTime();
            endTime = endOfDay.getTime();
            if (startTime < streamStartTime) startTime = streamStartTime;
            if (endTime > streamEndTime) endTime = streamEndTime;
          } else if (timeRange === FixedTimeRange.Week) {
            endTime = chart.xAxis[0].getExtremes().max || Date.now();
            startTime = endTime - MILLISECONDS_IN_A_WEEK;
          } else if (timeRange === FixedTimeRange.Month) {
            endTime = chart.xAxis[0].getExtremes().max || Date.now();
            startTime = endTime - MILLISECONDS_IN_A_MONTH;
          } else {
            endTime = chart.xAxis[0].getExtremes().max || Date.now();
            startTime = endTime - MILLISECONDS_IN_A_DAY;
          }
          console.log(
            "[Graph] handleRangeSelectorClick: setting extremes to",
            startTime,
            endTime
          );
          chart.xAxis[0].setExtremes(startTime, endTime, true);
          fetchMeasurementsIfNeeded(startTime, endTime);
        }
      },
      [selectedDate, streamStartTime, streamEndTime, fetchMeasurementsIfNeeded]
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
                  handleRangeSelectorClick(FixedTimeRange.Day);
                },
              },
            },
            {
              type: "week",
              count: 1,
              text: t("graph.oneWeek"),
              events: {
                click: function () {
                  handleRangeSelectorClick(FixedTimeRange.Week);
                },
              },
            },
            {
              type: "month",
              count: 1,
              text: t("graph.oneMonth"),
              events: {
                click: function () {
                  handleRangeSelectorClick(FixedTimeRange.Month);
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

    // Reset time range in Redux on mount
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
