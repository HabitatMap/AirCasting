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
import { MobileStreamShortInfo as StreamShortInfo } from "../../types/mobileStream";
import {
  createFixedSeriesData,
  createMobileSeriesData,
} from "../../utils/createGraphData";
import { parseDateString } from "../../utils/dateParser";
import { useMapParams } from "../../utils/mapParamsHandler";
import { formatTimeExtremes } from "../../utils/measurementsCalc";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { handleLoad } from "./chartEvents";
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

    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [fetchCount, setFetchCount] = useState(0);
    const MAX_FETCH_FETCHES = 10;

    const isIndoorParameterInUrl = isIndoor === "true";
    const isAirBeam = sensorName.toLowerCase().includes("airbeam");

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

    const fetchDataForRange = useCallback(
      (min: number, max: number) => {
        if (
          streamId &&
          !isFetchingMore &&
          hasMoreData &&
          fetchCount < MAX_FETCH_FETCHES
        ) {
          setIsFetchingMore(true);
          dispatch(
            fetchMeasurements({
              streamId,
              startTime: min.toString(),
              endTime: max.toString(),
            })
          )
            .unwrap()
            .then((fetchedData) => {
              if (fetchedData.length === 0) {
                setHasMoreData(false);
              } else {
                setFetchCount((prev) => prev + 1);
              }
              setIsFetchingMore(false);
            })
            .catch((error) => {
              console.error("Error fetching measurements:", error);
              setIsFetchingMore(false);
            });
        }
      },
      [
        dispatch,
        streamId,
        isFetchingMore,
        hasMoreData,
        fetchCount,
        MAX_FETCH_FETCHES,
      ]
    );

    const handleAfterSetExtremes = useCallback(
      (e: Highcharts.AxisSetExtremesEventObject) => {
        if (e.trigger === "navigator" || e.trigger === "pan") {
          const { min, max } = e;
          fetchDataForRange(min, max);
        }

        // Update time range display
        if (rangeDisplayRef?.current) {
          const { formattedMinTime, formattedMaxTime } = formatTimeExtremes(
            e.min,
            e.max
          );
          rangeDisplayRef.current.innerHTML = `
        <div class="time-container">
          <span class="date">${formattedMinTime.date ?? ""}</span>
          <span class="time">${formattedMinTime.time ?? ""}</span>
        </div>
        <span>-</span>
        <div class="time-container">
          <span class="date">${formattedMaxTime.date ?? ""}</span>
          <span class="time">${formattedMaxTime.time ?? ""}</span>
        </div>
      `;
        }
      },
      [fetchDataForRange, rangeDisplayRef]
    );

    const xAxisOptions = useMemo(
      () =>
        getXAxisOptions(
          isMobile,
          rangeDisplayRef,
          fixedSessionTypeSelected,
          dispatch,
          isLoading,
          handleAfterSetExtremes
        ),
      [
        isMobile,
        rangeDisplayRef,
        fixedSessionTypeSelected,
        dispatch,
        isLoading,
        handleAfterSetExtremes,
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
          },
        },
        xAxis: {
          ...xAxisOptions,
          min: startTime,
          max: endTime,
        },
        yAxis: getYAxisOptions(thresholdsState, isMobile),
        series: [
          {
            ...seriesOptions(seriesData || []),
          } as Highcharts.SeriesOptionsType,
        ],
        tooltip: getTooltipOptions(measurementType, unitSymbol),
        plotOptions: getPlotOptions(
          fixedSessionTypeSelected,
          streamId,
          dispatch,
          isIndoorParameterInUrl
        ),
        rangeSelector: getRangeSelectorOptions(
          isMobile,
          fixedSessionTypeSelected,
          totalDuration,
          0,
          isCalendarPage,
          t
        ),
        scrollbar: scrollbarOptions,
        navigator: {
          ...getNavigatorOptions(),
          xAxis: {
            min: startTime,
            max: endTime,
          },
        },
        responsive: getResponsiveOptions(thresholdsState, isMobile),
        legend: legendOption,
        noData: {
          style: {
            fontWeight: "bold",
            fontSize: "15px",
            color: "#cccccc",
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
        startTime,
        endTime,
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
      ]
    );

    useEffect(() => {
      setFetchCount(0);
      setHasMoreData(true);
    }, [streamId]);

    useEffect(() => {
      Highcharts.charts.forEach((chart) => {
        if (chart) {
          if (isLoading) {
            chart.showLoading("Loading data from server...");
          } else {
            chart.hideLoading();
          }
        }
      });
    }, [isLoading]);

    useEffect(() => {
      if (chartComponentRef.current && chartComponentRef.current.chart) {
        const chart = chartComponentRef.current.chart;
        if (seriesData) {
          chart.series[0].setData(
            seriesData as Highcharts.PointOptionsType[],
            true
          );
        }
      }
    }, [seriesData]);

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
