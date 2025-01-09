import HighchartsReact from "highcharts-react-official";
import Highcharts, { Chart } from "highcharts/highstock";
import NoDataToDisplay from "highcharts/modules/no-data-to-display";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { white } from "../../assets/styles/colors";
import { RootState } from "../../store";
import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import {
  resetLastSelectedTimeRange,
  selectIsLoading,
  selectLastSelectedFixedTimeRange,
  selectStreamMeasurements,
  setLastSelectedTimeRange,
  updateFixedMeasurementExtremes,
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
import { selectSelectedDate } from "../../store/movingStreamSelectors";
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
}

const Graph: React.FC<GraphProps> = React.memo(
  ({ streamId, sessionType, isCalendarPage, rangeDisplayRef }) => {
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

    const selectedDate = useAppSelector(selectSelectedDate);

    const startTime = useMemo(() => {
      if (selectedDate) {
        return selectedDate;
      }
      return fixedSessionTypeSelected
        ? parseDateString(fixedStreamShortInfo.startTime)
        : parseDateString(mobileStreamShortInfo.startTime);
    }, [
      selectedDate,
      mobileStreamShortInfo.startTime,
      fixedStreamShortInfo.firstMeasurementTime,
      fixedSessionTypeSelected,
    ]);

    const endTime = useMemo(() => {
      if (selectedDate) {
        return selectedDate + MILLISECONDS_IN_A_DAY;
      }
      return fixedSessionTypeSelected
        ? fixedStreamShortInfo.endTime
          ? parseDateString(fixedStreamShortInfo.endTime)
          : Date.now()
        : mobileStreamShortInfo.endTime
        ? parseDateString(mobileStreamShortInfo.endTime)
        : Date.now();
    }, [
      selectedDate,
      mobileStreamShortInfo.endTime,
      fixedStreamShortInfo.endTime,
    ]);

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
    });

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
      if (streamId && fixedSessionTypeSelected) {
        if (selectedDate) {
          // Fetch data for selected date if we don't have measurements in that range
          const hasDataForSelectedDate = measurements.some(
            (m) =>
              m.time >= selectedDate &&
              m.time <= selectedDate + MILLISECONDS_IN_A_DAY
          );

          if (!hasDataForSelectedDate) {
            fetchMeasurementsIfNeeded(
              selectedDate - MILLISECONDS_IN_A_MONTH / 2,
              selectedDate + MILLISECONDS_IN_A_MONTH / 2,
              selectedDate
            );
          }
        } else if (!measurements.length) {
          // Only fetch if we don't have data for this stream
          const now = Date.now();
          fetchMeasurementsIfNeeded(now - MILLISECONDS_IN_A_WEEK, now);
        }
      }
    }, [streamId, fixedSessionTypeSelected, measurements.length, selectedDate]);

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
          selectedDate,
          streamId
        ),
      [
        isMobile,
        rangeDisplayRef,
        fixedSessionTypeSelected,
        dispatch,
        isLoading,
        fetchMeasurementsIfNeeded,
        selectedDate,
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
        startTime,
        selectedDate,
      ]
    );

    const isUpdatingRef = useRef<boolean>(false);

    // Add ref to track if we've already handled this date
    const lastHandledDateRef = useRef<number | null>(null);

    useEffect(() => {
      if (
        selectedDate &&
        chartComponentRef.current?.chart &&
        !isUpdatingRef.current &&
        lastHandledDateRef.current !== selectedDate // Only update if date changed
      ) {
        const chart = chartComponentRef.current.chart;

        try {
          isUpdatingRef.current = true;
          lastHandledDateRef.current = selectedDate; // Track the date we're handling

          // 1. First fetch data if needed for the selected date
          if (fixedSessionTypeSelected && streamId) {
            fetchMeasurementsIfNeeded(
              selectedDate,
              selectedDate + MILLISECONDS_IN_A_DAY,
              selectedDate
            );
          }

          // 2. Update the series data
          const dayData = seriesData?.filter((point) => {
            const pointTime = Array.isArray(point) ? point[0] : point.x;
            return (
              pointTime >= selectedDate &&
              pointTime <= selectedDate + MILLISECONDS_IN_A_DAY
            );
          });

          if (dayData) {
            chart.series[0].setData(dayData, false);
          }

          // 3. Set the extremes to show the selected day
          chart.xAxis[0].setExtremes(
            selectedDate,
            selectedDate + MILLISECONDS_IN_A_DAY,
            false
          );

          // 4. Update measurements extremes in store
          if (fixedSessionTypeSelected && streamId) {
            dispatch(
              updateFixedMeasurementExtremes({
                streamId,
                min: selectedDate,
                max: selectedDate + MILLISECONDS_IN_A_DAY,
              })
            );
          }

          // 5. Disable scrollbar temporarily for the day view
          chart.scrollbar?.update(
            {
              enabled: false,
            },
            false
          );

          // 6. Do a single redraw at the end
          chart.redraw();
        } finally {
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 0);
        }
      }
    }, [
      selectedDate,
      streamId,
      fixedSessionTypeSelected,
      dispatch,
      fetchMeasurementsIfNeeded,
    ]);

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
