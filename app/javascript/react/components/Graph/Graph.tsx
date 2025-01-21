import HighchartsReact from "highcharts-react-official";
import Highcharts, { Chart } from "highcharts/highstock";
import NoDataToDisplay from "highcharts/modules/no-data-to-display";
import moment from "moment";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { white } from "../../assets/styles/colors";
import { RootState } from "../../store";
import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import {
  resetFixedMeasurementExtremes,
  resetLastSelectedTimeRange,
  selectFetchedTimeRanges,
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
import { MILLISECONDS_IN_A_DAY } from "../../utils/timeRanges";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { handleLoad } from "./chartEvents";
import {
  createFixedSeriesData,
  createMobileSeriesData,
} from "./chartHooks/createGraphData";
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
  selectedDateTimestamp?: number;
}

const Graph: React.FC<GraphProps> = React.memo(
  ({
    streamId,
    sessionType,
    isCalendarPage,
    rangeDisplayRef,
    selectedDateTimestamp,
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

    const measurements = useAppSelector((state: RootState) =>
      selectStreamMeasurements(state, streamId)
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

    useEffect(() => {
      // Update the time range (purely local state) when it changes
      if (lastSelectedTimeRange) {
        if (fixedSessionTypeSelected) {
          dispatch(
            setLastSelectedTimeRange(lastSelectedTimeRange as FixedTimeRange)
          );
        } else {
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

    // Reset lastSelectedTimeRange on mount (local state only, no fetch)
    useEffect(() => {
      if (fixedSessionTypeSelected) {
        dispatch(resetLastSelectedTimeRange());
      } else {
        dispatch(resetLastSelectedMobileTimeRange());
      }
    }, [dispatch, fixedSessionTypeSelected]);

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

    const savedTimeRanges = useAppSelector((state) =>
      selectFetchedTimeRanges(state, streamId)
    );

    const xAxisOptions = useMemo(
      () =>
        getXAxisOptions(
          isMobile,
          rangeDisplayRef,
          fixedSessionTypeSelected,
          dispatch,
          isLoading,
          fetchMeasurementsIfNeeded,
          streamId,
          savedTimeRanges
        ),
      [
        isMobile,
        rangeDisplayRef,
        fixedSessionTypeSelected,
        dispatch,
        isLoading,
        fetchMeasurementsIfNeeded,
        savedTimeRanges,
        streamId,
      ]
    );

    const scrollbarOptions = useMemo(
      () => ({
        ...getScrollbarOptions(isCalendarPage, isMobile),
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
          // This only sets which RangeSelector button is "highlighted"
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
        chartData,
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
        chartOptions,
      ]
    );

    // Clean up extremes on unmount (fixed streams only)
    useEffect(() => {
      return () => {
        if (fixedSessionTypeSelected && streamId) {
          dispatch(resetFixedMeasurementExtremes());
        }
      };
    }, [dispatch, fixedSessionTypeSelected, streamId]);

    // Add a new ref to track initial calendar open
    const isInitialCalendarOpen = useRef(true);
    const isInitialMount = useRef(true);
    const isFetchingSelectedDayRef = useRef(false);

    // Modify the selectedDateTimestamp effect
    useEffect(() => {
      if (selectedDateTimestamp && chartComponentRef.current?.chart) {
        const chart = chartComponentRef.current.chart;

        // Calculate the month's start/end for the chosen date
        const selectedMonth = moment(selectedDateTimestamp).month();
        const selectedYear = moment(selectedDateTimestamp).year();

        const monthStart = new Date(
          selectedYear,
          selectedMonth,
          1,
          0,
          0,
          0,
          0
        ).getTime();
        const monthEnd = new Date(
          selectedYear,
          selectedMonth + 1,
          0,
          23,
          59,
          59,
          999
        ).getTime();

        // Skip fetch on initial mount and first calendar open
        if (!isInitialMount.current && !isInitialCalendarOpen.current) {
          const hasCompleteMonthData = savedTimeRanges.some((range) => {
            const rangeCoversMonth =
              range.start <= monthStart && range.end >= monthEnd;
            return rangeCoversMonth;
          });

          if (
            !hasCompleteMonthData &&
            fixedSessionTypeSelected &&
            streamId &&
            !isFetchingSelectedDayRef.current
          ) {
            isFetchingSelectedDayRef.current = true;
            fetchMeasurementsIfNeeded(monthStart, monthEnd)
              .then(() => {
                // After fetching, force update the extremes for the selected day
                if (chart && streamId) {
                  const dayStart = selectedDateTimestamp;
                  const dayEnd = selectedDateTimestamp + MILLISECONDS_IN_A_DAY;

                  dispatch(
                    updateFixedMeasurementExtremes({
                      streamId,
                      min: dayStart,
                      max: dayEnd,
                    })
                  );

                  // Update chart extremes
                  chart.xAxis[0].setExtremes(dayStart, dayEnd);
                }
              })
              .finally(() => {
                setTimeout(() => {
                  isFetchingSelectedDayRef.current = false;
                }, 1000);
              });
          } else {
            // Even if we don't fetch, we should still update the extremes
            if (chart && streamId) {
              const dayStart = selectedDateTimestamp;
              const dayEnd = selectedDateTimestamp + MILLISECONDS_IN_A_DAY;

              dispatch(
                updateFixedMeasurementExtremes({
                  streamId,
                  min: dayStart,
                  max: dayEnd,
                })
              );

              // Update chart extremes
              chart.xAxis[0].setExtremes(dayStart, dayEnd);
            }
          }
        } else {
          // Mark initial mount and calendar open as complete
          isInitialMount.current = false;
          isInitialCalendarOpen.current = false;

          // Update extremes even on first load
          if (chart && streamId) {
            const dayStart = selectedDateTimestamp;
            const dayEnd = selectedDateTimestamp + MILLISECONDS_IN_A_DAY;

            dispatch(
              updateFixedMeasurementExtremes({
                streamId,
                min: dayStart,
                max: dayEnd,
              })
            );

            // Update chart extremes
            chart.xAxis[0].setExtremes(dayStart, dayEnd);
          }
        }
      }
    }, [
      selectedDateTimestamp,
      streamId,
      fixedSessionTypeSelected,
      savedTimeRanges,
      fetchMeasurementsIfNeeded,
      dispatch,
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
