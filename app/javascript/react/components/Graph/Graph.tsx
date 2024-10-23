// Graph.tsx

import HighchartsReact from "highcharts-react-official";
import Highcharts, { Chart } from "highcharts/highstock";
import NoDataToDisplay from "highcharts/modules/no-data-to-display";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { white } from "../../assets/styles/colors";
import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import {
  fetchMeasurements,
  Measurement,
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
import { selectThresholds } from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import { GraphData } from "../../types/graph";
import { MobileStreamShortInfo as StreamShortInfo } from "../../types/mobileStream";
import { TimeRange } from "../../types/timeRange"; // Import TimeRange enum
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
    const lastSelectedTimeRange = useAppSelector(selectLastSelectedTimeRange);

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
      async (start: number, end: number) => {
        // Exit early if there's no streamId or if already fetching
        if (!streamId || isCurrentlyFetchingRef.current) {
          console.log(
            `Skipping fetch: ${!streamId ? "No streamId" : "Already fetching"}`
          );
          return;
        }

        const now = Date.now();
        end = Math.min(end, now); // Limit end time to the current time

        if (start >= end) {
          console.log(
            `Invalid time range: start (${new Date(start)}) >= end (${new Date(
              end
            )})`
          );
          return;
        }

        const { start: lastStart, end: lastEnd } = lastFetchedRangeRef.current;

        // Check if the requested range is already fetched
        if (lastStart !== null && lastEnd !== null) {
          if (start >= lastStart && end <= lastEnd) {
            console.log(
              `Data already fetched for range ${new Date(start)} to ${new Date(
                end
              )}`
            );
            return;
          }
        }

        // Adjust fetch range to avoid gaps
        const fetchStart =
          lastStart !== null ? Math.min(start, lastStart) : start;
        const fetchEnd = lastEnd !== null ? Math.max(end, lastEnd) : end;

        console.log(
          `Fetching data from ${new Date(fetchStart)} to ${new Date(fetchEnd)}`
        );

        // Set fetching state to prevent duplicates
        isCurrentlyFetchingRef.current = true;

        try {
          await dispatch(
            fetchMeasurements({
              streamId,
              startTime: Math.floor(fetchStart).toString(),
              endTime: Math.floor(fetchEnd).toString(),
            })
          ).unwrap();

          // Update the fetched range
          lastFetchedRangeRef.current = {
            start: fetchStart,
            end: fetchEnd,
          };

          console.log(
            `Updated fetched time range: ${new Date(fetchStart)} to ${new Date(
              fetchEnd
            )}`
          );
        } catch (error) {
          console.error("Error fetching measurements:", error);
        } finally {
          // Reset fetching state
          isCurrentlyFetchingRef.current = false;
        }
      },
      [dispatch, streamId]
    );

    useEffect(() => {
      if (!streamId) return;

      const currentEndTime = Date.now();
      let computedStartTime: number;

      switch (lastSelectedTimeRange) {
        case TimeRange.Hour:
          computedStartTime = currentEndTime - MILLISECONDS_IN_AN_HOUR;
          break;
        case TimeRange.Day:
          computedStartTime = currentEndTime - MILLISECONDS_IN_A_DAY;
          break;
        case TimeRange.Week:
          computedStartTime = currentEndTime - MILLISECONDS_IN_A_WEEK;
          break;
        case TimeRange.Month:
          computedStartTime = currentEndTime - MILLISECONDS_IN_A_MONTH;
          break;
        case TimeRange.Custom:
          computedStartTime = startTime;
          break;
        default:
          computedStartTime = currentEndTime - MILLISECONDS_IN_AN_HOUR;
      }

      // Run the fetch only if there's no ongoing fetch
      if (!isCurrentlyFetchingRef.current) {
        fetchMeasurementsIfNeeded(computedStartTime, currentEndTime);
      }
    }, [lastSelectedTimeRange, streamId, startTime, fetchMeasurementsIfNeeded]);

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
            redraw: function (this: Highcharts.Chart) {
              const chart = this as unknown as Highcharts.StockChart;
              const selectedButton = chart.options.rangeSelector?.selected;
              if (selectedButton !== undefined) {
                const timeRange = mapIndexToTimeRange(selectedButton);
                dispatch(setLastSelectedTimeRange(timeRange));
              }
            },
          },
        },
        xAxis: {
          ...xAxisOptions,
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
          selected: getSelectedRangeIndex(lastSelectedTimeRange),
        },
        scrollbar: {
          ...scrollbarOptions,
        },
        navigator: {
          enabled: true,
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
                lastSelectedTimeRange
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

    return (
      <S.Container $isCalendarPage={isCalendarPage} $isMobile={isMobile}>
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
