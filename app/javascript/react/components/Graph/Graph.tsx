import HighchartsReact from "highcharts-react-official";
import Highcharts, { Chart } from "highcharts/highstock";
import NoDataToDisplay from "highcharts/modules/no-data-to-display";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { white } from "../../assets/styles/colors";
import { RootState } from "../../store";
import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import {
  resetFixedMeasurementExtremes,
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
import {
  MILLISECONDS_IN_A_DAY,
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
  selectedDate?: Date;
}

const Graph: React.FC<GraphProps> = React.memo(
  ({
    streamId,
    sessionType,
    isCalendarPage,
    rangeDisplayRef,
    selectedDate,
  }) => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const graphRef = useRef<HTMLDivElement>(null);
    const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
    const isMobile = useMobileDetection();
    const fixedSessionTypeSelected = sessionType === SessionTypes.FIXED;
    const thresholdsState = useAppSelector(selectThresholds);
    const isLoading = useAppSelector(selectIsLoading);
    const mobileGraphData = useAppSelector(selectMobileStreamPoints);
    const mobileStreamShortInfo: MobileStreamShortInfo = useAppSelector(
      selectMobileStreamShortInfo
    );
    const fixedStreamShortInfo: FixedStreamShortInfo = useAppSelector(
      selectFixedStreamShortInfo
    );
    const fixedLastSelectedTimeRange = useAppSelector(
      selectLastSelectedFixedTimeRange
    );
    const mobileLastSelectedTimeRange = useAppSelector(
      selectLastSelectedMobileTimeRange
    );

    const { unitSymbol, measurementType, isIndoor } = useMapParams();

    const lastSelectedTimeRange = fixedSessionTypeSelected
      ? fixedLastSelectedTimeRange
      : mobileLastSelectedTimeRange || MobileTimeRange.All;

    const startTime = useMemo(
      () =>
        fixedSessionTypeSelected
          ? parseDateString(fixedStreamShortInfo.startTime)
          : parseDateString(mobileStreamShortInfo.startTime),
      [
        mobileStreamShortInfo.startTime,
        fixedStreamShortInfo.firstMeasurementTime,
        fixedSessionTypeSelected,
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
      [mobileStreamShortInfo.endTime, fixedStreamShortInfo.endTime]
    );

    const isIndoorParameterInUrl = isIndoor === "true";

    const measurements = useAppSelector(
      useCallback(
        (state: RootState) => selectStreamMeasurements(state, streamId),
        [streamId]
      )
    );

    const seriesData = useMemo(() => {
      return fixedSessionTypeSelected
        ? createFixedSeriesData(measurements)
        : createMobileSeriesData(mobileGraphData, true);
    }, [fixedSessionTypeSelected, measurements, mobileGraphData]);

    const totalDuration = useMemo(
      () => endTime - startTime,
      [startTime, endTime]
    );

    let chartData: GraphData = seriesData as GraphData;

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

    useEffect(() => {
      // Reset to 24-hour range on component mount
      dispatch(resetTimeRange());
    }, [dispatch]);

    useEffect(() => {
      // Update the time range when it changes
      if (lastSelectedTimeRange) {
        if (fixedSessionTypeSelected) {
          // Only dispatch fixed time range if in fixed session
          dispatch(
            setLastSelectedTimeRange(lastSelectedTimeRange as FixedTimeRange)
          );
        } else {
          // Handle mobile time range separately
          dispatch(
            setLastSelectedMobileTimeRange(
              lastSelectedTimeRange as MobileTimeRange
            )
          );
        }
      }
    }, [dispatch, lastSelectedTimeRange, fixedSessionTypeSelected]);

    useEffect(() => {
      if (chartComponentRef.current && chartComponentRef.current.chart) {
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
    }, []);

    useEffect(() => {
      if (streamId && fixedSessionTypeSelected && !measurements.length) {
        // Only fetch if we don't have data for this stream
        const now = Date.now();
        fetchMeasurementsIfNeeded(now - MILLISECONDS_IN_A_WEEK, now);
      }
    }, [streamId, fixedSessionTypeSelected, measurements.length]);

    // Apply touch action to the graph container for mobile devices in Calendar page
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

      // Set up a MutationObserver to watch for changes in the DOM
      const observer = new MutationObserver(applyStyles);

      if (graphRef.current) {
        observer.observe(graphRef.current, { childList: true, subtree: true });
      }

      // Cleanup function
      return () => {
        observer.disconnect();
      };
    }, []);

    const xAxisOptions = useMemo(
      () =>
        getXAxisOptions(
          isMobile,
          rangeDisplayRef,
          fixedSessionTypeSelected,
          dispatch,
          isLoading,
          fetchMeasurementsIfNeeded,
          streamId
        ),
      [
        isMobile,
        rangeDisplayRef,
        fixedSessionTypeSelected,
        dispatch,
        isLoading,
        fetchMeasurementsIfNeeded,
      ]
    );

    const scrollbarOptions = useMemo(
      () => ({
        ...getScrollbarOptions(isCalendarPage, isMobile),
      }),
      [isCalendarPage, isMobile, isLoading, seriesData]
    );

    const handleChartLoad = useCallback(
      function (this: Chart) {
        handleLoad.call(this, isCalendarPage, isMobile);
      },
      [isCalendarPage, isMobile]
    );

    const chartOptions = useMemo(
      () => getChartOptions(isCalendarPage, isMobile),
      [isCalendarPage, isMobile]
    );

    const options = useMemo<Highcharts.Options>(
      () => ({
        chart: {
          ...chartOptions,
          events: {
            load: handleChartLoad,
            redraw: function (this: Chart) {
              const chart = this as Highcharts.StockChart;
              const selectedButton = chart.options.rangeSelector?.selected;
              if (selectedButton !== undefined) {
                const timeRange = mapIndexToTimeRange(
                  selectedButton,
                  fixedSessionTypeSelected
                );
                if (fixedSessionTypeSelected) {
                  dispatch(
                    setLastSelectedTimeRange(timeRange as FixedTimeRange)
                  );
                } else {
                  dispatch(
                    setLastSelectedMobileTimeRange(timeRange as MobileTimeRange)
                  );
                }
              }
            },
          },
        },
        xAxis: xAxisOptions,
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
            0,
            isCalendarPage,
            t
          ),
          selected: getSelectedRangeIndex(
            lastSelectedTimeRange,
            fixedSessionTypeSelected
          ),
        },
        scrollbar: {
          ...scrollbarOptions,
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
      }),
      [
        isCalendarPage,
        isMobile,
        xAxisOptions,
        thresholdsState,
        seriesData,
        measurementType,
        unitSymbol,
        fixedSessionTypeSelected,
        streamId,
        isIndoorParameterInUrl,
        totalDuration,
        scrollbarOptions,
        t,
        handleChartLoad,
        lastSelectedTimeRange,
        dispatch,
      ]
    );

    // Add cleanup effect for fixed streams only
    useEffect(() => {
      return () => {
        // Reset measurement extremes when component unmounts, but only for fixed streams
        if (fixedSessionTypeSelected && streamId) {
          dispatch(resetFixedMeasurementExtremes());
        }
      };
    }, [dispatch, fixedSessionTypeSelected, streamId]);

    useEffect(() => {
      if (selectedDate && chartComponentRef.current?.chart) {
        const chart = chartComponentRef.current.chart;
        const startTime = selectedDate.getTime();
        const endTime = startTime + MILLISECONDS_IN_A_DAY;

        // Set the extremes to show the selected day
        chart.xAxis[0].setExtremes(startTime, endTime);

        // If we're in fixed session mode and have a streamId, fetch data if needed
        if (fixedSessionTypeSelected && streamId) {
          fetchMeasurementsIfNeeded(
            startTime - MILLISECONDS_IN_A_DAY * 15, // Fetch 15 days before
            endTime + MILLISECONDS_IN_A_DAY * 15 // Fetch 15 days after
          );
        }
      }
    }, [selectedDate, streamId, fixedSessionTypeSelected]);

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
