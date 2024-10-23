import HighchartsReact from "highcharts-react-official";
import Highcharts, { Chart } from "highcharts/highstock";
import NoDataToDisplay from "highcharts/modules/no-data-to-display";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { white } from "../../assets/styles/colors";
import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import {
  fetchMeasurements,
  Measurement,
  resetLastSelectedTimeRange,
  selectFixedData,
  selectIsLoading,
  selectLastSelectedTimeRange,
  setLastSelectedTimeRange,
} from "../../store/fixedStreamSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectMobileStreamPoints,
  selectMobileStreamShortInfo,
} from "../../store/mobileStreamSelectors";
import { resetLastSelectedMobileTimeRange } from "../../store/mobileStreamSlice";
import { selectThresholds } from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import { GraphData } from "../../types/graph";
import { MobileStreamShortInfo as StreamShortInfo } from "../../types/mobileStream";
import { FixedTimeRange, MobileTimeRange } from "../../types/timeRange";
import {
  createFixedSeriesData,
  createMobileSeriesData,
} from "../../utils/createGraphData";
import { parseDateString } from "../../utils/dateParser";
import {
  getSelectedRangeIndex,
  mapIndexToTimeRange,
} from "../../utils/getTimeRange";
import { useMapParams } from "../../utils/mapParamsHandler";
import {
  MILLISECONDS_IN_A_5_MINUTES,
  MILLISECONDS_IN_A_DAY,
  MILLISECONDS_IN_A_MONTH,
  MILLISECONDS_IN_A_WEEK,
  MILLISECONDS_IN_AN_HOUR,
} from "../../utils/timeRanges";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { handleLoad } from "./chartEvents";
import * as S from "./Graph.style";
import {
  getChartOptions,
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
    const fixedGraphData = useAppSelector(selectFixedData);
    const mobileGraphData = useAppSelector(selectMobileStreamPoints);
    const streamShortInfo: StreamShortInfo = useAppSelector(
      fixedSessionTypeSelected
        ? selectFixedStreamShortInfo
        : selectMobileStreamShortInfo
    );
    const { unitSymbol, measurementType, isIndoor, sensorName } =
      useMapParams();

    // Use Redux state for selected time range
    const fixedLastSelectedTimeRange = useAppSelector(
      selectLastSelectedTimeRange
    );
    const mobileLastSelectedTimeRange = useAppSelector(
      selectLastSelectedTimeRange
    );

    const lastSelectedTimeRange = fixedSessionTypeSelected
      ? fixedLastSelectedTimeRange
      : mobileLastSelectedTimeRange || MobileTimeRange.All;

    const startTime = useMemo(
      () => parseDateString(streamShortInfo.startTime),
      [streamShortInfo.startTime]
    );
    const endTime = useMemo(
      () =>
        streamShortInfo.endTime
          ? parseDateString(streamShortInfo.endTime)
          : Date.now(),
      [streamShortInfo.endTime]
    );

    const lastFetchedRangeRef = useRef<{
      start: number | null;
      end: number | null;
    }>({
      start: null,
      end: null,
    });
    const isCurrentlyFetchingRef = useRef(false);

    const isIndoorParameterInUrl = isIndoor === "true";

    const seriesData = useMemo(() => {
      return fixedSessionTypeSelected
        ? createFixedSeriesData(
            (fixedGraphData?.measurements as Measurement[]) || []
          )
        : createMobileSeriesData(mobileGraphData, true);
    }, [fixedSessionTypeSelected, fixedGraphData, mobileGraphData]);

    const totalDuration = useMemo(
      () => endTime - startTime,
      [startTime, endTime]
    );

    const fetchMeasurementsIfNeeded = useCallback(
      debounce(async (start: number, end: number) => {
        if (!streamId || isCurrentlyFetchingRef.current) return;

        const now = Date.now();
        end = Math.min(end, now);

        if (start >= end) return;

        const { start: lastStart, end: lastEnd } = lastFetchedRangeRef.current;

        // Check if we already have the required data
        if (lastStart !== null && lastEnd !== null) {
          if (start >= lastStart && end <= lastEnd) {
            return;
          }

          // Adjust fetch range to only get missing data
          if (start < lastStart) {
            end = lastStart;
          } else if (end > lastEnd) {
            start = lastEnd;
          } else {
            return;
          }
        }

        isCurrentlyFetchingRef.current = true;

        try {
          await dispatch(
            fetchMeasurements({
              streamId,
              startTime: Math.floor(start).toString(),
              endTime: Math.floor(end).toString(),
            })
          ).unwrap();

          // Update the last fetched range
          lastFetchedRangeRef.current = {
            start: Math.min(start, lastStart ?? start),
            end: Math.max(end, lastEnd ?? end),
          };
        } catch (error) {
          console.error("Error fetching measurements:", error);
        } finally {
          isCurrentlyFetchingRef.current = false;
        }
      }, 0),
      [streamId]
    );

    // Update the useEffect to use this function
    useEffect(() => {
      if (!streamId) return;
      const currentEndTime = Date.now();
      let computedStartTime: number;

      if (fixedSessionTypeSelected) {
        switch (lastSelectedTimeRange as FixedTimeRange) {
          case FixedTimeRange.Day:
            computedStartTime = currentEndTime - MILLISECONDS_IN_A_DAY;
            break;
          case FixedTimeRange.Week:
            computedStartTime = currentEndTime - MILLISECONDS_IN_A_WEEK;
            break;
          case FixedTimeRange.Month:
            computedStartTime = currentEndTime - MILLISECONDS_IN_A_MONTH;
            break;
          case FixedTimeRange.Custom:
            computedStartTime = startTime;
            break;
          default:
            computedStartTime = currentEndTime - MILLISECONDS_IN_A_DAY;
        }
      } else {
        switch (lastSelectedTimeRange as unknown as MobileTimeRange) {
          case MobileTimeRange.FiveMinutes:
            computedStartTime = currentEndTime - MILLISECONDS_IN_A_5_MINUTES;
            break;
          case MobileTimeRange.Hour:
            computedStartTime = currentEndTime - MILLISECONDS_IN_AN_HOUR;
            break;
          case MobileTimeRange.All:
            computedStartTime = startTime;
            break;
          default:
            computedStartTime = currentEndTime - MILLISECONDS_IN_A_5_MINUTES;
        }
      }

      fetchMeasurementsIfNeeded(computedStartTime, currentEndTime);
    }, [
      streamId,
      startTime,
      fetchMeasurementsIfNeeded,
      fixedSessionTypeSelected,
    ]);

    // Ensure chart updates when new data or selected range changes
    useEffect(() => {
      if (chartComponentRef.current && chartComponentRef.current.chart) {
        const chart = chartComponentRef.current.chart;
        if (seriesData) {
          chart.series[0].setData(
            seriesData as Highcharts.PointOptionsType[],
            true,
            false,
            false
          );

          // Reapply the selected range after updating the data
          if (lastSelectedTimeRange) {
            if (chart && "rangeSelector" in chart) {
              const selectedIndex = getSelectedRangeIndex(
                lastSelectedTimeRange,
                fixedSessionTypeSelected
              );
              (chart as any).rangeSelector.clickButton(selectedIndex, true);
            }
          }
        }
      }
    }, [seriesData, lastSelectedTimeRange]);

    // Show or hide loading indicator based on isLoading
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
      if (streamId) {
        if (fixedSessionTypeSelected) {
          dispatch(resetLastSelectedTimeRange());
        } else {
          dispatch(resetLastSelectedMobileTimeRange());
        }
      }
    }, [streamId, dispatch, fixedSessionTypeSelected]);

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
          fetchMeasurementsIfNeeded
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
        liveRedraw: false,
      }),
      [isCalendarPage, isMobile]
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
                dispatch(setLastSelectedTimeRange(timeRange as FixedTimeRange));
              }
            },
          },
        },
        xAxis: {
          ...xAxisOptions,

          // Set the min and max for the x-axis based on the selected time range to show proper scrollbar
          ...(fixedSessionTypeSelected
            ? {
                min: startTime,
                max: endTime,
              }
            : {}),
        },
        yAxis: getYAxisOptions(thresholdsState, isMobile),
        series: [
          {
            ...seriesOptions(seriesData as GraphData),
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
          enabled: false,
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
