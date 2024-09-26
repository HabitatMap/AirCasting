// Graph.tsx

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
import {
  fetchMeasurements,
  selectFixedData,
  selectIsLoading,
} from "../../store/fixedStreamSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { selectMobileStreamPoints } from "../../store/mobileStreamSelectors";
import { selectThresholds } from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import {
  createFixedSeriesData,
  createMobileSeriesData,
} from "../../utils/createGraphData";
import { useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";

import { gray300 } from "../../assets/styles/colors";
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
    const graphRef = useRef<HTMLDivElement>(null);

    // Hooks
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const isMobile = useMobileDetection();

    const thresholdsState = useAppSelector(selectThresholds);
    const isLoading = useAppSelector(selectIsLoading);
    const fixedGraphData = useAppSelector(selectFixedData);
    const mobileGraphData = useAppSelector(selectMobileStreamPoints);

    const { unitSymbol, measurementType, isIndoor } = useMapParams();

    // Local States
    const fixedSessionTypeSelected = sessionType === SessionTypes.FIXED;
    const [selectedRange, setSelectedRange] = useState(
      fixedSessionTypeSelected ? 0 : 2
    );
    const [isMaxRangeFetched, setIsMaxRangeFetched] = useState(false);

    const isIndoorParameterInUrl = isIndoor === "true";

    // Memoized Data
    const fixedSeriesData = useMemo(
      () => createFixedSeriesData(fixedGraphData?.measurements) || [],
      [fixedGraphData]
    );

    const mobileSeriesData = useMemo(
      () => createMobileSeriesData(mobileGraphData, true) || [],
      [mobileGraphData]
    );

    const seriesData = useMemo(
      () => (fixedSessionTypeSelected ? fixedSeriesData : mobileSeriesData),
      [fixedSessionTypeSelected, fixedSeriesData, mobileSeriesData]
    );

    // Helper Functions
    const getTimeRangeFromSelectedRange = useCallback(
      (range: number) => {
        const lastTimestamp =
          seriesData.length > 0
            ? fixedSessionTypeSelected
              ? (seriesData[seriesData.length - 1] as number[])[0]
              : (seriesData[seriesData.length - 1] as { x: number }).x
            : Date.now();

        let startTime = new Date(lastTimestamp);
        switch (range) {
          case 0:
            startTime.setHours(startTime.getHours() - 24);
            break;
          case 1:
            startTime.setDate(startTime.getDate() - 7);
            break;
          case 2:
            startTime.setDate(startTime.getDate() - 30);
            break;
          default:
            startTime = new Date(0);
        }

        return {
          startTime: startTime.getTime(),
          endTime: lastTimestamp,
        };
      },
      [seriesData, fixedSessionTypeSelected]
    );

    const totalDuration = useMemo(() => {
      if (seriesData.length === 0) return 0;
      const [first, last] = [seriesData[0], seriesData[seriesData.length - 1]];
      return fixedSessionTypeSelected
        ? (last as number[])[0] - (first as number[])[0]
        : (last as { x: number }).x - (first as { x: number }).x;
    }, [seriesData, fixedSessionTypeSelected]);

    const fetchDataForRange = useCallback(
      (range: number) => {
        if (streamId && !isMaxRangeFetched) {
          if (range === 2) {
            setIsMaxRangeFetched(true);
          }

          const { startTime, endTime } = getTimeRangeFromSelectedRange(range);
          const requiredDuration = endTime - startTime;

          if (totalDuration < requiredDuration) {
            const newStartTime = Math.min(
              startTime,
              Date.now() - totalDuration
            );

            dispatch(
              fetchMeasurements({
                streamId,
                startTime: newStartTime.toString(),
                endTime: endTime.toString(),
              })
            );
          }
        }
      },
      [
        streamId,
        isMaxRangeFetched,
        totalDuration,
        dispatch,
        getTimeRangeFromSelectedRange,
      ]
    );

    useEffect(() => {
      setIsMaxRangeFetched(false);
    }, [streamId]);

    // Configuration Options
    const xAxisOptions = useMemo(
      () =>
        getXAxisOptions(
          isMobile,
          rangeDisplayRef,
          fixedSessionTypeSelected,
          isIndoor,
          dispatch,
          isLoading,
          isIndoorParameterInUrl
        ),
      [
        isMobile,
        rangeDisplayRef,
        fixedSessionTypeSelected,
        isIndoor,
        dispatch,
        isLoading,
        isIndoorParameterInUrl,
      ]
    );

    const yAxisOption = useMemo(
      () => getYAxisOptions(thresholdsState, isMobile),
      [thresholdsState, isMobile]
    );

    const tooltipOptions = useMemo(
      () => getTooltipOptions(measurementType, unitSymbol),
      [measurementType, unitSymbol]
    );

    const rangeSelectorOptions = useMemo(
      () =>
        getRangeSelectorOptions(
          isMobile,
          fixedSessionTypeSelected,
          totalDuration,
          selectedRange,
          isCalendarPage,
          t
        ),
      [
        isMobile,
        fixedSessionTypeSelected,
        totalDuration,
        selectedRange,
        isCalendarPage,
        t,
      ]
    );

    const plotOptions = useMemo(
      () =>
        getPlotOptions(
          fixedSessionTypeSelected,
          streamId,
          dispatch,
          isIndoorParameterInUrl
        ),
      [fixedSessionTypeSelected, streamId, dispatch, isIndoorParameterInUrl]
    );

    const responsive = useMemo(
      () => getResponsiveOptions(thresholdsState, isMobile),
      [thresholdsState, isMobile]
    );

    const scrollbarOptions = useMemo(
      () => getScrollbarOptions(isCalendarPage, isMobile),
      [isCalendarPage, isMobile]
    );

    const chartOptions = useMemo(
      () => getChartOptions(isCalendarPage, isMobile),
      [isCalendarPage, isMobile]
    );

    const handleChartLoad = useCallback(
      function (this: Chart) {
        handleLoad.call(this, isCalendarPage, isMobile);
      },
      [isCalendarPage, isMobile]
    );

    const rangeSelectorButtons = useMemo(
      () =>
        rangeSelectorOptions.buttons?.map((button, i) => ({
          ...button,
          events: {
            click: () => {
              setSelectedRange(i);
              fetchDataForRange(i);
            },
          },
        })),
      [rangeSelectorOptions.buttons, fetchDataForRange]
    );

    const options: Highcharts.Options = useMemo(
      () => ({
        title: undefined,
        xAxis: xAxisOptions,
        yAxis: yAxisOption,
        loading: {
          hideDuration: 1000,
          showDuration: 1000,
          labelStyle: {
            display: "block",
            fontWeight: "bold",
            color: "gray",
          },
        },
        plotOptions: plotOptions,
        series: [
          {
            ...(seriesOptions(seriesData) as Highcharts.SeriesOptionsType),
            turboThreshold: 10000,
          },
        ],
        legend: legendOption,
        chart: {
          ...chartOptions,
          events: {
            load: handleChartLoad,
          },
        },
        responsive,
        tooltip: tooltipOptions,
        scrollbar: scrollbarOptions,
        navigator: { enabled: false },
        rangeSelector: {
          ...rangeSelectorOptions,
          buttons: rangeSelectorButtons,
        },
        noData: {
          style: {
            fontWeight: "bold",
            fontSize: "15px",
            color: gray300,
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
        xAxisOptions,
        yAxisOption,
        plotOptions,
        seriesData,
        legendOption,
        chartOptions,
        handleChartLoad,
        responsive,
        tooltipOptions,
        scrollbarOptions,
        rangeSelectorOptions,
        rangeSelectorButtons,
      ]
    );

    useEffect(() => {
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
    }, []);

    // Manage Highcharts loading state
    useEffect(() => {
      Highcharts.charts.forEach((chart) => {
        if (chart) {
          if (isLoading) {
            chart.showLoading();
          } else {
            chart.hideLoading();
          }
        }
      });
    }, [isLoading]);

    return (
      <S.Container
        ref={graphRef}
        $isCalendarPage={isCalendarPage}
        $isMobile={isMobile}
      >
        {seriesData.length > 0 && (
          <HighchartsReact
            highcharts={Highcharts}
            constructorType={"stockChart"}
            options={options}
          />
        )}
      </S.Container>
    );
  }
);

export { Graph };
