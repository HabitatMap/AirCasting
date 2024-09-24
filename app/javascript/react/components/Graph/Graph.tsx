// Graph.tsx

import HighchartsReact from "highcharts-react-official";
import Highcharts, { Chart } from "highcharts/highstock";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  fetchMeasurements,
  selectFixedData,
  selectIsLoading,
} from "../../store/fixedStreamSlice";
import { useAppDispatch } from "../../store/hooks";
import { selectMobileStreamPoints } from "../../store/mobileStreamSelectors";
import { selectThresholds } from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import {
  createFixedSeriesData,
  createMobileSeriesData,
} from "../../utils/createGraphData";
import { useMapParams } from "../../utils/mapParamsHandler";
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

    const thresholdsState = useSelector(selectThresholds);
    const isLoading = useSelector(selectIsLoading);
    const fixedGraphData = useSelector(selectFixedData);
    const mobileGraphData = useSelector(selectMobileStreamPoints);

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
      () => createFixedSeriesData(fixedGraphData?.measurements),
      [fixedGraphData]
    );

    const mobileSeriesData = useMemo(
      () => createMobileSeriesData(mobileGraphData, true),
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
        dispatch,
        streamId,
        isMaxRangeFetched,
        totalDuration,
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
        loading: { hideDuration: 1000, showDuration: 1000 },
        plotOptions: plotOptions,
        series: [
          {
            ...(seriesOptions(seriesData) as Highcharts.SeriesOptionsType), // Ensure correct type
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

    return (
      <S.Container
        ref={graphRef}
        $isCalendarPage={isCalendarPage}
        $isMobile={isMobile}
      >
        {!isLoading && seriesData.length > 0 && (
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
