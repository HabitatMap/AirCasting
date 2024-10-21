// Graph.tsx

import { RangeSelectorButtonsOptions } from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Highcharts, { Chart } from "highcharts/highstock";
import NoDataToDisplay from "highcharts/modules/no-data-to-display";
import { debounce } from "lodash";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { white } from "../../assets/styles/colors";
import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import {
  fetchMeasurements,
  Measurement,
  selectFixedData,
  selectIsLoading,
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
import {
  createFixedSeriesData,
  createMobileSeriesData,
} from "../../utils/createGraphData";
import { parseDateString } from "../../utils/dateParser";
import { useMapParams } from "../../utils/mapParamsHandler";
import { MILLISECONDS_IN_A_MONTH } from "../../utils/timeRanges";
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

const MAX_FETCH_ATTEMPTS = 5;
const FETCH_COOLDOWN = 2000; // 2 seconds

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
    const fetchAttemptsRef = useRef(0);

    const [selectedTimeRange, setSelectedTimeRange] = useState<{
      start: number;
      end: number;
    }>({
      start: startTime,
      end: endTime,
    });

    const isIndoorParameterInUrl = isIndoor === "true";
    const isAirBeam = sensorName.toLowerCase().includes("airbeam");

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
        if (!streamId || isCurrentlyFetchingRef.current) {
          console.log(
            `Skipping fetch: ${!streamId ? "No streamId" : "Already fetching"}`
          );
          return;
        }

        const now = Date.now();
        if (end > now) {
          console.log(
            `Adjusting end time from ${new Date(end)} to current time`
          );
          end = now;
        }

        if (start >= end) {
          console.log(
            `Invalid time range: start (${new Date(start)}) >= end (${new Date(
              end
            )})`
          );
          return;
        }

        const { start: lastStart, end: lastEnd } = lastFetchedRangeRef.current;
        if (lastStart !== null && lastEnd !== null) {
          if (start >= lastStart && end <= lastEnd) {
            console.log(
              `Data already fetched for range ${new Date(start)} to ${new Date(
                end
              )}`
            );
            return;
          }
          // Adjust fetch range to include any gaps
          start = Math.min(start, lastStart);
          end = Math.max(end, lastEnd);
        }

        if (fetchAttemptsRef.current >= MAX_FETCH_ATTEMPTS) {
          console.log(
            `Max fetch attempts (${MAX_FETCH_ATTEMPTS}) reached. Cooling down.`
          );
          setTimeout(() => {
            fetchAttemptsRef.current = 0;
          }, FETCH_COOLDOWN);
          return;
        }

        console.log(
          `Fetching data from ${new Date(start)} to ${new Date(end)}`
        );
        console.log(`Timestamps: ${start} to ${end}`);

        isCurrentlyFetchingRef.current = true;
        fetchAttemptsRef.current++;

        try {
          await dispatch(
            fetchMeasurements({
              streamId,
              startTime: Math.floor(start).toString(),
              endTime: Math.floor(end).toString(),
            })
          ).unwrap();

          lastFetchedRangeRef.current = {
            start: Math.min(start, lastStart ?? Infinity),
            end: Math.max(end, lastEnd ?? -Infinity),
          };
          console.log(
            `Updated fetched time range: ${new Date(
              lastFetchedRangeRef.current.start ?? 0
            )} to ${new Date(lastFetchedRangeRef.current.end ?? 0)}`
          );
        } catch (error) {
          console.error("Error fetching measurements:", error);
        } finally {
          isCurrentlyFetchingRef.current = false;
        }
      }, 500),
      [dispatch, streamId]
    );

    useEffect(() => {
      if (selectedTimeRange.start !== null && selectedTimeRange.end !== null) {
        fetchMeasurementsIfNeeded(
          selectedTimeRange.start,
          selectedTimeRange.end
        );
      }
    }, [selectedTimeRange, fetchMeasurementsIfNeeded]);

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
      [isMobile, rangeDisplayRef, fixedSessionTypeSelected, dispatch, isLoading]
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

    const [selectedRangeButtonIndex, setSelectedRangeButtonIndex] =
      useState<RangeSelectorButtonsOptions | null>(null);

    const handleRangeSelection = useCallback(
      (event: {
        rangeSelectorButton: { index: RangeSelectorButtonsOptions };
      }) => {
        setSelectedRangeButtonIndex(event.rangeSelectorButton.index);
      },
      []
    );

    const options = useMemo<Highcharts.Options>(
      () => ({
        chart: {
          ...chartOptions,
          events: {
            load: handleChartLoad,
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
          selected:
            typeof selectedRangeButtonIndex === "number"
              ? selectedRangeButtonIndex
              : fixedSessionTypeSelected
              ? 0
              : 2,
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
        selectedRangeButtonIndex,
      ]
    );

    useEffect(() => {
      if (
        streamId &&
        fixedSessionTypeSelected &&
        isAirBeam &&
        lastFetchedRangeRef.current.start === null &&
        lastFetchedRangeRef.current.end === null
      ) {
        const now = Date.now();
        const oneMonthAgo = now - MILLISECONDS_IN_A_MONTH;
        console.log(
          "Setting initial time range:",
          new Date(oneMonthAgo),
          new Date(now)
        );
        setSelectedTimeRange({ start: oneMonthAgo, end: now });
      }
    }, [streamId, fixedSessionTypeSelected, isAirBeam]);

    // Ensure chart updates when new data is available
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
          if (selectedRangeButtonIndex !== null) {
            (chart as any).rangeSelector?.clickButton(
              selectedRangeButtonIndex,
              true
            );
          }
        }
      }
    }, [seriesData, selectedRangeButtonIndex]);

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
            options={{
              ...options,
              chart: {
                ...options.chart,
                events: {
                  ...options.chart?.events,
                  load: function (this: Highcharts.Chart) {
                    handleChartLoad.call(this);
                    (this as any).rangeSelector?.dropdown?.addEventListener(
                      "click",
                      (event: MouseEvent) => {
                        const button = (event.target as HTMLElement).closest(
                          ".highcharts-button"
                        );
                        if (button) {
                          const index = Array.from(
                            button.parentElement?.children || []
                          ).indexOf(button);
                          setSelectedRangeButtonIndex(
                            index as RangeSelectorButtonsOptions
                          );
                        }
                      }
                    );
                  },
                  redraw: function (this: Highcharts.Chart) {
                    const chart = this as unknown as Highcharts.StockChart;
                    const selectedButton =
                      chart.options.rangeSelector?.selected;
                    if (selectedButton !== undefined) {
                      setSelectedRangeButtonIndex(
                        (prev) => selectedButton as RangeSelectorButtonsOptions
                      );
                    }
                  },
                },
              },
            }}
            ref={chartComponentRef}
            immutable={false}
          />
        )}
      </S.Container>
    );
  }
);

export { Graph };
